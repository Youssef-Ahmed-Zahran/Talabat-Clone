import prisma from "../config/db.js";
import { orderRoom, userRoom, driverRoom } from "../config/socket.js";

// ─── Typing throttle (ms) ─────────────────────────────────────────────────────
const TYPING_COOLDOWN = 2000;

/**
 * Registers all chat events on the /chat namespace.
 *
 * Flow:
 *   1. Socket connects  → authenticated by socketAuthMiddleware (in socket.js)
 *   2. Client emits  chat:join       → joins the order conversation room
 *   3. Client emits  chat:message    → saves to DB, broadcasts to room
 *   4. Client emits  chat:typing     → broadcasts typing indicator
 *   5. Client emits  chat:read       → marks messages as read in DB
 *
 * @param {import("socket.io").Namespace} namespace  — the /chat namespace
 */
export const registerChatSocket = (namespace) => {
    // Track typing cooldowns per socket to avoid DB spam
    const typingTimers = new Map();

    namespace.on("connection", (socket) => {
        const { role, actor } = socket.data;
        console.log(`[Chat] Connected — role: ${role}, id: ${actor.id}, socket: ${socket.id}`);

        // ── chat:join ─────────────────────────────────────────────────────────────
        // Client must join before sending/receiving messages.
        // Payload: { orderId: string }
        socket.on("chat:join", async ({ orderId } = {}, ack) => {
            try {
                if (!orderId) return safeAck(ack, { success: false, message: "orderId is required." });

                // Verify the conversation exists and this actor belongs to it
                const conversation = await prisma.conversation.findUnique({
                    where: { orderId },
                    select: { id: true, userId: true, driverId: true },
                });

                if (!conversation) {
                    return safeAck(ack, { success: false, message: "Conversation not found." });
                }

                const isAllowed =
                    (role === "user" && conversation.userId === actor.id) ||
                    (role === "driver" && conversation.driverId === actor.id);

                if (!isAllowed) {
                    return safeAck(ack, { success: false, message: "Access denied to this conversation." });
                }

                const room = orderRoom(orderId);
                await socket.join(room);

                // Send the last 50 messages as history on join
                const messages = await prisma.message.findMany({
                    where: { conversationId: conversation.id },
                    orderBy: { createdAt: "asc" },
                    take: 50,
                    select: {
                        id: true,
                        senderType: true,
                        senderId: true,
                        body: true,
                        isRead: true,
                        createdAt: true,
                    },
                });

                safeAck(ack, { success: true, conversationId: conversation.id, messages });
                console.log(`[Chat] ${role}:${actor.id} joined room ${room}`);
            } catch (err) {
                console.error("[Chat] chat:join error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── chat:message ──────────────────────────────────────────────────────────
        // Payload: { orderId: string, body: string }
        socket.on("chat:message", async ({ orderId, body } = {}, ack) => {
            try {
                if (!orderId || !body?.trim()) {
                    return safeAck(ack, { success: false, message: "orderId and body are required." });
                }

                const conversation = await prisma.conversation.findUnique({
                    where: { orderId },
                    select: { id: true, userId: true, driverId: true },
                });

                if (!conversation) {
                    return safeAck(ack, { success: false, message: "Conversation not found." });
                }

                const isAllowed =
                    (role === "user" && conversation.userId === actor.id) ||
                    (role === "driver" && conversation.driverId === actor.id);

                if (!isAllowed) {
                    return safeAck(ack, { success: false, message: "Access denied." });
                }

                // Persist message
                const message = await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        senderType: role === "user" ? "USER" : "DRIVER",
                        senderId: actor.id,
                        body: body.trim(),
                    },
                    select: {
                        id: true,
                        senderType: true,
                        senderId: true,
                        body: true,
                        isRead: true,
                        createdAt: true,
                    },
                });

                const room = orderRoom(orderId);
                const payload = { orderId, message };

                // Broadcast to everyone in the room (including sender for multi-device)
                namespace.to(room).emit("chat:message", payload);

                // Push notification to the OTHER party if they are not in the room
                const otherRoom =
                    role === "user"
                        ? driverRoom(conversation.driverId)
                        : userRoom(conversation.userId);

                const otherSocketsInRoom = await namespace.in(room).fetchSockets();
                const otherIsPresent = otherSocketsInRoom.some(
                    (s) => s.data.actor.id !== actor.id
                );

                if (!otherIsPresent) {
                    // Emit to the other party's personal room across all namespaces
                    // so the notifications namespace can forward a push
                    namespace.server
                        .of("/notifications")
                        .to(otherRoom)
                        .emit("notification:push", {
                            type: "CHAT",
                            title: "New message",
                            body: body.trim().slice(0, 60),
                            orderId,
                        });
                }

                safeAck(ack, { success: true, message });
            } catch (err) {
                console.error("[Chat] chat:message error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── chat:typing ───────────────────────────────────────────────────────────
        // Payload: { orderId: string, isTyping: boolean }
        socket.on("chat:typing", ({ orderId, isTyping } = {}) => {
            if (!orderId) return;

            // Throttle: don't spam "typing" events
            if (isTyping) {
                const key = `${socket.id}:${orderId}`;
                if (typingTimers.has(key)) return; // still in cooldown

                typingTimers.set(key, setTimeout(() => typingTimers.delete(key), TYPING_COOLDOWN));
            }

            socket
                .to(orderRoom(orderId))
                .emit("chat:typing", { orderId, role, senderId: actor.id, isTyping });
        });

        // ── chat:read ─────────────────────────────────────────────────────────────
        // Mark all messages in a conversation as read.
        // Payload: { orderId: string }
        socket.on("chat:read", async ({ orderId } = {}, ack) => {
            try {
                if (!orderId) return safeAck(ack, { success: false, message: "orderId is required." });

                const conversation = await prisma.conversation.findUnique({
                    where: { orderId },
                    select: { id: true, userId: true, driverId: true },
                });

                if (!conversation) return safeAck(ack, { success: false, message: "Conversation not found." });

                // Mark messages sent by the OTHER party as read
                const senderType = role === "user" ? "DRIVER" : "USER";
                await prisma.message.updateMany({
                    where: {
                        conversationId: conversation.id,
                        senderType,
                        isRead: false,
                    },
                    data: { isRead: true },
                });

                // Notify the other party that their messages were read
                socket
                    .to(orderRoom(orderId))
                    .emit("chat:read", { orderId, readBy: role, readerId: actor.id });

                safeAck(ack, { success: true });
            } catch (err) {
                console.error("[Chat] chat:read error:", err);
                safeAck(ack, { success: false, message: "Server error." });
            }
        });

        // ── Disconnect ────────────────────────────────────────────────────────────
        socket.on("disconnect", (reason) => {
            // Clean up any typing timers for this socket
            for (const key of typingTimers.keys()) {
                if (key.startsWith(socket.id)) typingTimers.delete(key);
            }
            console.log(`[Chat] Disconnected — role: ${role}, id: ${actor.id}, reason: ${reason}`);
        });
    });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely call an ack callback — no-op if the client didn't provide one. */
function safeAck(ack, data) {
    if (typeof ack === "function") ack(data);
}