import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

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
                where: {
                    userId_storeId: {
                        userId,
                        storeId,
                    },
                },
            });
            return res.status(200).json(new ApiResponse(200, { isWishlisted: false }, "Removed from wishlist."));
        } else {
            const entry = await prisma.storeWishlist.create({
                data: {
                    userId,
                    storeId,
                },
            });
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

        const wishlist = await prisma.storeWishlist.findMany({
            where: { userId },
            include: {
                store: {
                    include: {
                        mainCategory: true,
                        city: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json(new ApiResponse(200, wishlist, "Wishlist fetched successfully."));
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

        const existing = await prisma.storeWishlist.findUnique({
            where: {
                userId_storeId: {
                    userId,
                    storeId,
                },
            },
        });

        res.status(200).json(new ApiResponse(200, { isWishlisted: !!existing }, "Wishlist status checked."));
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

        await prisma.storeWishlist.deleteMany({
            where: { userId },
        });

        res.status(200).json(new ApiResponse(200, null, "Wishlist cleared."));
    } catch (err) {
        next(err);
    }
};
