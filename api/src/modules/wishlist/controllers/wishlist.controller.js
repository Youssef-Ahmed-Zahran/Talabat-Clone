import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { cache } from "../../../lib/cache.js";
import { detectZone } from "../../zone/controllers/zone.controller.js";

// ── Haversine distance helper ─────────────────────────────────
const toRad = (deg) => (deg * Math.PI) / 180;
const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

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
 * GET /api/wishlist?lat=&lng=
 */
export const getWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, lat, lng } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const userLat = lat ? Number(lat) : null;
        const userLng = lng ? Number(lng) : null;
        const hasLocation = userLat !== null && userLng !== null;

        // Only use cache when no location is passed (availability is location-specific)
        const cacheKey = hasLocation
            ? null
            : `wishlist:user_${userId}:p_${page}:l_${limit}`;

        if (cacheKey) {
            const cached = await cache.get(cacheKey);
            if (cached) return res.status(200).json(new ApiResponse(200, cached, "Wishlist fetched (cached)."));
        }

        const [wishlist, total] = await Promise.all([
            prisma.storeWishlist.findMany({
                where: { userId },
                include: {
                    store: {
                        include: {
                            mainCategory: true,
                            city: true,
                            storeZones: { select: { zoneId: true } },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),
            prisma.storeWishlist.count({ where: { userId } }),
        ]);

        // ── Availability check ────────────────────────────────────────────
        let userZoneStoreIds = new Set();
        if (hasLocation) {
            const zone = await detectZone(userLat, userLng);
            if (zone) {
                const storeZoneLinks = await prisma.storeZone.findMany({
                    where: { zoneId: zone.id },
                    select: { storeId: true },
                });
                userZoneStoreIds = new Set(storeZoneLinks.map((sz) => sz.storeId));
            }
        }

        const wishlistWithAvailability = wishlist.map((item) => {
            if (!hasLocation) return { ...item, isAvailable: true };

            const store = item.store;
            const inZone = userZoneStoreIds.has(store.id);
            const distanceKm = haversineKm(
                userLat, userLng,
                Number(store.latitude), Number(store.longitude)
            );
            const withinDeliveryRange =
                store.maxDeliveryDistanceKm != null &&
                distanceKm <= Number(store.maxDeliveryDistanceKm);

            return { ...item, isAvailable: inZone || withinDeliveryRange };
        });

        const responseData = {
            wishlist: wishlistWithAvailability,
            pagination: {
                total,
                page: Number(page),
                limit: take,
                totalPages: Math.ceil(total / take),
            },
        };

        if (cacheKey) await cache.set(cacheKey, responseData, 120); // 2 minutes
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
