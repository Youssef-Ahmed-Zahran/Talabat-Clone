import { queue } from "../lib/queue.js";
import { dispatchToNearestDriver } from "./dispatch.socket.js";
import prisma from "../config/db.js";

/**
 * Registers all asynchronous background workers.
 * Called immediately after socket.io is initialized, giving workers access to the `io` instance.
 * @param {object} io Socket.io Server instance
 */
export const initQueueWorkers = (io) => {
    // ── Worker 1: Driver Auto-Dispatch ─────────────────────────────────────
    // Processes finding and assigning drivers to orders. Limiting concurrency 
    // to 3 avoids overlapping database scans/pings for the same region.
    queue.registerWorker("driver_dispatch", async (payload) => {
        const { orderId, store, address } = payload;
        
        if (process.env.NODE_ENV !== "production") {
            console.log(`[Queue Worker] Executing driver_dispatch for order #${orderId}`);
        }
        
        await dispatchToNearestDriver(io, orderId, store, address);
    }, 3);

    // ── Worker 2: Order Real-Time Notifications ────────────────────────────
    // Processes notifying admins and store owners of new order events. 
    // Handled in background to keep customer checkout times down to milliseconds.
    queue.registerWorker("order_notification", async (payload) => {
        const { order, store } = payload;
        
        if (process.env.NODE_ENV !== "production") {
            console.log(`[Queue Worker] Executing order_notification for order #${order.id}`);
        }

        const { emitToAdmins, emitToOwner } = await import("./notifications.socket.js");
        
        // 1. Broadcast to admins
        emitToAdmins(io, {
            title: "New Order! 🚀",
            body: `A new order (#${order.id}) was just placed at ${store.name}!`,
            type: "ORDER_UPDATE",
            meta: { orderId: order.id, storeId: store.id }
        });

        // 2. Persist notification for Store Owner
        const owner = await prisma.ownerAccount.findFirst({
            where: { storeId: store.id, isActive: true }
        });

        if (owner) {
            await emitToOwner(io, owner.id, {
                title: "New Order Received! 🍕",
                body: `Order #${order.id} is waiting for preparation.`,
                type: "ORDER_UPDATE",
                relatedOrderId: order.id,
                meta: { orderId: order.id }
            });
        }
    }, 5);
};
