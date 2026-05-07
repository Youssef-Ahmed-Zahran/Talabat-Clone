import prisma from "../config/db.js";
import { driverRoom, orderRoom } from "../config/socket.js";
import { emitToUser, emitToDriver } from "./notifications.socket.js";
import { emitDriverAssigned } from "./tracking.socket.js";

// ─── Haversine distance (km) ──────────────────────────────────────────────────
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Auto-reject timeout (seconds) ───────────────────────────────────────────
const DISPATCH_TIMEOUT_SEC = 60;

// Track active dispatch timers so we can cancel them on accept/reject
const dispatchTimers = new Map(); // orderId → timeoutId

/**
 * Registers all dispatch events on the /dispatch namespace.
 *
 * ── Server → Driver events ────────────────────────────────────────────────────
 *   dispatch:new_order     { order, store, userAddress, assignment }
 *     → Sent to nearest available driver when a new order is placed
 *
 * ── Driver → Server events ────────────────────────────────────────────────────
 *   dispatch:accept        { orderId }
 *     → Driver accepts the assignment
 *
 *   dispatch:reject        { orderId, reason? }
 *     → Driver rejects, system cascades to next nearest driver
 *
 * ── Server → User events (via /notifications) ────────────────────────────────
 *   Notifications are sent through the existing emitToUser helper
 *
 * @param {import("socket.io").Namespace} namespace — the /dispatch namespace
 */
