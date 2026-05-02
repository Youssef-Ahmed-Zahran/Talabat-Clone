/**
 * tenantDb.js
 *
 * Provides:
 *  - getTenantPool(storeId)                  — returns a pg Pool whose search_path is set to the store's schema
 *  - getTenantClient(storeId)                — returns a one-shot pg PoolClient scoped to the tenant schema
 *  - tenantQuery(storeId, sql, params)       — convenience query wrapper
 *  - tenantTransaction(storeId, fn)          — runs multiple statements in a single transaction
 *  - provisionTenantSchema(storeId)          — runs the universal DDL to create the schema + tables
 *  - dropTenantSchema(storeId)               — drops the entire schema (CASCADE)
 *  - schemaName(storeId)                     — returns the deterministic schema name for a storeId
 *
 * Adding a new store category (e.g. "HEALTH_BEAUTY", "ELECTRONICS") requires
 * ZERO changes here — every tenant gets the exact same universal schema.
 */

import pg from "pg";
import { getUniversalSchemaDDL } from "./tenantSql/universal.sql.js";

const { Pool } = pg;

// ─── Pool registry (one Pool per tenant schema) ───────────────────────────────
/** @type {Map<string, import('pg').Pool>} */
const pools = new Map();

/**
 * Converts a storeId into a safe, deterministic PostgreSQL schema name.
 * UUIDs contain hyphens which are not valid bare identifiers, so we strip them.
 *
 * @param {string} storeId
 * @returns {string}
 */
export function schemaName(storeId) {
    return `store_${storeId.replace(/-/g, "_")}`;
}

/**
 * Returns a cached pg Pool for the given storeId.
 * Each pool has its default search_path set to the tenant schema.
 *
 * @param {string} storeId
 * @returns {import('pg').Pool}
 */
export function getTenantPool(storeId) {
    const schema = schemaName(storeId);

    if (!pools.has(schema)) {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 5, // keep a small pool per tenant
        });

        // Neon / pgBouncer workaround:
        // pooled connections reject the `search_path` connection option.
        // Instead, we must execute SET search_path on each client connection.
        pool.on("connect", (client) => {
            client.query(`SET search_path TO "${schema}", public`).catch(err => {
                console.error(`[TenantDB] Failed to set search_path for ${schema}:`, err.message);
            });
        });

        pool.on("error", (err) => {
            console.error(`[TenantDB] Pool error for schema ${schema}:`, err.message);
        });

        pools.set(schema, pool);
    }

    return pools.get(schema);
}

/**
 * Acquires a PoolClient from the tenant pool.
 * Always call client.release() when done.
 *
 * @param {string} storeId
 * @returns {Promise<import('pg').PoolClient>}
 */
export async function getTenantClient(storeId) {
    return getTenantPool(storeId).connect();
}

/**
 * Executes a query against the tenant schema and returns the rows.
 * Convenience wrapper so callers don't need to manage client lifecycle.
 *
 * @param {string} storeId
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<any[]>}
 */
export async function tenantQuery(storeId, sql, params = []) {
    const pool = getTenantPool(storeId);
    const { rows } = await pool.query(sql, params);
    return rows;
}

/**
 * Runs multiple SQL statements inside a single transaction on the tenant schema.
 *
 * @param {string} storeId
 * @param {(client: import('pg').PoolClient) => Promise<any>} fn
 */
export async function tenantTransaction(storeId, fn) {
    const client = await getTenantClient(storeId);
    try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// ─── Schema provisioning ──────────────────────────────────────────────────────

/**
 * Creates the universal tenant schema + all tables for the given store.
 * Called once when a new Store is registered.
 *
 * Because we use a single universal DDL, this works for ANY storeType string
 * (RESTAURANT, GROCERY, PHARMACY, HEALTH_BEAUTY, ELECTRONICS, …).
 * No code change is ever required here when a new store category is added.
 *
 * @param {string} storeId
 * @param {string} [storeType] — optional; used only for the log message
 */
export async function provisionTenantSchema(storeId, storeType = "UNIVERSAL") {
    const schema = schemaName(storeId);
    const ddl = getUniversalSchemaDDL(schema);

    // Use a direct pool (not scoped to tenant yet) to run the DDL
    const adminPool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await adminPool.connect();
    try {
        await client.query(ddl);
        console.log(`[TenantDB] ✓ Provisioned schema "${schema}" (${storeType})`);
    } finally {
        client.release();
        await adminPool.end();
    }
}

/**
 * Drops the tenant schema (CASCADE) when a Store is deleted.
 * Removes the cached pool as well.
 *
 * @param {string} storeId
 */
export async function dropTenantSchema(storeId) {
    const schema = schemaName(storeId);

    const adminPool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await adminPool.connect();
    try {
        // Double-quote the schema name to handle underscores safely
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        console.log(`[TenantDB] ✓ Dropped schema "${schema}"`);
    } finally {
        client.release();
        await adminPool.end();
    }

    // Destroy the cached pool for this tenant
    if (pools.has(schema)) {
        await pools.get(schema).end();
        pools.delete(schema);
    }
}
