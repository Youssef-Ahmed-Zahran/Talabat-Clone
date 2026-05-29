import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { tenantQuery } from "../../../lib/tenantDb.js";
import { cache } from "../../../lib/cache.js";
import { detectZone } from "../../zone/controllers/zone.controller.js";

// ═══════════════════════════════════════════════════════════════
// GLOBAL SEARCH
// GET /api/search?q=burger&lat=30.0&lng=31.2&limit=20
// ═══════════════════════════════════════════════════════════════

export const globalSearch = async (req, res, next) => {
    try {
        const { q, lat, lng, limit = 20 } = req.query;

        const query = (q || "").trim();
        if (!query || query.length < 2) {
            throw new ApiError(400, "Search query must be at least 2 characters.");
        }

        const take = Math.min(Number(limit), 50); // cap at 50

        // ── Cache key ─────────────────────────────────────────────────────────
        const latKey = lat ? Number(lat).toFixed(1) : "any";
        const lngKey = lng ? Number(lng).toFixed(1) : "any";
        const cacheKey = `search:q_${query.toLowerCase()}:lat_${latKey}:lng_${lngKey}:l_${take}`;

        const cached = await cache.get(cacheKey);
        if (cached) {
            return res.json(new ApiResponse(200, cached, "Search results (cached)."));
        }

        const userLat = lat ? Number(lat) : null;
        const userLng = lng ? Number(lng) : null;

        // ── 1. Determine zone and acceptable store IDs (if coords provided) ───
        let zoneStoreIds = [];
        let detectedZone = null;
        if (userLat && userLng) {
            detectedZone = await detectZone(userLat, userLng);
            if (detectedZone) {
                const storeZoneLinks = await prisma.storeZone.findMany({
                    where: { zoneId: detectedZone.id },
                    select: { storeId: true },
                });
                zoneStoreIds = storeZoneLinks.map((sz) => sz.storeId);
            }
        }

        // ── 2. Search stores ──────────────────────────────────────────────────
        const storeWhere = {
            isActive: true,
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { storeType: { contains: query, mode: "insensitive" } },
            ],
        };

        if (userLat && userLng) {
            storeWhere.AND = [
                {
                    OR: [
                        { id: { in: zoneStoreIds } },
                        { 
                            deliveryType: { in: ["STORE_DELIVERY", "STORE"] },
                            maxDeliveryDistanceKm: { not: null }
                        }
                    ]
                }
            ];
        }

        const stores = await prisma.store.findMany({
            where: storeWhere,
            take: userLat && userLng ? take * 2 : take, // fetch more if we need to filter locally
            orderBy: { averageRating: "desc" },
            select: {
                id: true,
                name: true,
                description: true,
                logoUrl: true,
                coverUrl: true,
                storeType: true,
                deliveryType: true,
                openTime: true,
                closeTime: true,
                deliveryTimeMinutes: true,
                minimumOrderCost: true,
                deliveryFees: true,
                maxDeliveryDistanceKm: true,
                averageRating: true,
                totalReviews: true,
                latitude: true,
                longitude: true,
                city: { select: { id: true, name: true } },
            },
        });

        // ── 3. Compute distance & locally filter for distance constraints ─────
        const toRad = (deg) => (deg * Math.PI) / 180;
        const haversine = (lat1, lng1, lat2, lng2) => {
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLng = toRad(lng2 - lng1);
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        let storesWithDistance = stores.map((s) => ({
            ...s,
            distanceKm:
                userLat && userLng
                    ? haversine(userLat, userLng, Number(s.latitude), Number(s.longitude))
                    : null,
        }));

        if (userLat && userLng) {
            storesWithDistance = storesWithDistance.filter((s) => {
                if (zoneStoreIds.includes(s.id)) return true;
                if (s.maxDeliveryDistanceKm && s.distanceKm <= Number(s.maxDeliveryDistanceKm)) return true;
                return false;
            });
            storesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
            storesWithDistance = storesWithDistance.slice(0, take);
        }

        // ── 4. Search products across all active tenant schemas in parallel ────
        // We only search stores that are within the user's delivery area.
        // For performance, we limit product search to at most 30 stores.
        const filteredStoresForProducts = userLat && userLng ? storesWithDistance : stores;
        const storeIds = filteredStoresForProducts.map((s) => s.id).slice(0, 30);

        // Build a quick lookup: storeId → store row
        const storeMap = Object.fromEntries(filteredStoresForProducts.map((s) => [s.id, s]));

        const productResults = await Promise.allSettled(
            storeIds.map(async (storeId) => {
                const products = await tenantQuery(
                    storeId,
                    `SELECT 
                        p.id,
                        p.name,
                        p.description,
                        p.price,
                        p.primary_image_url AS "imageUrl",
                        p.is_available     AS "isAvailable"
                    FROM products p
                    WHERE p.is_available = true
                    AND (
                        p.name        ILIKE $1
                        OR p.description ILIKE $1
                    )
                    LIMIT 5`,
                    [`%${query}%`]
                );
                return products.map((p) => ({ ...p, storeId, store: storeMap[storeId] }));
            })
        );

        // Flatten fulfilled product results, discard rejected (bad schemas)
        const products = productResults
            .filter((r) => r.status === "fulfilled" && r.value.length > 0)
            .flatMap((r) => r.value);

        // ── 4. Assemble response ──────────────────────────────────────────────
        const result = {
            query,
            stores: storesWithDistance,
            products,
            meta: {
                storeCount: storesWithDistance.length,
                productCount: products.length,
            },
        };

        // Cache for 60 seconds (short TTL — product availability can change fast)
        await cache.set(cacheKey, result, 60);

        res.json(new ApiResponse(200, result, "Search results fetched."));
    } catch (err) {
        next(err);
    }
};