export const registerDispatchSocket = (namespace) => {
    namespace.on("connection", (socket) => {
        const { role, actor } = socket.data;
        console.log(`[Dispatch] Connected — role: ${role}, id: ${actor.id}`);

        // Auto-join driver to their personal room for dispatch notifications
        if (role === "driver") {
            socket.join(driverRoom(actor.id));
            console.log(`[Dispatch] Driver ${actor.id} joined room ${driverRoom(actor.id)}`);
        }

        // ── dispatch:accept ───────────────────────────────────────────────────
        socket.on("dispatch:accept", async ({ orderId } = {}, ack) => {
            try {
                if (role !== "driver") {
                    return safeAck(ack, { success: false, message: "Only drivers can accept orders." });
                }
                if (!orderId) {
                    return safeAck(ack, { success: false, message: "orderId is required." });
                }

                const result = await acceptAssignment(namespace.server, orderId, actor.id);
                safeAck(ack, result);
            } catch (err) {
                console.error("[Dispatch] accept error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── dispatch:reject ───────────────────────────────────────────────────
        socket.on("dispatch:reject", async ({ orderId, reason } = {}, ack) => {
            try {
                if (role !== "driver") {
                    return safeAck(ack, { success: false, message: "Only drivers can reject orders." });
                }
                if (!orderId) {
                    return safeAck(ack, { success: false, message: "orderId is required." });
                }

                const result = await rejectAssignment(namespace.server, orderId, actor.id, reason);
                safeAck(ack, result);
            } catch (err) {
                console.error("[Dispatch] reject error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── Disconnect ────────────────────────────────────────────────────────
        socket.on("disconnect", (reason) => {
            console.log(`[Dispatch] Disconnected — role: ${role}, id: ${actor.id}, reason: ${reason}`);
        });
    });
};

// ═════════════════════════════════════════════════════════════════════════════
// SERVER-SIDE HELPERS — called by order controller after placeOrder
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Find the nearest available driver and send them a dispatch notification.
 * Called from placeOrder after the order + PENDING assignment are created.
 *
 * @param {import("socket.io").Server} io
 * @param {string} orderId
 * @param {object} store        — { id, name, latitude, longitude, ... }
 * @param {object} userAddress  — { latitude, longitude, street, ... }
 * @param {string[]} excludeDriverIds — drivers who already rejected this order
 */
export const dispatchToNearestDriver = async (io, orderId, store, userAddress, excludeDriverIds = []) => {
    // ── 1. Find the zone assigned to this store (if any) ─────────────────────
    const storeZoneRow = await prisma.storeZone.findFirst({
        where: { storeId: store.id },
        select: { zoneId: true },
    });
    const storeZoneId = storeZoneRow?.zoneId ?? null;

    // ── 2. Build base driver filter ──────────────────────────────────────────
    const baseWhere = {
        isOnline: true,
        status: "ONLINE",
        application: { status: "APPROVED" },
        id: { notIn: excludeDriverIds },
    };

    let availableDrivers = [];

    // ── 3. Prefer zone-assigned drivers when zone exists ─────────────────────
    if (storeZoneId) {
        const zoneDriverLinks = await prisma.driverZone.findMany({
            where: { zoneId: storeZoneId },
            select: { driverId: true },
        });
        const zoneDriverIds = zoneDriverLinks.map((l) => l.driverId);

        if (zoneDriverIds.length > 0) {
            availableDrivers = await prisma.driver.findMany({
                where: {
                    ...baseWhere,
                    id: { in: zoneDriverIds, notIn: excludeDriverIds },
                },
                select: {
                    id: true,
                    latitude: true,
                    longitude: true,
                    application: { select: { firstName: true, familyName: true } },
                },
            });
            console.log(`[Dispatch] Zone ${storeZoneId} has ${availableDrivers.length} available assigned driver(s).`);
        }
    }

    // ── 4. Fallback: any available driver (when no zone or no zone drivers) ──
    if (availableDrivers.length === 0) {
        availableDrivers = await prisma.driver.findMany({
            where: baseWhere,
            select: {
                id: true,
                latitude: true,
                longitude: true,
                application: { select: { firstName: true, familyName: true } },
            },
        });
        if (storeZoneId && availableDrivers.length > 0) {
            console.log(`[Dispatch] No zone drivers available — falling back to ${availableDrivers.length} global driver(s).`);
        }
    }

    if (availableDrivers.length === 0) {
        console.log(`[Dispatch] No available drivers for order ${orderId}`);
        // Update live tracking to WAITING_FOR_DRIVER (it should already be)
        await prisma.liveTracking.upsert({
            where: { orderId },
            update: { status: "WAITING_FOR_DRIVER", driverId: null },
            create: { orderId, status: "WAITING_FOR_DRIVER" },
        });
        return null;
    }

    // 2. Sort by distance to store
    const storeLat = Number(store.latitude);
    const storeLng = Number(store.longitude);

    availableDrivers.sort((a, b) => {
        const hasLocA = a.latitude !== null && a.longitude !== null;
        const hasLocB = b.latitude !== null && b.longitude !== null;
        if (!hasLocA && !hasLocB) return 0;
        if (!hasLocA) return 1;
        if (!hasLocB) return -1;
        return (
            haversine(Number(a.latitude), Number(a.longitude), storeLat, storeLng) -
            haversine(Number(b.latitude), Number(b.longitude), storeLat, storeLng)
        );
    });

    const nearestDriver = availableDrivers[0];
    const distanceKm = (nearestDriver.latitude && nearestDriver.longitude)
        ? haversine(Number(nearestDriver.latitude), Number(nearestDriver.longitude), storeLat, storeLng).toFixed(2)
        : null;

    console.log(`[Dispatch] Nearest driver: ${nearestDriver.id} (${distanceKm} km from store)`);

    // 3. Create or update the assignment
    const existingAssignment = await prisma.orderDriverAssignment.findUnique({
        where: { orderId },
    });

    let assignment;
    if (existingAssignment) {
        assignment = await prisma.orderDriverAssignment.update({
            where: { orderId },
            data: {
                driverId: nearestDriver.id,
                status: "PENDING",
                assignedAt: new Date(),
                acceptedAt: null,
                rejectedAt: null,
            },
        });
    } else {
        assignment = await prisma.orderDriverAssignment.create({
            data: {
                orderId,
                driverId: nearestDriver.id,
                status: "PENDING",
            },
        });
    }

    // 4. Fetch the full order details for the notification
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            subtotal: true,
            deliveryFees: true,
            tipAmount: true,
            totalAmount: true,
            deliveryInstructions: true,
            createdAt: true,
            user: { select: { fullName: true, phone: true } },
        },
    });

    // 5. Emit dispatch:new_order to the driver via Socket.io
    const payload = {
        order: {
            id: order.id,
            subtotal: order.subtotal,
            deliveryFees: order.deliveryFees,
            tipAmount: order.tipAmount,
            totalAmount: order.totalAmount,
            deliveryInstructions: order.deliveryInstructions,
            createdAt: order.createdAt,
            customerName: order.user.fullName,
            customerPhone: order.user.phone,
        },
        store: {
            id: store.id,
            name: store.name,
            latitude: Number(store.latitude),
            longitude: Number(store.longitude),
        },
        userAddress: {
            latitude: Number(userAddress.latitude),
            longitude: Number(userAddress.longitude),
            street: userAddress.street || null,
        },
        assignment: {
            id: assignment.id,
            status: assignment.status,
            assignedAt: assignment.assignedAt,
        },
        distanceToStoreKm: distanceKm,
    };

    io.of("/dispatch")
        .to(driverRoom(nearestDriver.id))
        .emit("dispatch:new_order", payload);

    // 6. Also send a persisted notification to the driver
    await emitToDriver(io, nearestDriver.id, {
        title: "New delivery request 🛵",
        body: `Order from ${store.name} — ${distanceKm ? distanceKm + " km away" : "nearby"}. Accept or reject.`,
        type: "ORDER_UPDATE",
        relatedOrderId: orderId,
        meta: { type: "DISPATCH_REQUEST", storeId: store.id },
    });

    // 7. Set auto-reject timeout — if driver doesn't respond in time, cascade
    clearDispatchTimer(orderId);
    const timer = setTimeout(async () => {
        try {
            console.log(`[Dispatch] Auto-rejecting order ${orderId} for driver ${nearestDriver.id} (timeout)`);
            await rejectAssignment(io, orderId, nearestDriver.id, "AUTO_TIMEOUT");
        } catch (err) {
            console.error("[Dispatch] Auto-reject timeout error:", err);
        }
    }, DISPATCH_TIMEOUT_SEC * 1000);

    dispatchTimers.set(orderId, timer);

    return nearestDriver;
};

// ═════════════════════════════════════════════════════════════════════════════
// ACCEPT ASSIGNMENT
// ═════════════════════════════════════════════════════════════════════════════

export const acceptAssignment = async (io, orderId, driverId) => {
    // 1. Verify assignment exists and is PENDING for this driver
    const assignment = await prisma.orderDriverAssignment.findUnique({
        where: { orderId },
    });

    if (!assignment) {
        return { success: false, message: "No assignment found for this order." };
    }
    if (assignment.driverId !== driverId) {
        return { success: false, message: "This order is not assigned to you." };
    }
    if (assignment.status !== "PENDING") {
        return { success: false, message: `Assignment is already ${assignment.status}.` };
    }

    // 2. Fetch driver's current location to populate live tracking immediately
    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: {
            id: true,
            phone: true,
            latitude: true,
            longitude: true,
            application: { select: { firstName: true, familyName: true } },
        },
    });

    if (!driver) {
        return { success: false, message: "Driver not found." };
    }

    // 3. Cancel the auto-reject timer
    clearDispatchTimer(orderId);

    // 4. Transactional update
    const order = await prisma.$transaction(async (tx) => {
        // Update assignment → ACCEPTED
        await tx.orderDriverAssignment.update({
            where: { orderId },
            data: { status: "ACCEPTED", acceptedAt: new Date() },
        });

        // Update order status → CONFIRMED
        await tx.order.update({
            where: { id: orderId },
            data: { status: "CONFIRMED" },
        });

        // Create status history
        await tx.orderStatusHistory.create({
            data: {
                orderId,
                status: "CONFIRMED",
                changedByType: "DRIVER",
                changedByDriverId: driverId,
                note: "Driver accepted the delivery.",
            },
        });

        // Create LiveTracking (or update existing) with driver's current location
        await tx.liveTracking.upsert({
            where: { orderId },
            update: {
                driverId,
                status: "DRIVER_HEADING_TO_STORE",
                driverLatitude: driver.latitude,
                driverLongitude: driver.longitude,
            },
            create: {
                orderId,
                driverId,
                status: "DRIVER_HEADING_TO_STORE",
                driverLatitude: driver.latitude,
                driverLongitude: driver.longitude,
            },
        });

        // Create Delivery record
        const existingDelivery = await tx.delivery.findUnique({ where: { orderId } });
        if (existingDelivery) {
            await tx.delivery.update({
                where: { orderId },
                data: { driverId, acceptedAt: new Date() },
            });
        } else {
            await tx.delivery.create({
                data: { orderId, driverId, acceptedAt: new Date() },
            });
        }

        // Set driver status → ON_DELIVERY
        await tx.driver.update({
            where: { id: driverId },
            data: { status: "ON_DELIVERY" },
        });

        // Create conversation between user and driver
        const existingConvo = await tx.conversation.findUnique({ where: { orderId } });
        if (!existingConvo) {
            const ord = await tx.order.findUnique({ where: { id: orderId }, select: { userId: true } });
            await tx.conversation.create({
                data: { orderId, userId: ord.userId, driverId },
            });
        }

        return tx.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                status: true,
                store: { select: { name: true } },
            },
        });
    });

    // 5. Build driver info for notifications
    const driverInfo = {
        id: driver.id,
        firstName: driver.application?.firstName || "Driver",
        familyName: driver.application?.familyName || "",
        phone: driver.phone,
    };

    // 6. Notify the user that a driver accepted
    await emitToUser(io, order.userId, {
        title: "Driver on the way! 🛵",
        body: `${driverInfo.firstName} has accepted your order from ${order.store.name} and is heading to the store.`,
        type: "ORDER_UPDATE",
        relatedOrderId: orderId,
        meta: {
            type: "DRIVER_ACCEPTED",
            driver: driverInfo,
        },
    });

    // 7. Emit tracking event to order room
    emitDriverAssigned(io, orderId, driverInfo);

    console.log(`[Dispatch] Driver ${driverId} ACCEPTED order ${orderId}`);
    return { success: true, message: "Order accepted.", orderId };
};

