import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

// ─── Config & utils ───────────────────────────────────────────────────────────
import prisma from "./config/db.js";
import { initSocket } from "./config/socket.js";

// ─── Global middlewares ───────────────────────────────────────────────────────
import { errorHanlder } from "./middlewares/error.middleware.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";

// ─── Socket handlers ──────────────────────────────────────────────────────────
import { registerTrackingSocket } from "./sockets/tracking.socket.js";
import { registerChatSocket } from "./sockets/chat.socket.js";
import { registerNotificationsSocket } from "./sockets/notifications.socket.js";
import { registerDispatchSocket } from "./sockets/dispatch.socket.js";

// ─── Route modules ────────────────────────────────────────────────────────────
import authRoutes from "./modules/auth/routes/auth.routes.js";
import userRoutes from "./modules/user/routes/user.routes.js";


// ═════════════════════════════════════════════════════════════════════════════
// APP BOOTSTRAP
// ═════════════════════════════════════════════════════════════════════════════

const app = express();
const httpServer = http.createServer(app);

// ─── Trust proxy (for accurate IPs behind Nginx / ELB) ───────────────────────
app.set("trust proxy", 1);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── Request logger ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Global rate limiter (applied to all API routes) ─────────────────────────
app.use("/api", apiLimiter);

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);


// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
    res.json({
        status: "ok",
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    })
);

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Global error handler (must be LAST) ─────────────────────────────────────
app.use(errorHanlder);

// ═════════════════════════════════════════════════════════════════════════════
// SOCKET.IO
// ═════════════════════════════════════════════════════════════════════════════

const io = initSocket(httpServer);

// Wire up socket handlers per namespace
registerTrackingSocket(io.of("/tracking"));
registerChatSocket(io.of("/chat"));
registerNotificationsSocket(io.of("/notifications"));
registerDispatchSocket(io.of("/dispatch"));

// ═════════════════════════════════════════════════════════════════════════════
// START SERVER
// ═════════════════════════════════════════════════════════════════════════════

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

// ─── Tenant schema warm-up ────────────────────────────────────────────────────
/**
 * Pre-warms every store's tenant schema by running a lightweight query.
 * Called once on startup and repeated every 4 minutes.
 * This prevents Neon's serverless compute from pausing between requests,
 * eliminating the 2-4 second cold-start latency on store details pages.
 */
const warmupTenantSchemas = async () => {
    try {
        const { tenantQuery } = await import("./lib/tenantDb.js");
        const stores = await prisma.store.findMany({ select: { id: true, name: true } });
        if (!stores.length) return;

        await Promise.all(
            stores.map(async (s) => {
                try {
                    await tenantQuery(s.id, `SELECT 1`);
                } catch {
                    // Schema may not exist for this store yet — ignore
                }
            })
        );
        console.log(`[TenantDB] Warm-up complete for ${stores.length} store schema(s).`);
    } catch {
        // Never crash the server over a warm-up failure
    }
};

const start = async () => {
    try {
        // Verify Prisma can reach the DB before accepting traffic
        await prisma.$connect();
        console.log("[Prisma] Database connected ✓");

        // ── Keep Neon serverless compute warm ─────────────────────────────────
        // Neon pauses database compute after ~5 min of inactivity, causing a
        // 2-4s cold-start on the next request. We prevent this by:
        // 1. Running a warm-up query on startup (non-blocking).
        // 2. Repeating it every 4 minutes to keep compute alive.
        const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

        // Fire-and-forget on startup (don't block the server from listening)
        warmupTenantSchemas().catch(() => {});

        setInterval(async () => {
            try {
                await prisma.$queryRaw`SELECT 1`;
            } catch {
                // Silently ignore — server health is unaffected
            }
            // Also keep tenant schemas warm
            warmupTenantSchemas().catch(() => {});
        }, KEEP_ALIVE_INTERVAL_MS);

        httpServer.listen(PORT, HOST, () => {
            console.log(`[Server] Running on http://${HOST}:${PORT}  (${process.env.NODE_ENV || "development"})`);
        });
    } catch (err) {
        console.error("[Server] Failed to start:", err);
        process.exit(1);
    }
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received — shutting down gracefully…`);
    httpServer.close(async () => {
        await prisma.$disconnect();
        console.log("[Server] Shutdown complete.");
        process.exit(0);
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Unhandled errors — log & exit so the process manager can restart
process.on("unhandledRejection", (reason) => {
    console.error("[Server] Unhandled Rejection:", reason);
    process.exit(1);
});
process.on("uncaughtException", (err) => {
    console.error("[Server] Uncaught Exception:", err);
    process.exit(1);
});

start();

export { app, httpServer, io };