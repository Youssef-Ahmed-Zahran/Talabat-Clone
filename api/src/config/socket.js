import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import prisma from "./db.js";

// ─── Singleton ────────────────────────────────────────────────────────────────
let _io = null;

/**
 * Initialise Socket.io on the given HTTP server.
 * Call this ONCE from server.js — then use getIO() everywhere else.
 *
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
export const initSocket = (httpServer) => {
    if (_io) return _io;

    _io = new Server(httpServer, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
        // Prefer WebSocket; fall back to long-polling only if needed
        transports: ["websocket", "polling"],

        // Tuning
        pingInterval: 10_000,   // 10 s
        pingTimeout: 20_000,   // 20 s
        maxHttpBufferSize: 1e6, // 1 MB max message size
    });

    // ─── Namespaces ──────────────────────────────────────────────────────────
    _io.of("/tracking").use(socketAuthMiddleware("user", "driver", "admin"));
    _io.of("/chat").use(socketAuthMiddleware("user", "driver"));
    _io.of("/notifications").use(socketAuthMiddleware("user", "driver", "admin", "owner"));
    _io.of("/dispatch").use(socketAuthMiddleware("driver"));

    // ─── Default namespace connection log ────────────────────────────────────
    _io.on("connection", (socket) => {
        console.log(`[Socket] Client connected — id: ${socket.id}`);
        socket.on("disconnect", (reason) => {
            console.log(`[Socket] Client disconnected — id: ${socket.id}, reason: ${reason}`);
        });
    });

    console.log("[Socket.io] Initialised ✓");
    return _io;
};

/**
 * Returns the Socket.io server instance.
 * Throws if initSocket() has not been called yet.
 *
 * @returns {import("socket.io").Server}
 */
export const getIO = () => {
    if (!_io) {
        throw new Error("Socket.io is not initialised. Call initSocket(httpServer) first.");
    }
    return _io;
};

// ─── Per-namespace room helpers ───────────────────────────────────────────────

/** Join the room for a specific order — used by tracking & chat namespaces. */
export const orderRoom = (orderId) => `order:${orderId}`;

/** Join the personal room for push-style notifications. */
export const userRoom = (userId) => `user:${userId}`;
export const driverRoom = (driverId) => `driver:${driverId}`;
export const adminRoom = () => "admins";

// ─── Auth middleware factory ──────────────────────────────────────────────────
const SECRETS = {
    user: () => process.env.JWT_SECRET_USER,
    driver: () => process.env.JWT_SECRET_DRIVER,
    admin: () => process.env.JWT_SECRET_ADMIN,
    owner: () => process.env.JWT_SECRET_OWNER,
};

const DB_FINDERS = {
    user: (id) => prisma.user.findUnique({ where: { id }, select: { id: true, isBlocked: true } }),
    driver: (id) => prisma.driver.findUnique({ where: { id }, select: { id: true, status: true } }),
    admin: (id) => prisma.admin.findUnique({ where: { id }, select: { id: true, isActive: true, role: true } }),
    owner: (id) => prisma.ownerAccount.findUnique({ where: { id }, select: { id: true, isActive: true, storeId: true } }),
};

/**
 * Socket.io namespace middleware that authenticates the connecting socket.
 * Token is expected in:   socket.handshake.auth.token   OR   socket.handshake.headers.authorization
 *
 * On success attaches socket.data.actor and socket.data.role.
 *
 * @param {...string} allowedRoles  Roles permitted to connect to this namespace.
 */
function socketAuthMiddleware(...allowedRoles) {
    return async (socket, next) => {
        try {
            // Extract raw token
            let raw =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization;

            if (!raw && socket.handshake.headers?.cookie) {
                const cookies = parse(socket.handshake.headers.cookie);
                raw = cookies.jwt;
            }

            if (!raw) {
                return next(new Error("AUTH_REQUIRED: No token provided."));
            }

            const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

            // Try each allowed role until one succeeds
            let decoded = null;
            let matchedRole = null;

            for (const role of allowedRoles) {
                const secret = SECRETS[role]?.();
                if (!secret) continue;
                try {
                    decoded = jwt.verify(token, secret);
                    if (allowedRoles.includes(decoded.role)) {
                        matchedRole = decoded.role;
                        break;
                    }
                } catch {
                    // Wrong secret or invalid — try next role
                }
            }

            if (!decoded || !matchedRole) {
                return next(new Error("AUTH_FAILED: Invalid or expired token."));
            }

            // Live DB check
            const actor = await DB_FINDERS[matchedRole]?.(decoded.id);
            if (!actor) return next(new Error("AUTH_FAILED: Account not found."));

            if (matchedRole === "user" && actor.isBlocked) return next(new Error("AUTH_FAILED: Account suspended."));
            if (matchedRole === "driver" && actor.status === "SUSPENDED") return next(new Error("AUTH_FAILED: Driver account suspended."));
            if ((matchedRole === "admin" || matchedRole === "owner") && !actor.isActive) return next(new Error("AUTH_FAILED: Account inactive."));

            // Attach to socket data
            socket.data.role = matchedRole;
            socket.data.actor = actor;

            next();
        } catch (err) {
            next(new Error("AUTH_ERROR: " + err.message));
        }
    };
}