// ═════════════════════════════════════════════════════════════════════════════
// REJECT ASSIGNMENT
// ═════════════════════════════════════════════════════════════════════════════

export const rejectAssignment = async (io, orderId, driverId, reason = null) => {
    // 1. Verify assignment
    const assignment = await prisma.orderDriverAssignment.findUnique({
        where: { orderId },
    });

    if (!assignment) {
        return { success: false, message: "No assignment found for this order." };
    }
    if (assignment.driverId !== driverId) {
        return { success: false, message: "This order is not assigned to you." };
    }
    if (assignment.status !== "PENDING") {
        return { success: false, message: `Assignment is already ${assignment.status}.` };
    }

    // 2. Cancel the auto-reject timer
    clearDispatchTimer(orderId);

    // 3. Update assignment → REJECTED
    await prisma.orderDriverAssignment.update({
        where: { orderId },
        data: { status: "REJECTED", rejectedAt: new Date() },
    });

    console.log(`[Dispatch] Driver ${driverId} REJECTED order ${orderId} (reason: ${reason || "none"})`);

    // 4. Collect all drivers who have rejected this order
    //    We look at the assignment history — since we reuse the single row,
    //    we track rejected drivers by querying all rejected driver IDs from notifications
    //    For simplicity, we'll keep a lightweight approach: the current rejected driver
    //    is added to an exclude list stored on the order metadata.
    //    However, since we don't have a meta field on Order for this, we'll use
    //    a different approach: query all driver notifications for this order with type DISPATCH_REQUEST

    // Get the order to find store info for cascading
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            userId: true,
            store: {
                select: { id: true, name: true, latitude: true, longitude: true },
            },
            address: {
                select: { latitude: true, longitude: true, street: true },
            },
        },
    });

    if (!order) {
        return { success: false, message: "Order not found." };
    }

    // Collect all drivers who were previously notified for this order
    const previousNotifs = await prisma.driverNotification.findMany({
        where: {
            relatedOrderId: orderId,
            data: { path: ["type"], equals: "DISPATCH_REQUEST" },
        },
        select: { driverId: true },
    });

    const excludeDriverIds = [...new Set(previousNotifs.map((n) => n.driverId))];

    // 5. Try to dispatch to the next nearest driver
    const nextDriver = await dispatchToNearestDriver(
        io,
        orderId,
        order.store,
        order.address,
        excludeDriverIds
    );

    if (!nextDriver) {
        // No more drivers available — notify user
        await emitToUser(io, order.userId, {
            title: "Looking for a driver... 🔍",
            body: "We're still looking for a driver for your order. We'll notify you when one accepts.",
            type: "ORDER_UPDATE",
            relatedOrderId: orderId,
        });
    }

    return { success: true, message: "Order rejected. Looking for another driver." };
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function clearDispatchTimer(orderId) {
    const existing = dispatchTimers.get(orderId);
    if (existing) {
        clearTimeout(existing);
        dispatchTimers.delete(orderId);
    }
}

function safeAck(ack, data) {
    if (typeof ack === "function") ack(data);
}
