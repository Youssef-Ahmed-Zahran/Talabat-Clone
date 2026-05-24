import prisma from "../config/db.js";
import { orderRoom, userRoom, driverRoom } from "../config/socket.js";
import { emitToUser, emitToDriver } from "./notifications.socket.js";

// ─── Haversine distance in metres ─────────────────────────────────────────────
const haversineMetres = (lat1, lon1, lat2, lon2) => {
    const R = 6_371_000; // Earth radius in metres
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Geofence thresholds ──────────────────────────────────────────────────────
const STORE_RADIUS_M   = 200; // auto DRIVER_AT_STORE when within 200 m of store
const USER_RADIUS_M    = 150; // auto DELIVERED when within 150 m of user address

// ─── How often (ms) a ping is persisted to order_tracking ────────────────────
// Driver emits pings every ~3 s; we only write to DB every PERSIST_INTERVAL ms
// to avoid hammering Postgres with thousands of rows per delivery.
const PERSIST_INTERVAL = 15_000; // 15 seconds

// Track last-persist timestamp per orderId
const lastPersist = new Map();

/**
 * Registers all live-tracking events on the /tracking namespace.
 *
 * ── Driver emits ──────────────────────────────────────────────────────────────
 *   tracking:driver_ping     { orderId, latitude, longitude }
 *     → Updates LiveTracking row, broadcasts to order room, persists every 15 s
 *
 *   tracking:status_update   { orderId, status }
 *     → Updates Order.status + OrderStatusHistory, LiveTracking.status,
 *       broadcasts to order room, sends notifications
 *
 * ── User / Admin emits ────────────────────────────────────────────────────────
 *   tracking:join            { orderId }
 *     → Joins the order room and receives current snapshot
 *
 *   tracking:leave           { orderId }
 *     → Leaves the order room
 *
 * ── Server → Client events ────────────────────────────────────────────────────
 *   tracking:snapshot        { liveTracking }        — sent on join
 *   tracking:location        { orderId, latitude, longitude, updatedAt }
 *   tracking:status_changed  { orderId, status, liveStatus, changedAt }
 *
 * @param {import("socket.io").Namespace} namespace — the /tracking namespace
 */
export const registerTrackingSocket = (namespace) => {
    namespace.on("connection", (socket) => {
        const { role, actor } = socket.data;
        console.log(`[Tracking] Connected — role: ${role}, id: ${actor.id}`);

        // ── tracking:join ─────────────────────────────────────────────────────────
        // User (or admin) subscribes to an order's live location stream.
        // Payload: { orderId: string }
        socket.on("tracking:join", async ({ orderId } = {}, ack) => {
            try {
                if (!orderId) return safeAck(ack, { success: false, message: "orderId is required." });

                // Authorisation: user must own the order; admin always allowed
                if (role === "user") {
                    const order = await prisma.order.findUnique({
                        where: { id: orderId },
                        select: { userId: true },
                    });
                    if (!order || order.userId !== actor.id) {
                        return safeAck(ack, { success: false, message: "Access denied." });
                    }
                }

                await socket.join(orderRoom(orderId));

                // Fetch current live-tracking snapshot
                const liveTracking = await prisma.liveTracking.findUnique({
                    where: { orderId },
                    select: {
                        status: true,
                        driverLatitude: true,
                        driverLongitude: true,
                        estimatedArrival: true,
                        updatedAt: true,
                        driver: {
                            select: {
                                id: true,
                                application: {
                                    select: { firstName: true, familyName: true },
                                },
                                phone: true,
                            },
                        },
                    },
                });

                safeAck(ack, { success: true, liveTracking });
                socket.emit("tracking:snapshot", { orderId, liveTracking });

                console.log(`[Tracking] ${role}:${actor.id} joined room ${orderRoom(orderId)}`);
            } catch (err) {
                console.error("[Tracking] tracking:join error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── tracking:leave ────────────────────────────────────────────────────────
        socket.on("tracking:leave", async ({ orderId } = {}) => {
            if (orderId) await socket.leave(orderRoom(orderId));
        });

        // ── tracking:driver_ping ──────────────────────────────────────────────────
        // Driver-only: emits current GPS position during an active delivery.
        // Payload: { orderId: string, latitude: number, longitude: number }
        socket.on("tracking:driver_ping", async ({ orderId, latitude, longitude } = {}, ack) => {
            try {
                if (role !== "driver") {
                    return safeAck(ack, { success: false, message: "Only drivers can send pings." });
                }

                if (!orderId || latitude == null || longitude == null) {
                    return safeAck(ack, { success: false, message: "orderId, latitude and longitude are required." });
                }

                // Verify driver is assigned to this order
                const assignment = await prisma.orderDriverAssignment.findUnique({
                    where: { orderId },
                    select: { driverId: true, status: true },
                });

                if (!assignment || assignment.driverId !== actor.id || assignment.status !== "ACCEPTED") {
                    return safeAck(ack, { success: false, message: "You are not assigned to this order." });
                }

                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);
                const now = new Date();

                // 1. Update LiveTracking (always)
                await prisma.liveTracking.update({
                    where: { orderId },
                    data: { driverLatitude: lat, driverLongitude: lng, updatedAt: now },
                });

                // 2. Update Driver's current position
                await prisma.driver.update({
                    where: { id: actor.id },
                    data: { latitude: lat, longitude: lng },
                });

                // 3. Persist GPS ping every PERSIST_INTERVAL ms
                const lastTime = lastPersist.get(orderId) || 0;
                if (now.getTime() - lastTime >= PERSIST_INTERVAL) {
                    lastPersist.set(orderId, now.getTime());
                    await prisma.orderTracking.create({
                        data: { orderId, driverId: actor.id, latitude: lat, longitude: lng },
                    });
                }

                // 4. Broadcast to the order room (user sees the dot move)
                const payload = { orderId, latitude: lat, longitude: lng, updatedAt: now };
                namespace.to(orderRoom(orderId)).emit("tracking:location", payload);

                // 5. Geofencing — auto-advance status based on proximity
                await autoAdvanceByProximity(namespace, orderId, actor.id, lat, lng);

                safeAck(ack, { success: true });
            } catch (err) {
                console.error("[Tracking] driver_ping error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── tracking:status_update ────────────────────────────────────────────────
        // Driver (or admin) advances the order status.
        // Payload: { orderId: string, status: OrderStatus }
        socket.on("tracking:status_update", async ({ orderId, status } = {}, ack) => {
            try {
                if (!orderId || !status) {
                    return safeAck(ack, { success: false, message: "orderId and status are required." });
                }

                if (role !== "driver" && role !== "admin") {
                    return safeAck(ack, { success: false, message: "Only drivers or admins can update order status." });
                }

                // Validate status is a known enum value
                const VALID_STATUSES = [
                    "PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP",
                    "PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED",
                ];
                if (!VALID_STATUSES.includes(status)) {
                    return safeAck(ack, { success: false, message: `Invalid status: ${status}` });
                }

                // Fetch order to verify assignment & get userId
                const order = await prisma.order.findUnique({
                    where: { id: orderId },
                    select: {
                        id: true,
                        userId: true,
                        status: true,
                        store: { select: { name: true } },
                        driverAssign: { select: { driverId: true } },
                    },
                });

                if (!order) return safeAck(ack, { success: false, message: "Order not found." });

                if (role === "driver" && order.driverAssign?.driverId !== actor.id) {
                    return safeAck(ack, { success: false, message: "You are not assigned to this order." });
                }

                // ── Cancel guard: once PREPARING or beyond, nobody can cancel ────
                // Only admins can force-cancel (not drivers or users)
                if (status === "CANCELLED") {
                    const NON_CANCELLABLE = [
                        "PREPARING", "READY_FOR_PICKUP", "PICKED_UP",
                        "ON_THE_WAY", "DELIVERED",
                    ];
                    if (NON_CANCELLABLE.includes(order.status)) {
                        return safeAck(ack, {
                            success: false,
                            message: "Cannot cancel — the store has already started preparing this order.",
                        });
                    }
                }

                // Map order status → LiveTracking status
                // This reflects the driver's physical journey:
                //   Heading to store → At store → Picked up, heading to customer → Delivered
                const liveStatusMap = {
                    CONFIRMED:        "DRIVER_HEADING_TO_STORE",       // Driver accepted, heading to restaurant
                    PREPARING:        "DRIVER_HEADING_TO_STORE",       // Store cooking, driver still heading there
                    READY_FOR_PICKUP: "DRIVER_AT_STORE",              // Food ready, driver at/near store
                    PICKED_UP:        "DRIVER_HEADING_TO_CUSTOMER",   // Driver picked up, heading to customer
                    ON_THE_WAY:       "DRIVER_HEADING_TO_CUSTOMER",   // En route to customer
                    DELIVERED:        "DELIVERED",
                };
                const liveStatus = liveStatusMap[status] || null;

                // Transactional update
                await prisma.$transaction(async (tx) => {
                    // 1. Update order status
                    await tx.order.update({ where: { id: orderId }, data: { status } });

                    // 2. History entry
                    await tx.orderStatusHistory.create({
                        data: {
                            orderId,
                            status,
                            changedByType: role === "driver" ? "DRIVER" : "ADMIN",
                            changedByDriverId: role === "driver" ? actor.id : null,
                            changedByAdminId: role === "admin" ? actor.id : null,
                        },
                    });

                    // 3. Update LiveTracking status if mapped
                    if (liveStatus) {
                        await tx.liveTracking.update({
                            where: { orderId },
                            data: { status: liveStatus },
                        });
                    }

                    // 4. Delivery timestamps
                    if (status === "PICKED_UP") {
                        await tx.delivery.update({ where: { orderId }, data: { pickedUpAt: new Date() } });
                    }
                    if (status === "DELIVERED") {
                        await tx.delivery.update({ where: { orderId }, data: { deliveredAt: new Date() } });
                        // Driver back to ONLINE
                        await tx.driver.update({ where: { id: actor.id }, data: { status: "ONLINE" } });
                        // Clear last persist timer
                        lastPersist.delete(orderId);
                    }

                    // 5. If cancelled (only PENDING/CONFIRMED can reach here), release driver
                    if (status === "CANCELLED" && order.driverAssign?.driverId) {
                        await tx.orderDriverAssignment.update({
                            where: { orderId },
                            data: { status: "CANCELLED" },
                        });
                        await tx.driver.update({
                            where: { id: order.driverAssign.driverId },
                            data: { status: "ONLINE" },
                        });
                    }
                });

                const changedAt = new Date();

                // 5. Broadcast status change to the order room
                namespace.to(orderRoom(orderId)).emit("tracking:status_changed", {
                    orderId,
                    status,
                    liveStatus,
                    changedAt,
                });

                // 6. Send notification to user — descriptive messages for driver journey
                const notifMessages = {
                    CONFIRMED:        { title: "Order confirmed ✓", body: `Your driver is heading to ${order.store.name} to pick up your order.` },
                    PREPARING:        { title: "Being prepared 👨‍🍳", body: `${order.store.name} is preparing your order. Your driver is on the way to the restaurant.` },
                    READY_FOR_PICKUP: { title: "Ready for pickup 📦", body: `Your order is ready! The driver is at ${order.store.name} picking it up.` },
                    PICKED_UP:        { title: "Order picked up 🛵", body: `Your driver has picked up your order from ${order.store.name} and is heading to you!` },
                    ON_THE_WAY:       { title: "On the way to you 🚀", body: "Your driver is on the way with your order. Track them live!" },
                    DELIVERED:        { title: "Delivered! 🎉", body: `Your order from ${order.store.name} has arrived. Enjoy!` },
                    CANCELLED:        { title: "Order cancelled ❌", body: "Your order has been cancelled." },
                };

                const notif = notifMessages[status];
                if (notif) {
                    await emitToUser(namespace.server, order.userId, {
                        ...notif,
                        type: "ORDER_UPDATE",
                        relatedOrderId: orderId,
                    });
                }

                // 7. Notify driver when order is ready for pickup
                if (status === "READY_FOR_PICKUP" && order.driverAssign?.driverId) {
                    await emitToDriver(namespace.server, order.driverAssign.driverId, {
                        title: "Order ready for pickup 📦",
                        body: `Order from ${order.store.name} is ready. Pick it up now!`,
                        type: "ORDER_UPDATE",
                        relatedOrderId: orderId,
                    });
                }

                safeAck(ack, { success: true, status, changedAt });
                console.log(`[Tracking] Order ${orderId} → ${status} by ${role}:${actor.id}`);
            } catch (err) {
                console.error("[Tracking] status_update error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── Disconnect ────────────────────────────────────────────────────────────
        socket.on("disconnect", (reason) => {
            console.log(`[Tracking] Disconnected — role: ${role}, id: ${actor.id}, reason: ${reason}`);

            // NOTE: We DO NOT mark the driver as offline (isOnline: false) in the database on socket disconnect.
            // In a mobile environment, transient socket disconnects are extremely frequent (e.g. app in background,
            // lock screen, network transitions). Changing database online status on socket drop forces drivers offline
            // unexpectedly. The driver's online/offline status must only be changed via their explicit toggle in the app.
        });
    });
};

// ─── Geofencing helper ───────────────────────────────────────────────────────

/**
 * Called after every driver GPS ping.
 * Checks proximity to store / user address and auto-advances the LiveTracking
 * + Order status when the driver enters the relevant geofence.
 *
 * Transitions handled:
 *   DRIVER_HEADING_TO_STORE   + within STORE_RADIUS_M of store  → DRIVER_AT_STORE   (order → READY_FOR_PICKUP)
 *   DRIVER_HEADING_TO_CUSTOMER + within USER_RADIUS_M of address → DELIVERED          (order → DELIVERED)
 */
async function autoAdvanceByProximity(namespace, orderId, driverId, driverLat, driverLng) {
    try {
        // Fetch current tracking status + coordinates we need to compare against
        const tracking = await prisma.liveTracking.findUnique({
            where: { orderId },
            select: {
                status: true,
                order: {
                    select: {
                        userId: true,
                        store: { select: { name: true, latitude: true, longitude: true } },
                        address: { select: { latitude: true, longitude: true } },
                    },
                },
            },
        });

        if (!tracking) return;

        const { status, order } = tracking;
        const storeName = order.store.name;

        // ── Case 1: Driver heading to store → check if they've arrived ──────────
        if (status === "DRIVER_HEADING_TO_STORE") {
            const distToStore = haversineMetres(
                driverLat, driverLng,
                Number(order.store.latitude), Number(order.store.longitude)
            );

            console.log(`[Geofence] Driver ${driverId} is ${Math.round(distToStore)}m from store (threshold: ${STORE_RADIUS_M}m)`);

            if (distToStore <= STORE_RADIUS_M) {
                console.log(`[Geofence] ✅ Driver ${driverId} arrived at store for order ${orderId}`);

                await prisma.$transaction(async (tx) => {
                    await tx.liveTracking.update({
                        where: { orderId },
                        data: { status: "DRIVER_AT_STORE" },
                    });
                    await tx.order.update({
                        where: { id: orderId },
                        data: { status: "READY_FOR_PICKUP" },
                    });
                    await tx.orderStatusHistory.create({
                        data: {
                            orderId,
                            status: "READY_FOR_PICKUP",
                            changedByType: "SYSTEM",
                            note: `Auto-advanced: driver arrived within ${Math.round(distToStore)}m of store.`,
                        },
                    });
                });

                // Broadcast status change to the order room
                namespace.to(orderRoom(orderId)).emit("tracking:status_changed", {
                    orderId,
                    status: "READY_FOR_PICKUP",
                    liveStatus: "DRIVER_AT_STORE",
                    changedAt: new Date(),
                    autoAdvanced: true,
                });

                // Notify user
                await emitToUser(namespace.server, order.userId, {
                    title: "Driver at store 📍",
                    body: `Your driver has arrived at ${storeName} and is picking up your order.`,
                    type: "ORDER_UPDATE",
                    relatedOrderId: orderId,
                });

                // Notify driver
                await emitToDriver(namespace.server, driverId, {
                    title: "You're at the store ✅",
                    body: `Pick up the order from ${storeName} and head to the customer.`,
                    type: "ORDER_UPDATE",
                    relatedOrderId: orderId,
                });
            }
            return; // No need to check user proximity in this state
        }

        // ── Case 2: Driver heading to customer → check if they've arrived ───────
        if (status === "DRIVER_HEADING_TO_CUSTOMER") {
            const distToUser = haversineMetres(
                driverLat, driverLng,
                Number(order.address.latitude), Number(order.address.longitude)
            );

            console.log(`[Geofence] Driver ${driverId} is ${Math.round(distToUser)}m from customer (threshold: ${USER_RADIUS_M}m)`);

            if (distToUser <= USER_RADIUS_M) {
                console.log(`[Geofence] ✅ Driver ${driverId} arrived at customer for order ${orderId}`);

                await prisma.$transaction(async (tx) => {
                    await tx.liveTracking.update({
                        where: { orderId },
                        data: { status: "DELIVERED" },
                    });
                    await tx.order.update({
                        where: { id: orderId },
                        data: { status: "DELIVERED" },
                    });
                    await tx.orderStatusHistory.create({
                        data: {
                            orderId,
                            status: "DELIVERED",
                            changedByType: "SYSTEM",
                            note: `Auto-advanced: driver arrived within ${Math.round(distToUser)}m of customer address.`,
                        },
                    });
                    await tx.delivery.update({
                        where: { orderId },
                        data: { deliveredAt: new Date() },
                    });
                    // Driver back to ONLINE
                    await tx.driver.update({
                        where: { id: driverId },
                        data: { status: "ONLINE" },
                    });
                    lastPersist.delete(orderId);
                });

                // Broadcast status change
                namespace.to(orderRoom(orderId)).emit("tracking:status_changed", {
                    orderId,
                    status: "DELIVERED",
                    liveStatus: "DELIVERED",
                    changedAt: new Date(),
                    autoAdvanced: true,
                });

                // Notify user
                await emitToUser(namespace.server, order.userId, {
                    title: "Delivered! 🎉",
                    body: `Your order from ${storeName} has arrived. Enjoy your meal!`,
                    type: "ORDER_UPDATE",
                    relatedOrderId: orderId,
                });

                // Notify driver
                await emitToDriver(namespace.server, driverId, {
                    title: "Delivery complete 🎉",
                    body: "You have successfully delivered the order. Great job!",
                    type: "ORDER_UPDATE",
                    relatedOrderId: orderId,
                });
            }
        }
    } catch (err) {
        // Geofence errors must never crash the ping handler
        console.error("[Geofence] autoAdvanceByProximity error:", err);
    }
}

// ─── Server-side helpers (used by order module when assigning a driver) ───────

/**
 * Emit a driver-assigned event to the order room.
 * Call this from the order assignment service after writing to DB.
 *
 * @param {import("socket.io").Server} io
 * @param {string} orderId
 * @param {{ id: string, firstName: string, familyName: string, phone: string }} driver
 */
export const emitDriverAssigned = (io, orderId, driver) => {
    io.of("/tracking")
        .to(orderRoom(orderId))
        .emit("tracking:status_changed", {
            orderId,
            status: "CONFIRMED",
            liveStatus: "DRIVER_ASSIGNED",
            driver,
            changedAt: new Date(),
        });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeAck(ack, data) {
    if (typeof ack === "function") ack(data);
}