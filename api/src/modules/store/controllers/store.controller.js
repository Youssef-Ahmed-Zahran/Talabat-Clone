import bcrypt from "bcryptjs";
import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../../utils/cloudinaryUpload.js";
import { resolveGeographyData } from "../../../utils/geography.util.js";
import { provisionTenantSchema, dropTenantSchema, tenantQuery } from "../../../lib/tenantDb.js";

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
                    mainCategoryId,
                    cityId: resolvedGeo.cityId,
                    storeType,
                    deliveryType,
                    openTime: openTime || null,
                    closeTime: closeTime || null,
                    deliveryTimeMinutes: deliveryTimeMinutes || null,
                    minimumOrderCost: minimumOrderCost || 0,
                    deliveryFees: deliveryFees || 0,
                    allowPreorder: allowPreorder || false,
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
                    deliveryTimeMinutes: true,
                    minimumOrderCost: true,
                    deliveryFees: true,
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

        res.json(
            new ApiResponse(200, {
                stores,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            }, "Stores fetched.")
        );
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
            deliveryType,
            deliveryTimeMinutes,
            minimumOrderCost,
            deliveryFees,
            allowPreorder,
            latitude,
            longitude,
            logo,
            cover,
        } = req.body;

        const existing = await prisma.store.findUnique({ where: { id } });
        if (!existing) throw new ApiError(404, "Store not found.");

        let logoUrl = existing.logoUrl;
        let coverUrl = existing.coverUrl;

        if (logo) {
            if (existing.logoUrl) await deleteFromCloudinary(existing.logoUrl);
            logoUrl = await uploadToCloudinary(logo, "stores/logos");
        }

        if (cover) {
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
                ...(deliveryType && { deliveryType }),
                ...(deliveryTimeMinutes !== undefined && { deliveryTimeMinutes }),
                ...(minimumOrderCost !== undefined && { minimumOrderCost }),
                ...(deliveryFees !== undefined && { deliveryFees }),
                ...(allowPreorder !== undefined && { allowPreorder }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                logoUrl,
                coverUrl,
            },
        });

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

        res.json(new ApiResponse(200, store, `Store ${store.isActive ? "activated" : "deactivated"}.`));
    } catch (err) {
        next(err);
    }
};
