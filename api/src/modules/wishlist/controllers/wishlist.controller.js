import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { cache } from "../../../lib/cache.js";

/**
 * Toggle a store in the user's wishlist
 * POST /api/wishlist/:storeId
 */
export const toggleWishlist = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const userId = req.user.id;

        const store = await prisma.store.findUnique({
            where: { id: storeId },
        });

        if (!store) {
            throw new ApiError(404, "Store not found.");
        }

        const existing = await prisma.storeWishlist.findUnique({
            where: {
                userId_storeId: {
                    userId,
                    storeId,
                },
            },
        });

        if (existing) {
            await prisma.storeWishlist.delete({
                where: { userId_storeId: { userId, storeId } },
            });
            await cache.delPattern(`wishlist:user_${userId}:*`);
            await cache.del(`wishlist:check:user_${userId}:store_${storeId}`);
            return res.status(200).json(new ApiResponse(200, { isWishlisted: false }, "Removed from wishlist."));
        } else {
            const entry = await prisma.storeWishlist.create({
                data: { userId, storeId },
            });
            await cache.delPattern(`wishlist:user_${userId}:*`);
            await cache.del(`wishlist:check:user_${userId}:store_${storeId}`);
            return res.status(201).json(new ApiResponse(201, { isWishlisted: true, entry }, "Added to wishlist."));
        }
    } catch (err) {
        next(err);
    }
};

/**
 * Get the current user's wishlist
 * GET /api/wishlist
 */
export const getWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const cacheKey = `wishlist:user_${userId}:p_${page}:l_${limit}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.status(200).json(new ApiResponse(200, cached, "Wishlist fetched (cached)."));

        const [wishlist, total] = await Promise.all([
            prisma.storeWishlist.findMany({
                where: { userId },
                include: {
                    store: { include: { mainCategory: true, city: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),
            prisma.storeWishlist.count({ where: { userId } }),
        ]);

        const responseData = {
            wishlist,
            pagination: {
                total,
                page: Number(page),
                limit: take,
                totalPages: Math.ceil(total / take),
            },
        };

        await cache.set(cacheKey, responseData, 120); // 2 minutes
        res.status(200).json(new ApiResponse(200, responseData, "Wishlist fetched successfully."));
    } catch (err) {
        next(err);
    }
};

/**
 * Check if a store is in the user's wishlist
 * GET /api/wishlist/check/:storeId
 */
export const checkWishlistStatus = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const userId = req.user.id;
        const cacheKey = `wishlist:check:user_${userId}:store_${storeId}`;
        const cached = await cache.get(cacheKey);
        if (cached !== null) return res.status(200).json(new ApiResponse(200, cached, "Wishlist status (cached)."));

        const existing = await prisma.storeWishlist.findUnique({
            where: { userId_storeId: { userId, storeId } },
        });
        const result = { isWishlisted: !!existing };
        await cache.set(cacheKey, result, 120);
        res.status(200).json(new ApiResponse(200, result, "Wishlist status checked."));
    } catch (err) {
        next(err);
    }
};

/**
 * Clear the entire wishlist
 * DELETE /api/wishlist
 */
export const clearWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await prisma.storeWishlist.deleteMany({ where: { userId } });
        await cache.delPattern(`wishlist:user_${userId}:*`);
        await cache.delPattern(`wishlist:check:user_${userId}:*`);
        res.status(200).json(new ApiResponse(200, null, "Wishlist cleared."));
    } catch (err) {
        next(err);
    }
};
