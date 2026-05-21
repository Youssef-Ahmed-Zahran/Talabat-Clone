import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { cache } from "../../../lib/cache.js";

// ═══════════════════════════════════════════════════════════════
// SAVED CARDS
// ═══════════════════════════════════════════════════════════════

/** POST /api/payments/cards */
export const addSavedCard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { lastFour, brand, expiryMonth, expiryYear, isDefault, gatewayToken } = req.body;

        if (!lastFour || !brand || !expiryMonth || !expiryYear) {
            throw new ApiError(400, "lastFour, brand, expiryMonth, and expiryYear are required.");
        }

        // If setting as default, unset others
        if (isDefault) {
            await prisma.savedCard.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const card = await prisma.savedCard.create({
            data: {
                userId,
                lastFour,
                brand,
                expiryMonth,
                expiryYear,
                isDefault: isDefault || false,
                gatewayToken: gatewayToken || null,
            },
        });

        await cache.del(`payment:cards:user_${userId}`);

        res.status(201).json(new ApiResponse(201, card, "Card saved."));
    } catch (err) {
        next(err);
    }
};

/** GET /api/payments/cards */
export const getSavedCards = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const cacheKey = `payment:cards:user_${userId}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(new ApiResponse(200, cached, "Saved cards fetched (cached)."));

        const cards = await prisma.savedCard.findMany({
            where: { userId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        });

        await cache.set(cacheKey, cards, 300); // 5 minutes

        res.json(new ApiResponse(200, cards, "Saved cards fetched."));
    } catch (err) {
        next(err);
    }
};

/** DELETE /api/payments/cards/:id */
export const deleteSavedCard = async (req, res, next) => {
    try {
        const { id } = req.params;

        const card = await prisma.savedCard.findFirst({
            where: { id, userId: req.user.id },
        });
        if (!card) throw new ApiError(404, "Card not found.");

        await prisma.savedCard.delete({ where: { id } });

        await cache.del(`payment:cards:user_${req.user.id}`);

        res.json(new ApiResponse(200, null, "Card deleted."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/payments/cards/:id/default */
export const setDefaultCard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const card = await prisma.savedCard.findFirst({ where: { id, userId } });
        if (!card) throw new ApiError(404, "Card not found.");

        await prisma.$transaction([
            prisma.savedCard.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            }),
            prisma.savedCard.update({
                where: { id },
                data: { isDefault: true },
            }),
        ]);

        await cache.del(`payment:cards:user_${userId}`);

        res.json(new ApiResponse(200, null, "Default card updated."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// PAYMENT METHODS
// ═══════════════════════════════════════════════════════════════

/** GET /api/payments/methods */
export const getPaymentMethods = async (req, res, next) => {
    try {
        const cacheKey = "payment:methods:all";
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(new ApiResponse(200, cached, "Payment methods fetched (cached)."));

        const methods = await prisma.paymentMethod.findMany({
            orderBy: { name: "asc" },
        });

        await cache.set(cacheKey, methods, 3600); // 1 hour — payment methods almost never change

        res.json(new ApiResponse(200, methods, "Payment methods fetched."));
    } catch (err) {
        next(err);
    }
};

/** GET /api/payments/stores/:storeId/methods */
export const getStorePaymentMethods = async (req, res, next) => {
    try {
        const { storeId } = req.params;

        const cacheKey = `payment:methods:store_${storeId}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(new ApiResponse(200, cached, "Store payment methods fetched (cached)."));

        const methods = await prisma.storePaymentMethod.findMany({
            where: { storeId },
            include: {
                paymentMethod: { select: { id: true, name: true } },
            },
        });

        await cache.set(cacheKey, methods, 600); // 10 minutes

        res.json(new ApiResponse(200, methods, "Store payment methods fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE PAYMENT STATUS (Admin / System)
// ═══════════════════════════════════════════════════════════════

/** PATCH /api/payments/:orderId/status */
export const updatePaymentStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status, transactionId } = req.body;

        if (!status) throw new ApiError(400, "Status is required.");

        const payment = await prisma.payment.findUnique({ where: { orderId } });
        if (!payment) throw new ApiError(404, "Payment not found.");

        const updated = await prisma.payment.update({
            where: { orderId },
            data: {
                status,
                ...(transactionId && { transactionId }),
                ...(status === "PAID" && { paidAt: new Date() }),
            },
        });

        res.json(new ApiResponse(200, updated, "Payment status updated."));
    } catch (err) {
        next(err);
    }
};
