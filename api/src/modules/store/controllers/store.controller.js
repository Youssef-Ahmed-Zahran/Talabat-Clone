import bcrypt from "bcryptjs";
import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../../utils/cloudinaryUpload.js";
import { resolveGeographyData } from "../../../utils/geography.util.js";
import { provisionTenantSchema, dropTenantSchema, tenantQuery } from "../../../lib/tenantDb.js";
import { detectZone } from "../../zone/controllers/zone.controller.js";
import { cache } from "../../../lib/cache.js";

// ═══════════════════════════════════════════════════════════════
// CREATE STORE (Admin) — also creates OwnerAccount
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/stores
 */
export const createStore = async (req, res, next) => {
    try {
        const {
            name,
            description,
            legalName,
            phone,
            email,
            address,
            mainCategoryId,
            cityName,
            governorateName,
            countryName,
            countryCode,
            storeType,
            deliveryType,
            openTime,
            closeTime,
            overtimeOpenTime,
            overtimeCloseTime,
            deliveryTimeMinutes,
            minimumOrderCost,
            deliveryFees,
            allowPreorder,
            latitude,
            longitude,
            logo,
            cover,
            subCategoryIds,
            paymentMethodIds,
            ownerEmail,
            ownerPassword,
            zoneId, // explicit zone assignment
            maxDeliveryDistanceKm,
            outsideZoneDeliveryFees,
            commissionRate,
        } = req.body;

        // Validations
        if (!name || !mainCategoryId || !storeType || !deliveryType || !ownerEmail || !ownerPassword) {
            throw new ApiError(400, "name, mainCategoryId, storeType, deliveryType, ownerEmail, and ownerPassword are required.");
        }

        if (latitude === undefined || longitude === undefined || !cityName || !countryName || !countryCode) {
            throw new ApiError(400, "latitude, longitude, cityName, countryName, and countryCode are required.");
        }

        const mainCat = await prisma.mainCategory.findUnique({ where: { id: mainCategoryId } });
        if (!mainCat) throw new ApiError(404, "Main category not found.");

        const resolvedGeo = await resolveGeographyData({
            cityName,
            governorateName,
            countryName,
            countryCode
        });

        // Check owner email uniqueness
        const ownerExists = await prisma.ownerAccount.findUnique({ where: { email: ownerEmail } });
        if (ownerExists) throw new ApiError(409, "Owner email already in use.");

        // Upload images
        let logoUrl = null;
        let coverUrl = null;
        if (logo) logoUrl = await uploadToCloudinary(logo, "stores/logos");
        if (cover) coverUrl = await uploadToCloudinary(cover, "stores/covers");

        const passwordHash = await bcrypt.hash(ownerPassword, 12);

        // Create store + owner in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const store = await tx.store.create({
                data: {
                    name,
                    description: description || null,
                    legalName: legalName || null,
                    phone: phone || null,
                    email: email || null,
                    address: address || null,
                    mainCategory: { connect: { id: mainCategoryId } },
                    city: { connect: { id: resolvedGeo.cityId } },
                    storeType,
                    deliveryType,
                    openTime: openTime || null,
                    closeTime: closeTime || null,
                    overtimeOpenTime: overtimeOpenTime || null,
                    overtimeCloseTime: overtimeCloseTime || null,
                    deliveryTimeMinutes: deliveryTimeMinutes ? parseInt(deliveryTimeMinutes) : null,
                    minimumOrderCost: minimumOrderCost ? Number(minimumOrderCost) : 0,
                    deliveryFees: deliveryFees ? Number(deliveryFees) : 0,
                    maxDeliveryDistanceKm: maxDeliveryDistanceKm ? Number(maxDeliveryDistanceKm) : null,
                    outsideZoneDeliveryFees: outsideZoneDeliveryFees ? Number(outsideZoneDeliveryFees) : null,
                    commissionRate: commissionRate ? Number(commissionRate) : 0,
                    allowPreorder: allowPreorder === true || allowPreorder === 'true',
                    latitude,
                    longitude,
                    logoUrl,
                    coverUrl,
                },
            });

            // Create owner account
            const owner = await tx.ownerAccount.create({
                data: {
                    storeId: store.id,
                    email: ownerEmail,
                    passwordHash,
                },
            });

            // Link sub-categories
            if (subCategoryIds?.length) {
                await tx.storeSubCategory.createMany({
                    data: subCategoryIds.map((subCategoryId) => ({
                        storeId: store.id,
                        subCategoryId,
                    })),
                });
            }

            // Link payment methods
            if (paymentMethodIds?.length) {
                await tx.storePaymentMethod.createMany({
                    data: paymentMethodIds.map((paymentMethodId) => ({
                        storeId: store.id,
                        paymentMethodId,
                    })),
                });
            }

            // Zone assignment: explicit zoneId takes priority over spatial auto-detection
            if (zoneId) {
                // Admin explicitly chose a zone — always assign directly
                await tx.storeZone.create({
                    data: { storeId: store.id, zoneId }
                });
            } else if (latitude && longitude) {
                // Fallback: detect zone by coordinates (PostGIS ST_Within)
                const detectedZone = await detectZone(latitude, longitude);
                if (detectedZone) {
                    await tx.storeZone.create({
                        data: { storeId: store.id, zoneId: detectedZone.id }
                    });
                }
            }

            return { store, ownerEmail: owner.email };
        });

        // ── Provision an isolated PostgreSQL schema for this tenant ──────────
        try {
            await provisionTenantSchema(result.store.id, result.store.storeType);
        } catch (provisionErr) {
            // If schema provisioning fails, the store record is orphaned in the main DB.
            // We attempt to delete it to maintain consistency.
            await prisma.store.delete({ where: { id: result.store.id } }).catch(e => 
                console.error("[Store Provisioning Cleanup Failed]:", e.message)
            );
            throw new ApiError(500, `Store was created but we failed to provision its database schema: ${provisionErr.message}`);
        }

        // Clear cached stores lists since a new store is created
        await cache.delPattern("stores:*");

        res.status(201).json(
            new ApiResponse(201, result, "Store created with owner account and isolated schema.")
        );
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET ALL STORES (Public — with filters)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/stores
 */
