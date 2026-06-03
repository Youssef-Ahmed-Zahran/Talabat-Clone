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
 *
 * FIX (race condition): tenantQuery now uses BEGIN + SET LOCAL + COMMIT so the
 * search_path is scoped to the transaction only. When the connection is returned
 * to the pool its search_path resets automatically, eliminating the bug where a
 * recycled connection from store_X bleeds into a query for store_Y under
 * Promise.all parallelism.
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

        pool.on("error", (err) => {
            console.error(`[TenantDB] Pool error for schema ${schema}:`, err.message);
        });

        pools.set(schema, pool);
    }

    return pools.get(schema);
}

/**
 * Acquires a PoolClient from the tenant pool with the correct search_path
 * explicitly set and AWAITED before the client is returned.
 *
 * This prevents the race condition where pool.on("connect") fires an async
 * SET search_path that isn't awaited, causing queries to run against the
 * wrong (public) schema.
 *
 * NOTE: This client is owned by the caller until client.release() is called.
 * For fire-and-forget single queries, prefer tenantQuery() which handles
 * the full lifecycle automatically using SET LOCAL inside a transaction.
 *
 * @param {string} storeId
 * @returns {Promise<import('pg').PoolClient>}
 */
export async function getTenantClient(storeId) {
    const schema = schemaName(storeId);
    const client = await getTenantPool(storeId).connect();
    // Explicitly await search_path before returning.
    // Using SET (not SET LOCAL) here is intentional — the caller owns this
    // client for its full lifetime and is responsible for releasing it.
    await client.query(`SET search_path TO "${schema}", public`);
    return client;
}

/**
 * Executes a query against the tenant schema and returns the rows.
 *
 * Uses BEGIN + SET LOCAL + COMMIT so the search_path is scoped to this
 * transaction only. When the connection is returned to the pool its
 * search_path resets automatically, which eliminates the race condition
 * that occurred under Promise.all when a recycled connection from store_X
 * would bleed into a query intended for store_Y.
 *
 * @param {string} storeId
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<any[]>}
 */
export async function tenantQuery(storeId, sql, params = []) {
    const schema = schemaName(storeId);
    const client = await getTenantPool(storeId).connect();
    try {
        await client.query("BEGIN");
        // SET LOCAL scopes the search_path to this transaction only.
        // When the transaction ends (COMMIT or ROLLBACK) the connection
        // reverts to its pool-default search_path automatically.
        // This is the correct fix for the parallel-query race condition.
        await client.query(`SET LOCAL search_path TO "${schema}", public`);
        const { rows } = await client.query(sql, params);
        await client.query("COMMIT");
        return rows;
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Runs multiple SQL statements inside a single transaction on the tenant schema.
 *
 * SET LOCAL is used so the search_path is automatically reset when the
 * transaction ends and the connection is returned to the pool.
 *
 * @param {string} storeId
 * @param {(client: import('pg').PoolClient) => Promise<any>} fn
 */
export async function tenantTransaction(storeId, fn) {
    const schema = schemaName(storeId);
    const client = await getTenantPool(storeId).connect();
    try {
        await client.query("BEGIN");
        // SET LOCAL — scoped to this transaction, resets on COMMIT/ROLLBACK.
        await client.query(`SET LOCAL search_path TO "${schema}", public`);
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
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