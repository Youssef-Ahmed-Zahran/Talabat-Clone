import { EventEmitter } from "events";

/**
 * 🚀 High-Performance Unified Cache Engine
 * Provides a production-ready cache interface that operates on an in-memory map.
 * Supports Time-to-Live (TTL) expiration, wildcard invalidation, and real-time hit/miss metrics.
 * Designed to be a drop-in replacement interface for Redis if you scale to production!
 */
class CacheEngine extends EventEmitter {
    constructor() {
        super();
        this.store = new Map();
        this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
        this.enabled = true;

        // Periodic metrics logger (logs only in development if there is activity)
        if (process.env.NODE_ENV !== "production") {
            setInterval(() => {
                const total = this.stats.hits + this.stats.misses;
                if (total > 0) {
                    const hitRate = ((this.stats.hits / total) * 100).toFixed(1);
                    console.log(
                        `⚡ [Cache Stats] Hits: ${this.stats.hits} | Misses: ${this.stats.misses} | Hit Rate: ${hitRate}% | Keys Cached: ${this.store.size}`
                    );
                }
            }, 60000).unref(); // unref prevents this timer from blocking server shutdown
        }
    }

    /**
     * Get a value from the cache
     * @param {string} key 
     * @returns {Promise<any|null>}
     */
    async get(key) {
        if (!this.enabled) return null;

        const item = this.store.get(key);
        if (!item) {
            this.stats.misses++;
            return null;
        }

        // Check if item has expired
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            this.stats.evictions++;
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        try {
            return JSON.parse(item.value);
        } catch (e) {
            return item.value; // Return as-is if parsing fails
        }
    }

    /**
     * Store a value in the cache with a specific Time-To-Live (TTL)
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlSeconds Default is 300 seconds (5 minutes)
     * @returns {Promise<boolean>}
     */
    async set(key, value, ttlSeconds = 300) {
        if (!this.enabled) return false;

        try {
            const serialized = JSON.stringify(value);
            const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
            
            this.store.set(key, {
                value: serialized,
                expiry
            });
            
            this.stats.sets++;
            return true;
        } catch (e) {
            console.error(`[Cache Set Error] Key: ${key}`, e);
            return false;
        }
    }

    /**
     * Delete a specific key from the cache
     * @param {string} key 
     * @returns {Promise<boolean>}
     */
    async del(key) {
        if (!this.enabled) return false;
        return this.store.delete(key);
    }

    /**
     * Wildcard pattern deletion of keys (e.g. "stores:*")
     * Mimics Redis CLI "del" via KEYS pattern matching.
     * @param {string} pattern 
     * @returns {Promise<number>} Number of keys deleted
     */
    async delPattern(pattern) {
        if (!this.enabled) return 0;

        let deletedCount = 0;
        try {
            // Convert Redis-style wildcard keys to a RegExp
            const regexPattern = "^" + pattern.replace(/\*/g, ".*") + "$";
            const regex = new RegExp(regexPattern);

            for (const key of this.store.keys()) {
                if (regex.test(key)) {
                    if (this.store.delete(key)) {
                        deletedCount++;
                    }
                }
            }
        } catch (err) {
            console.error(`[Cache Invalidation Error] Pattern: ${pattern}`, err);
        }

        if (deletedCount > 0 && process.env.NODE_ENV !== "production") {
            console.log(`🧹 [Cache Invalidator] Cleared ${deletedCount} cached keys matching pattern: "${pattern}"`);
        }
        return deletedCount;
    }

    /**
     * Fully flush the cache
     * @returns {Promise<boolean>}
     */
    async flush() {
        this.store.clear();
        this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
        return true;
    }
}

export const cache = new CacheEngine();
