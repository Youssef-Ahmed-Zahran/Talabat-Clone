import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { cache } from "../../../lib/cache.js";

/**
 * POST /api/reviews/stores/:storeId/orders/:orderId
 */
export const createReview = async (req, res, next) => {
    try {
        const { storeId, orderId } = req.params;
        const userId = req.user.id;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            throw new ApiError(400, "Rating must be between 1 and 5.");
        }

        // Check order exists, belongs to user, and is delivered
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId, storeId, status: "DELIVERED" },
        });
        if (!order) {
            throw new ApiError(404, "No delivered order found for this store.");
        }

        // Check if already reviewed
        const existingReview = await prisma.storeReview.findUnique({
            where: { orderId },
        });
        if (existingReview) {
            throw new ApiError(409, "You have already reviewed this order.");
        }

        // Create review and update store rating atomically
        const review = await prisma.$transaction(async (tx) => {
            const newReview = await tx.storeReview.create({
                data: { storeId, userId, orderId, rating, comment: comment || null },
                include: {
                    user: { select: { id: true, fullName: true } },
                },
            });

            // Update store aggregate rating
            const store = await tx.store.findUnique({ where: { id: storeId } });
            const newRatingSum = store.ratingSum + rating;
            const newTotalReviews = store.totalReviews + 1;
            const newAverage = newRatingSum / newTotalReviews;

            await tx.store.update({
                where: { id: storeId },
                data: {
                    ratingSum: newRatingSum,
                    totalReviews: newTotalReviews,
                    averageRating: Math.round(newAverage * 10) / 10,
                },
            });

            return newReview;
        });

        res.status(201).json(new ApiResponse(201, review, "Review created."));

        // Bust the store's review cache so next read reflects the new review
        await cache.delPattern(`reviews:store_${storeId}:*`);
        // Also bust the store detail cache since averageRating changed
        await cache.del(`stores:detail:${storeId}`);
        await cache.delPattern("stores:all:*");
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/reviews/stores/:storeId
 */
export const getStoreReviews = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const cacheKey = `reviews:store_${storeId}:p_${page}:l_${limit}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
            return res.json(new ApiResponse(200, cached, "Reviews fetched (cached)."));
        }

        const [reviews, total] = await Promise.all([
            prisma.storeReview.findMany({
                where: { storeId },
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, fullName: true } },
                },
            }),
            prisma.storeReview.count({ where: { storeId } }),
        ]);

        // Get store rating summary
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: { averageRating: true, totalReviews: true },
        });

        const responseData = {
            reviews,
            summary: store,
            pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
        };

        await cache.set(cacheKey, responseData, 120); // 2 minutes

        res.json(new ApiResponse(200, responseData, "Reviews fetched."));
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/reviews/:reviewId
 */
export const deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;

        const review = await prisma.storeReview.findUnique({ where: { id: reviewId } });
        if (!review) throw new ApiError(404, "Review not found.");

        // Only the review author or an admin can delete
        const isOwner = req.user && review.userId === req.user.id;
        const isAdmin = !!req.admin;

        if (!isOwner && !isAdmin) {
            throw new ApiError(403, "You can only delete your own reviews.");
        }

        // Update store rating atomically
        await prisma.$transaction(async (tx) => {
            await tx.storeReview.delete({ where: { id: reviewId } });

            const store = await tx.store.findUnique({ where: { id: review.storeId } });
            const newRatingSum = store.ratingSum - review.rating;
            const newTotalReviews = store.totalReviews - 1;
            const newAverage = newTotalReviews > 0 ? newRatingSum / newTotalReviews : 0;

            await tx.store.update({
                where: { id: review.storeId },
                data: {
                    ratingSum: newRatingSum,
                    totalReviews: newTotalReviews,
                    averageRating: Math.round(newAverage * 10) / 10,
                },
            });
        });

        // Invalidate review and store detail caches
        await cache.delPattern(`reviews:store_${review.storeId}:*`);
        await cache.del(`stores:detail:${review.storeId}`);
        await cache.delPattern("stores:all:*");

        res.json(new ApiResponse(200, null, "Review deleted."));
    } catch (err) {
        next(err);
    }
};