export const getAllStores = async (req, res, next) => {
    try {
        const {
            mainCategoryId,
            subCategoryId,
            cityId,
            storeType,
            search,
            page = 1,
            limit = 20,
        } = req.query;

        // Generate dynamic cache key
        const cacheKey = `stores:all:cat_${mainCategoryId || 'any'}:sub_${subCategoryId || 'any'}:city_${cityId || 'any'}:type_${storeType || 'any'}:search_${search || 'none'}:p_${page}:l_${limit}:admin_${!!req.admin}`;
        
        const cachedResponse = await cache.get(cacheKey);
        if (cachedResponse) {
            return res.json(new ApiResponse(200, cachedResponse, "Stores fetched (cached)."));
        }

        const skip = (Number(page) - 1) * Number(limit);

        const where = {};
        // If not admin, only show active stores. Admins see all stores by default.
        if (!req.admin) {
            where.isActive = true;
        }

        if (mainCategoryId) where.mainCategoryId = mainCategoryId;
        if (cityId) where.cityId = cityId;
        if (storeType) where.storeType = storeType;

        if (subCategoryId) {
            where.storeCategories = {
                some: { subCategoryId },
            };
        }

        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        const [stores, total] = await Promise.all([
            prisma.store.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { averageRating: "desc" },
                select: {
                    id: true,
                    name: true,
                    isActive: true,
                    description: true,
                    legalName: true,
                    phone: true,
                    email: true,
                    address: true,
                    logoUrl: true,
                    coverUrl: true,
                    storeType: true,
                    deliveryType: true,
                    openTime: true,
                    closeTime: true,
                    overtimeOpenTime: true,
                    overtimeCloseTime: true,
                    deliveryTimeMinutes: true,
                    minimumOrderCost: true,
                    deliveryFees: true,
                    maxDeliveryDistanceKm: true,
                    outsideZoneDeliveryFees: true,
                    commissionRate: true,
                    allowPreorder: true,
                    averageRating: true,
                    totalReviews: true,
                    latitude: true,
                    longitude: true,
                    city: { select: { id: true, name: true } },
                    mainCategory: { select: { id: true, name: true } },
                },
            }),
            prisma.store.count({ where }),
        ]);

        const formattedStores = stores.map(s => ({ ...s, storeType: s.storeType?.name || s.storeType }));

        const responseData = {
            stores: formattedStores,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };

        // Cache the result for 2 minutes (120 seconds)
        await cache.set(cacheKey, responseData, 120);

        res.json(new ApiResponse(200, responseData, "Stores fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET NEARBY STORES (Public — by lat/lng radius)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/stores/nearby?lat=&lng=&mainCategoryId=&subCategoryId=
 * Zone-based store discovery using PostGIS ST_Within.
 * Returns all stores in the zone that contains the user's coordinates.
 * Falls back to distance-sorted results within the zone.
 */
export const getNearbyStores = async (req, res, next) => {
    try {
        const {
            lat,
            lng,
            mainCategoryId,
            subCategoryId,
            storeType,
            limit = 30,
        } = req.query;

        if (!lat || !lng) {
            throw new ApiError(400, "lat and lng query params are required.");
        }

        const userLat = Number(lat);
        const userLng = Number(lng);
        const take = Number(limit);

        // ── Step 1: Find which delivery zone the user is in ──────────────────
        const zone = await detectZone(userLat, userLng);

        // Generate dynamic cache key using the zone ID if found, otherwise fall back to 3-decimal rounded coordinates
        const zoneCacheKey = zone 
            ? `stores:nearby:zone_${zone.id}:cat_${mainCategoryId || 'any'}:sub_${subCategoryId || 'any'}:type_${storeType || 'any'}:l_${limit}`
            : `stores:nearby:coords_${userLat.toFixed(3)}_${userLng.toFixed(3)}:cat_${mainCategoryId || 'any'}:sub_${subCategoryId || 'any'}:type_${storeType || 'any'}:l_${limit}`;

        const cachedResponse = await cache.get(zoneCacheKey);
        if (cachedResponse) {
            return res.json(new ApiResponse(200, cachedResponse, "Nearby stores fetched (cached)."));
        }

        // ── Step 2: Get all storeIds assigned to this zone ───────────────────
        let zoneStoreIds = [];
        if (zone) {
            const storeZoneLinks = await prisma.storeZone.findMany({
                where: { zoneId: zone.id },
                select: { storeId: true },
            });
            zoneStoreIds = storeZoneLinks.map((sz) => sz.storeId);
        }

        // ── Step 3: Fetch stores with optional filters ───────────────────────
        const where = {
            isActive: true,
        };

        if (mainCategoryId) where.mainCategoryId = mainCategoryId;
        if (storeType) where.storeType = storeType;
        if (subCategoryId) {
            where.storeCategories = { some: { subCategoryId } };
        }

        where.OR = [
            { id: { in: zoneStoreIds } },
            { 
                deliveryType: { in: ["STORE_DELIVERY", "STORE"] },
                maxDeliveryDistanceKm: { not: null }
            }
        ];

        const stores = await prisma.store.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                logoUrl: true,
                coverUrl: true,
                storeType: true,
                deliveryType: true,
                deliveryTimeMinutes: true,
                minimumOrderCost: true,
                deliveryFees: true,
                maxDeliveryDistanceKm: true,
                outsideZoneDeliveryFees: true,
                commissionRate: true,
                allowPreorder: true,
                averageRating: true,
                totalReviews: true,
                latitude: true,
                longitude: true,
                city: { select: { id: true, name: true } },
                mainCategory: { select: { id: true, name: true } },
            },
        });

        // ── Step 4: Sort by distance within the zone ─────────────────────────
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

        const withDistance = stores
            .map((s) => ({
                ...s,
                storeType: s.storeType?.name || s.storeType,
                distanceKm: haversine(
                    userLat, userLng,
                    Number(s.latitude), Number(s.longitude)
                ),
            }))
            .filter((s) => {
                if (zoneStoreIds.includes(s.id)) return true;
                if (s.maxDeliveryDistanceKm && s.distanceKm <= Number(s.maxDeliveryDistanceKm)) return true;
                return false;
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, take);

        if (withDistance.length === 0) {
            const emptyResponse = {
                stores: [],
                zone: zone || null,
                userLocation: { lat: userLat, lng: userLng },
            };
            // Cache empty results too (for a shorter duration, e.g. 30 seconds) to avoid spamming the database
            await cache.set(zoneCacheKey, emptyResponse, 30);

            return res.status(404).json(
                new ApiResponse(404, emptyResponse, "We don't deliver to your location yet.")
            );
        }

        const successResponse = {
            stores: withDistance,
            total: withDistance.length,
            zone,
            userLocation: { lat: userLat, lng: userLng },
        };

        // Cache the successful nearby query for 1 minute (60 seconds)
        await cache.set(zoneCacheKey, successResponse, 60);

        res.json(new ApiResponse(200, successResponse, "Nearby stores fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET STORE BY ID (Public)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/stores/:id
 */
export const getStoreById = async (req, res, next) => {
    try {
        let { id } = req.params;

        // If the ID is an email address, lookup the store ID from the owner account
        if (id.includes("@")) {
            const ownerAccount = await prisma.ownerAccount.findUnique({
                where: { email: id },
                select: { storeId: true },
            });
            if (!ownerAccount) {
                throw new ApiError(404, "Store not found for this owner email.");
            }
            id = ownerAccount.storeId;
        }

        // Try getting from cache
        const cacheKey = `stores:detail:${id}`;
        const cachedStore = await cache.get(cacheKey);
        if (cachedStore) {
            return res.json(new ApiResponse(200, cachedStore, "Store fetched (cached)."));
        }

        // Run Prisma fetch and tenant data fetch in parallel to reduce latency
        const [store, tenantData] = await Promise.all([
            prisma.store.findUnique({
                where: { id },
                include: {
                    city: {
                        include: {
                            country: { select: { id: true, name: true } },
                            governorate: { select: { id: true, name: true } },
                        },
                    },
                    mainCategory: { select: { id: true, name: true } },
                    storeCategories: {
                        include: {
                            subCategory: { select: { id: true, name: true, imageUrl: true } },
                        },
                    },
                    paymentMethods: {
                        include: {
                            paymentMethod: { select: { id: true, name: true } },
                        },
                    },
                    _count: {
                        select: { reviews: true },
                    },
                    storeZones: {
                        select: {
                            zoneId: true,
                            zone: { select: { id: true, name: true } }
                        }
                    }
                },
            }),
            // Fetch tenant schema data in parallel (graceful fallback on error)
            (async () => {
                try {
                    const sections = await tenantQuery(
                        id,
                        `SELECT * FROM store_sections WHERE store_id = $1 ORDER BY sort_order ASC`,
                        [id]
                    );
                    const [{ count }] = await tenantQuery(
                        id,
                        `SELECT COUNT(*) FROM products WHERE store_id = $1`,
                        [id]
                    );
                    return { sections, productCount: Number(count) };
                } catch {
                    return { sections: [], productCount: 0 };
                }
            })(),
        ]);

        if (!store) {
            throw new ApiError(404, "Store not found.");
        }

        if (store.storeType && store.storeType.name) {
            store.storeType = store.storeType.name;
        }

        // Merge tenant-specific counts into _count
        const _count = { ...store._count };
        if (store.storeType === "RESTAURANT") {
            _count.restaurantProducts = tenantData.productCount;
        } else if (store.storeType === "GROCERY") {
            _count.groceryProducts = tenantData.productCount;
        } else if (store.storeType === "PHARMACY") {
            _count.pharmacyProducts = tenantData.productCount;
        }

        const storeResponse = { ...store, sections: tenantData.sections, _count };

        // Cache the store detail for 5 minutes (300 seconds)
        await cache.set(cacheKey, storeResponse, 300);

        res.json(new ApiResponse(200, storeResponse, "Store fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE STORE (Owner)
// ═══════════════════════════════════════════════════════════════

/**
 * PUT /api/stores/:id
 */
export const updateStore = async (req, res, next) => {
    try {
        let { id } = req.params;

        // If the ID is an email address, lookup the store ID from the owner account
        if (id.includes("@")) {
            const ownerAccount = await prisma.ownerAccount.findUnique({
                where: { email: id },
                select: { storeId: true },
            });
            if (!ownerAccount) {
                throw new ApiError(404, "Store not found for this owner email.");
            }
            id = ownerAccount.storeId;
        }

        // Owner can only update their own store, Admins can update any store
        if (!req.admin && req.owner?.storeId !== id) {
            throw new ApiError(403, "You can only update your own store.");
        }

        const {
            name,
            description,
            legalName,
            openTime,
            closeTime,
            overtimeOpenTime,
            overtimeCloseTime,
            deliveryType,
            deliveryTimeMinutes,
            minimumOrderCost,
            deliveryFees,
            allowPreorder,
            latitude,
            longitude,
            logo,
            cover,
            zoneId, // explicit zone assignment
            maxDeliveryDistanceKm,
            outsideZoneDeliveryFees,
            commissionRate,
        } = req.body;

        const existing = await prisma.store.findUnique({ where: { id } });
        if (!existing) throw new ApiError(404, "Store not found.");

        let logoUrl = existing.logoUrl;
        let coverUrl = existing.coverUrl;

        if (logo && !logo.startsWith('http')) {
            if (existing.logoUrl) await deleteFromCloudinary(existing.logoUrl);
            logoUrl = await uploadToCloudinary(logo, "stores/logos");
        }

        if (cover && !cover.startsWith('http')) {
            if (existing.coverUrl) await deleteFromCloudinary(existing.coverUrl);
            coverUrl = await uploadToCloudinary(cover, "stores/covers");
        }

        const store = await prisma.store.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(legalName !== undefined && { legalName }),
                ...(openTime !== undefined && { openTime }),
                ...(closeTime !== undefined && { closeTime }),
                ...(overtimeOpenTime !== undefined && { overtimeOpenTime }),
                ...(overtimeCloseTime !== undefined && { overtimeCloseTime }),
                ...(deliveryType && { deliveryType }),
                ...(deliveryTimeMinutes !== undefined && { deliveryTimeMinutes: parseInt(deliveryTimeMinutes) }),
                ...(minimumOrderCost !== undefined && { minimumOrderCost: Number(minimumOrderCost) }),
                ...(deliveryFees !== undefined && { deliveryFees: Number(deliveryFees) }),
                ...(maxDeliveryDistanceKm !== undefined && { maxDeliveryDistanceKm: maxDeliveryDistanceKm === null ? null : Number(maxDeliveryDistanceKm) }),
                ...(outsideZoneDeliveryFees !== undefined && { outsideZoneDeliveryFees: outsideZoneDeliveryFees === null ? null : Number(outsideZoneDeliveryFees) }),
                ...(commissionRate !== undefined && { commissionRate: commissionRate === null ? 0 : Number(commissionRate) }),
                ...(allowPreorder !== undefined && { allowPreorder: allowPreorder === true || allowPreorder === 'true' }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                logoUrl,
                coverUrl,
            },
        });

        // Zone assignment: explicit zoneId takes priority over spatial auto-detection
        // If latitude/longitude changed AND no explicit zoneId is provided, we re-detect.
        // If zoneId is provided, we use it directly.
        if (zoneId !== undefined || (latitude !== undefined && longitude !== undefined)) {
            const currentZones = await prisma.storeZone.findMany({ where: { storeId: id } });
            const currentZoneId = currentZones[0]?.zoneId;

            // Determine if we need to change assignment
            let newZoneId = zoneId;
            
            // If no explicit zoneId, but coordinates changed, try to auto-detect
            if (newZoneId === undefined && (latitude !== undefined || longitude !== undefined)) {
                const detected = await detectZone(
                    latitude !== undefined ? latitude : existing.latitude,
                    longitude !== undefined ? longitude : existing.longitude
                );
                newZoneId = detected?.id || null;
            }

            // If we have a new zoneId (or it was explicitly cleared to null), update it
            if (newZoneId !== undefined && newZoneId !== currentZoneId) {
                await prisma.storeZone.deleteMany({ where: { storeId: id } });
                if (newZoneId) {
                    await prisma.storeZone.create({
                        data: { storeId: id, zoneId: newZoneId }
                    });
                }
            }
        }

        // Invalidate caches
        await cache.del(`stores:detail:${id}`);
        await cache.delPattern("stores:*");

        res.json(new ApiResponse(200, store, "Store updated."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DELETE STORE (Admin)
// ═══════════════════════════════════════════════════════════════

/**
 * DELETE /api/stores/:id
 */
export const deleteStore = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await prisma.store.findUnique({ where: { id } });
        if (!existing) throw new ApiError(404, "Store not found.");

        // Clean up images
        if (existing.logoUrl) await deleteFromCloudinary(existing.logoUrl);
        if (existing.coverUrl) await deleteFromCloudinary(existing.coverUrl);

        // ── Drop the tenant schema (CASCADE removes all store data) ──────────
        await dropTenantSchema(id);

        await prisma.store.delete({ where: { id } });

        // Invalidate caches
        await cache.del(`stores:detail:${id}`);
        await cache.delPattern("stores:*");

        res.json(new ApiResponse(200, null, "Store deleted."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// TOGGLE STORE ACTIVE (Admin)
// ═══════════════════════════════════════════════════════════════

/**
 * PATCH /api/stores/:id/toggle
 */
export const toggleStoreActive = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await prisma.store.findUnique({ where: { id } });
        if (!existing) throw new ApiError(404, "Store not found.");

        const store = await prisma.store.update({
            where: { id },
            data: { isActive: !existing.isActive },
            select: { id: true, name: true, isActive: true },
        });

        // Invalidate caches
        await cache.del(`stores:detail:${id}`);
        await cache.delPattern("stores:*");

        res.json(new ApiResponse(200, store, `Store ${store.isActive ? "activated" : "deactivated"}.`));
    } catch (err) {
        next(err);
    }
};
