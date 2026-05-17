import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { getIO, orderRoom } from "../../../config/socket.js";

// ═══════════════════════════════════════════════════════════════
// GET CONVERSATION BY ORDER ID
// Accessible by: the user who placed the order OR the assigned driver
// ═══════════════════════════════════════════════════════════════

/** GET /api/messaging/conversations/:orderId */
export const getConversationByOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const conversation = await prisma.conversation.findUnique({
            where: { orderId },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!conversation) {
            throw new ApiError(404, "No conversation found for this order. A driver may not have been assigned yet.");
        }

        // Authorization: only the order's user or assigned driver
        const isUser   = req.user   && req.user.id   === conversation.userId;
        const isDriver = req.driver && req.driver.id === conversation.driverId;

        if (!isUser && !isDriver) {
            throw new ApiError(403, "You are not authorized to access this conversation.");
        }

        res.json(new ApiResponse(200, conversation, "Conversation fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET ALL MESSAGES IN A CONVERSATION
// Accessible by: the user or the driver of that conversation
// ═══════════════════════════════════════════════════════════════

/** GET /api/messaging/conversations/:conversationId/messages */
export const getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) throw new ApiError(404, "Conversation not found.");

        // Authorization
        const isUser   = req.user   && req.user.id   === conversation.userId;
        const isDriver = req.driver && req.driver.id === conversation.driverId;

        if (!isUser && !isDriver) {
            throw new ApiError(403, "Not authorized to view this conversation.");
        }

        // Mark incoming messages as read for the current viewer
        const viewerSenderType = req.user ? "USER" : "DRIVER";
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderType: viewerSenderType === "USER" ? "DRIVER" : "USER",
                isRead: false,
            },
            data: { isRead: true },
        });

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where: { conversationId },
                skip,
                take: Number(limit),
                orderBy: { createdAt: "asc" },
            }),
            prisma.message.count({ where: { conversationId } }),
        ]);

        res.json(new ApiResponse(200, {
            messages,
            pagination: {
                total,
                page:       Number(page),
                limit:      Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Messages fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// SEND A MESSAGE
// Accessible by: the user or the driver of that conversation
// ═══════════════════════════════════════════════════════════════

/** POST /api/messaging/conversations/:conversationId/messages */
export const sendMessage = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { body: messageBody } = req.body;

        if (!messageBody || !messageBody.trim()) {
            throw new ApiError(400, "Message body is required.");
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) throw new ApiError(404, "Conversation not found.");

        let senderType;
        let senderId;

        if (req.user) {
            if (conversation.userId !== req.user.id) {
                throw new ApiError(403, "This is not your conversation.");
            }
            senderType = "USER";
            senderId   = req.user.id;
        } else if (req.driver) {
            if (conversation.driverId !== req.driver.id) {
                throw new ApiError(403, "This is not your conversation.");
            }
            senderType = "DRIVER";
            senderId   = req.driver.id;
        } else {
            throw new ApiError(401, "Unauthorized.");
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderType,
                senderId,
                body: messageBody.trim(),
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

        // Broadcast the new message to the socket room so real-time clients update instantly
        try {
            const io = getIO();
            const room = orderRoom(conversation.orderId);
            io.of("/chat").to(room).emit("chat:message", { orderId: conversation.orderId, message });
        } catch (socketErr) {
            console.error("[Chat HTTP] Failed to emit socket event:", socketErr);
        }

        res.status(201).json(new ApiResponse(201, message, "Message sent."));
    } catch (err) {
        next(err);
    }
};
