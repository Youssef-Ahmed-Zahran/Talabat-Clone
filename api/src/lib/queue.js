import { EventEmitter } from "events";

/**
 * 📦 Robust In-Memory Background Job Queue Manager
 * Features:
 * - Concurrency control per job type (prevent thread/API starvation).
 * - Automatic retries with exponential backoff.
 * - Real-time execution tracking and terminal visual logs.
 * - Simple plugin interface to easily adapt to BullMQ (Redis) or RabbitMQ in the future!
 */
class JobQueueManager extends EventEmitter {
    constructor() {
        super();
        this.workers = new Map(); // Registered job handlers
        this.queues = new Map();  // Queued jobs per type
        this.activeCount = new Map(); // Number of running jobs per type
        this.concurrencyLimits = new Map(); // Concurrency settings per type
        
        // Default concurrency limits
        this.defaultConcurrency = 2;
    }

    /**
     * Register a worker to handle jobs of a specific type
     * @param {string} type Job type name
     * @param {Function} handler Async worker function
     * @param {number} concurrency Maximum concurrent executions (defaults to 2)
     */
    registerWorker(type, handler, concurrency = 2) {
        this.workers.set(type, handler);
        this.queues.set(type, []);
        this.activeCount.set(type, 0);
        this.concurrencyLimits.set(type, concurrency);
        console.log(`👷 [Queue System] Registered worker for job type: "${type}" (max concurrency: ${concurrency})`);
    }

    /**
     * Enqueue a new job
     * @param {string} type Job type
     * @param {object} payload Argument object for the worker
     * @param {object} options Queue options (retries, delay)
     */
    async add(type, payload, options = {}) {
        if (!this.workers.has(type)) {
            throw new Error(`[Queue Error] No worker registered to handle job type: "${type}"`);
        }

        const job = {
            id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type,
            payload,
            retriesLeft: options.retries !== undefined ? options.retries : 3,
            maxRetries: options.retries !== undefined ? options.retries : 3,
            backoffMs: options.backoffMs || 2000,
            createdAt: new Date(),
            attempts: 0
        };

        this.queues.get(type).push(job);
        
        if (process.env.NODE_ENV !== "production") {
            console.log(`📥 [Queue] Job Added [${job.id}] (Type: ${type}). Queue size: ${this.queues.get(type).length}`);
        }

        // Trigger processing immediately in a non-blocking tick
        process.nextTick(() => this._process(type));

        return job.id;
    }

    /**
     * Internal processor loop for a specific job type queue
     */
    async _process(type) {
        const queue = this.queues.get(type);
        const active = this.activeCount.get(type);
        const limit = this.concurrencyLimits.get(type) || this.defaultConcurrency;

        // If queue is empty or we hit concurrency limit, halt
        if (!queue || queue.length === 0 || active >= limit) {
            return;
        }

        // Dequeue next job
        const job = queue.shift();
        this.activeCount.set(type, active + 1);

        job.attempts++;
        if (process.env.NODE_ENV !== "production") {
            console.log(`🚀 [Queue] Processing Job [${job.id}] (Attempt ${job.attempts}/${job.maxRetries + 1})`);
        }

        try {
            const handler = this.workers.get(type);
            
            // Execute the worker async function
            await handler(job.payload);
            
            // Job Succeeded!
            this.activeCount.set(type, this.activeCount.get(type) - 1);
            this.emit("completed", job.id);
            
            if (process.env.NODE_ENV !== "production") {
                console.log(`✅ [Queue] Job Completed Successfully [${job.id}]`);
            }
        } catch (err) {
            // Job Failed!
            this.activeCount.set(type, this.activeCount.get(type) - 1);
            console.error(`❌ [Queue Error] Job Failed [${job.id}]:`, err.message);

            if (job.retriesLeft > 0) {
                job.retriesLeft--;
                
                // Exponential backoff
                const delay = job.backoffMs * Math.pow(2, job.attempts - 1);
                
                if (process.env.NODE_ENV !== "production") {
                    console.log(`⏳ [Queue] Re-queuing Job [${job.id}] in ${delay}ms (${job.retriesLeft} retries left)`);
                }

                setTimeout(() => {
                    this.queues.get(type).push(job);
                    this._process(type);
                }, delay);
            } else {
                this.emit("failed", job.id, err);
                console.error(`🚨 [Queue Fatal] Job [${job.id}] permanently failed after all retry attempts.`);
            }
        }

        // Fetch next item in queue
        process.nextTick(() => this._process(type));
    }
}

export const queue = new JobQueueManager();
