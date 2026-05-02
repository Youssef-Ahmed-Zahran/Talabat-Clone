import prisma from "../config/db.js";
import { userRoom, driverRoom, adminRoom } from "../config/socket.js";

/**
 * Registers all notification events on the /notifications namespace.
 *
 * Responsibilities:
 *  - Join each actor to their personal room on connect.
 *  - Allow clients to mark notifications as read (single or bulk).
 *  - Expose server-side helper `emitToUser / emitToDriver / emitToAdmin`
 *    so any other module can push a notification without importing Socket.io directly.
 *
 * Server → Client events:
 *   notification:new      { notification }          — new unread notification
 *   notification:push     { type, title, body, ... } — lightweight push (from chat, order, etc.)
 *   notification:read     { ids }                   — echo after mark-read succeeds
 *
 * Client → Server events:
 *   notification:join     (no payload)              — join personal room (called on connect)
 *   notification:mark_read  { ids?: string[] }      — mark specific IDs read; omit ids = mark all
 *   notification:fetch    { page?, limit? }, ack    — paginated fetch of stored notifications
 *
 * @param {import("socket.io").Namespace} namespace — the /notifications namespace
 */
export const registerNotificationsSocket = (namespace) => {
    namespace.on("connection", async (socket) => {
        const { role, actor } = socket.data;
        console.log(`[Notifications] Connected — role: ${role}, id: ${actor.id}`);

        // ── Auto-join personal room on connect ────────────────────────────────────
        const personalRoom = resolvePersonalRoom(role, actor);
        if (personalRoom) await socket.join(personalRoom);

        if (role === "admin") {
            await socket.join(adminRoom());
        }

        // ── notification:fetch ────────────────────────────────────────────────────
        // Fetch stored (persisted) notifications with pagination.
        // Payload: { page?: number, limit?: number }
        socket.on("notification:fetch", async ({ page = 1, limit = 20 } = {}, ack) => {
            try {
                const skip = (page - 1) * limit;

                const [items, total] = await Promise.all([
                    fetchNotifications(role, actor.id, skip, limit),
                    countNotifications(role, actor.id),
                ]);

                safeAck(ack, { success: true, notifications: items, total, page, limit });
            } catch (err) {
                console.error("[Notifications] fetch error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── notification:mark_read ─────────────────────────────────────────────────
        // Mark specific notifications (or ALL) as read.
        // Payload: { ids?: string[] }  — omit ids to mark everything as read
        socket.on("notification:mark_read", async ({ ids } = {}, ack) => {
            try {
                await markRead(role, actor.id, ids);

                // Echo back so other devices of the same user can update their badge
                namespace.to(personalRoom).emit("notification:read", { ids: ids || "all" });

                safeAck(ack, { success: true });
            } catch (err) {
                console.error("[Notifications] mark_read error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── notification:clear_all ────────────────────────────────────────────────
        // Delete ALL notifications for this user.
        socket.on("notification:clear_all", async (_, ack) => {
            try {
                await clearAllNotifications(role, actor.id);
                safeAck(ack, { success: true });
            } catch (err) {
                console.error("[Notifications] clear_all error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── Disconnect ────────────────────────────────────────────────────────────
        socket.on("disconnect", (reason) => {
            console.log(`[Notifications] Disconnected — role: ${role}, id: ${actor.id}, reason: ${reason}`);
        });
    });
};

// ═════════════════════════════════════════════════════════════════════════════
// SERVER-SIDE EMIT HELPERS
// These are imported and called by order, chat, tracking modules, etc.
// ═════════════════════════════════════════════════════════════════════════════

let _namespace = null;

/**
 * Must be called once after registerNotificationsSocket so the helpers below
 * can access the namespace. Handled automatically because registerNotificationsSocket
 * closes over `namespace`.
 *
 * Instead we lazily resolve via getNamespace().
 */
let _resolveNamespace = null;

/**
 * Emit a persisted notification to a user.
 *
 * @param {import("socket.io").Server} io
 * @param {string}   userId
 * @param {object}   data
 * @param {string}   data.title
 * @param {string}   data.body
 * @param {"ORDER_UPDATE"|"PROMOTION"|"SYSTEM"|"CHAT"} data.type
 * @param {string}  [data.relatedOrderId]
 * @param {object}  [data.meta]
 */
export const emitToUser = async (io, userId, { title, body, type, relatedOrderId, meta } = {}) => {
    // 1. Persist
    const notification = await prisma.userNotification.create({
        data: {
            userId,
            title,
            body,
            type,
            relatedOrderId: relatedOrderId ?? null,
            data: meta ?? null,
        },
    });

    // 2. Real-time push
    io.of("/notifications")
        .to(userRoom(userId))
        .emit("notification:new", { notification });

    return notification;
};

/**
 * Emit a persisted notification to a driver.
 */
export const emitToDriver = async (io, driverId, { title, body, type, relatedOrderId, meta } = {}) => {
    const notification = await prisma.driverNotification.create({
        data: {
            driverId,
            title,
            body,
            type,
            relatedOrderId: relatedOrderId ?? null,
            data: meta ?? null,
        },
    });

    io.of("/notifications")
        .to(driverRoom(driverId))
        .emit("notification:new", { notification });

    return notification;
};

/**
 * Emit a persisted notification to an owner.
 */
export const emitToOwner = async (io, ownerId, { title, body, type, relatedOrderId, meta } = {}) => {
    const notification = await prisma.ownerNotification.create({
        data: {
            ownerId,
            title,
            body,
            type,
            relatedOrderId: relatedOrderId ?? null,
            data: meta ?? null,
        },
    });

    io.of("/notifications")
        .to(`owner:${ownerId}`)
        .emit("notification:new", { notification });

    return notification;
};

/**
 * Broadcast a lightweight (non-persisted) system alert to all connected admins.
 */
export const emitToAdmins = (io, { title, body, type = "SYSTEM", meta } = {}) => {
    io.of("/notifications")
        .to(adminRoom())
        .emit("notification:new", { notification: { title, body, type, data: meta } });
};

// ═════════════════════════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function resolvePersonalRoom(role, actor) {
    if (role === "user" || role === "admin") return userRoom(actor.id);
    if (role === "driver") return driverRoom(actor.id);
    if (role === "owner") return `owner:${actor.id}`;
    return null;
}

async function fetchNotifications(role, actorId, skip, limit) {
    if (role === "user" || role === "admin") {
        return prisma.userNotification.findMany({
            where: { userId: actorId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: { id: true, title: true, body: true, type: true, isRead: true, data: true, relatedOrderId: true, createdAt: true },
        });
    }
    if (role === "driver") {
        return prisma.driverNotification.findMany({
            where: { driverId: actorId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: { id: true, title: true, body: true, type: true, isRead: true, data: true, relatedOrderId: true, createdAt: true },
        });
    }
    if (role === "owner") {
        return prisma.ownerNotification.findMany({
            where: { ownerId: actorId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: { id: true, title: true, body: true, type: true, isRead: true, data: true, relatedOrderId: true, createdAt: true },
        });
    }
    return [];
}

async function countNotifications(role, actorId) {
    if (role === "user" || role === "admin") return prisma.userNotification.count({ where: { userId: actorId } });
    if (role === "driver") return prisma.driverNotification.count({ where: { driverId: actorId } });
    if (role === "owner") return prisma.ownerNotification.count({ where: { ownerId: actorId } });
    return 0;
}

async function markRead(role, actorId, ids) {
    const hasIds = Array.isArray(ids) && ids.length > 0;

    if (role === "user" || role === "admin") {
        return prisma.userNotification.updateMany({
            where: {
                userId: actorId,
                isRead: false,
                ...(hasIds ? { id: { in: ids } } : {}),
            },
            data: { isRead: true },
        });
    }

    if (role === "driver") {
        return prisma.driverNotification.updateMany({
            where: {
                driverId: actorId,
                isRead: false,
                ...(hasIds ? { id: { in: ids } } : {}),
            },
            data: { isRead: true },
        });
    }

    if (role === "owner") {
        return prisma.ownerNotification.updateMany({
            where: {
                ownerId: actorId,
                isRead: false,
                ...(hasIds ? { id: { in: ids } } : {}),
            },
            data: { isRead: true },
        });
    }
}

async function clearAllNotifications(role, actorId) {
    if (role === "user" || role === "admin") {
        return prisma.userNotification.deleteMany({ where: { userId: actorId } });
    }
    if (role === "driver") {
        return prisma.driverNotification.deleteMany({ where: { driverId: actorId } });
    }
    if (role === "owner") {
        return prisma.ownerNotification.deleteMany({ where: { ownerId: actorId } });
    }
}

/** Safely call an ack callback — no-op if client didn't provide one. */
function safeAck(ack, data) {
    if (typeof ack === "function") ack(data);
}