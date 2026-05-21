import bcrypt from "bcryptjs";
import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { cache } from "../../../lib/cache.js";

// ═══════════════════════════════════════════════════════════════
// CUSTOMER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/** GET /api/admin/users */
export const getAllUsers = async (req, res, next) => {
    try {
        const { search, isBlocked, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = {};
        if (isBlocked !== undefined) where.isBlocked = isBlocked === "true";
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    isVerified: true,
                    isBlocked: true,
                    createdAt: true,
                    _count: { select: { orders: true } },
                },
            }),
            prisma.user.count({ where }),
        ]);

        res.json(
            new ApiResponse(200, {
                users,
                pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
            }, "Users fetched.")
        );
    } catch (err) {
        next(err);
    }
};

/** GET /api/admin/users/:id */
export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                isVerified: true,
                isBlocked: true,
                createdAt: true,
                addresses: true,
                _count: {
                    select: { orders: true, storeReviews: true, savedCards: true },
                },
            },
        });

        if (!user) throw new ApiError(404, "User not found.");

        res.json(new ApiResponse(200, user, "User fetched."));
    } catch (err) {
        next(err);
    }
};

/** GET /api/admin/users/:id/orders */
export const getUserOrders = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId: id },
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    store: { select: { name: true, storeType: true } },
                    delivery: { include: { driver: { select: { email: true, phone: true } } } },
                },
            }),
            prisma.order.count({ where: { userId: id } }),
        ]);

        res.json(
            new ApiResponse(200, {
                orders,
                pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
            }, "User orders fetched.")
        );
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/admin/users/:id/block */
export const blockUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.update({
            where: { id },
            data: { isBlocked: true },
            select: { id: true, fullName: true, isBlocked: true },
        });

        res.json(new ApiResponse(200, user, "User blocked."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/admin/users/:id/unblock */
export const unblockUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.update({
            where: { id },
            data: { isBlocked: false },
            select: { id: true, fullName: true, isBlocked: true },
        });

        res.json(new ApiResponse(200, user, "User unblocked."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DRIVER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/** GET /api/admin/drivers */
export const getAllDrivers = async (req, res, next) => {
    try {
        const { status, applicationStatus, search, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        if (applicationStatus) {
            where.application = { status: applicationStatus };
        }

        const [drivers, total] = await Promise.all([
            prisma.driver.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    application: { select: { status: true, firstName: true, familyName: true, vehicleType: true } },
                    city: { select: { id: true, name: true } },
                    _count: { select: { deliveries: true } },
                },
            }),
            prisma.driver.count({ where }),
        ]);

        res.json(
            new ApiResponse(200, {
                drivers,
                pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
            }, "Drivers fetched.")
        );
    } catch (err) {
        next(err);
    }
};

/** GET /api/admin/drivers/:id */
export const getDriverById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const driver = await prisma.driver.findUnique({
            where: { id },
            include: {
                application: { include: { governorate: { select: { id: true, name: true } } } },
                documents: { orderBy: { createdAt: "desc" } },
                city: { include: { country: { select: { name: true } } } },
                wallet: { select: { id: true, balance: true, creditLimit: true } },
                _count: { select: { deliveries: true, earnings: true } },
            },
        });

        if (!driver) throw new ApiError(404, "Driver not found.");

        res.json(new ApiResponse(200, driver, "Driver fetched."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/admin/drivers/:id/approve */
export const approveApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`[Admin] Attempting to approve application for ID: ${id}`);

        // Try finding by driverId first, then by its own primary id
        let app = await prisma.driverApplication.findUnique({ where: { driverId: id } });
        if (!app) {
            app = await prisma.driverApplication.findUnique({ where: { id } });
        }

        if (!app) {
            // If no application exists, create a dummy one so the admin can still "approve" the driver
            app = await prisma.driverApplication.create({
                data: {
                    driverId: id,
                    status: "APPROVED",
                    firstName: "Manual",
                    familyName: "Approval",
                    vehicleType: "BIKE", // default
                    phone: "N/A",
                    nationalId: "N/A",
                    nationality: "N/A",
                    gender: "OTHER",
                    dateOfBirth: new Date(),
                    reviewedAt: new Date(),
                }
            });
            return res.json(new ApiResponse(200, null, "Driver approved (Application created automatically)."));
        }

        await prisma.driverApplication.update({
            where: { id: app.id },
            data: { status: "APPROVED", reviewedAt: new Date() },
        });

        res.json(new ApiResponse(200, null, "Application approved."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/admin/drivers/:id/reject */
export const rejectApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Try finding by driverId first, then by its own primary id
        let app = await prisma.driverApplication.findUnique({ where: { driverId: id } });
        if (!app) {
            app = await prisma.driverApplication.findUnique({ where: { id } });
        }

        if (!app) throw new ApiError(404, "Application not found.");

        await prisma.driverApplication.update({
            where: { id: app.id },
            data: {
                status: "REJECTED",
                rejectionReason: reason || null,
                reviewedAt: new Date(),
            },
        });

        res.json(new ApiResponse(200, null, "Application rejected."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/admin/drivers/:id/suspend */
export const suspendDriver = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.driver.update({
            where: { id },
            data: { status: "SUSPENDED", isOnline: false },
        });

        res.json(new ApiResponse(200, null, "Driver suspended."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/admin/drivers/:id/unsuspend */
export const unsuspendDriver = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.driver.update({
            where: { id },
            data: { status: "OFFLINE" },
        });

        res.json(new ApiResponse(200, null, "Driver unsuspended."));
    } catch (err) {
        next(err);
    }
};

/** DELETE /api/admin/drivers/:id */
export const deleteDriver = async (req, res, next) => {
    try {
        const { id } = req.params;

        const driver = await prisma.driver.findUnique({ where: { id } });
        if (!driver) throw new ApiError(404, "Driver not found.");

        // Delete cascades via Prisma schema relations
        await prisma.driver.delete({ where: { id } });

        res.json(new ApiResponse(200, null, "Driver deleted."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/admin/drivers/documents/:docId/verify */
export const verifyDocument = async (req, res, next) => {
    try {
        const { docId } = req.params;

        await prisma.driverDocument.update({
            where: { id: docId },
            data: { status: "APPROVED", verifiedAt: new Date() },
        });

        res.json(new ApiResponse(200, null, "Document verified."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/admin/drivers/documents/:docId/reject */
export const rejectDocument = async (req, res, next) => {
    try {
        const { docId } = req.params;
        const { reason } = req.body;

        await prisma.driverDocument.update({
            where: { id: docId },
            data: { status: "REJECTED", rejectionReason: reason || null },
        });

        res.json(new ApiResponse(200, null, "Document rejected."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/** POST /api/admin/admins — SUPER_ADMIN only */
export const createAdmin = async (req, res, next) => {
    try {
        const { email, password, fullName, role } = req.body;

        if (!email || !password || !fullName) {
            throw new ApiError(400, "email, password, and fullName are required.");
        }

        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) throw new ApiError(409, "Admin email already exists.");

        const passwordHash = await bcrypt.hash(password, 12);

        const admin = await prisma.admin.create({
            data: {
                email,
                passwordHash,
                fullName,
                role: role || "ADMIN",
            },
            select: { id: true, email: true, fullName: true, role: true, createdAt: true },
        });

        res.status(201).json(new ApiResponse(201, admin, "Admin created."));
    } catch (err) {
        next(err);
    }
};

/** GET /api/admin/admins */
export const getAllAdmins = async (req, res, next) => {
    try {
        const admins = await prisma.admin.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        res.json(new ApiResponse(200, admins, "Admins fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

/** GET /api/admin/dashboard */
export const getDashboardStats = async (req, res, next) => {
    try {
        // Dashboard stats are expensive (14+ parallel queries + 7 daily aggregations).
        // Cache for 2 minutes — admins see near-real-time data without hammering the DB.
        const cacheKey = "admin:dashboard:stats";
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(new ApiResponse(200, cached, "Dashboard stats fetched (cached)."));

        const [
            totalUsers,
            totalDrivers,
            totalStores,
            totalOrders,
            pendingOrders,
            deliveredOrders,
            revenue,
            pendingApplications,
            recentOrders,
            recentDrivers,
            recentStores,
            appProfitsData,
            groupedProfits
        ] = await Promise.all([
            prisma.user.count(),
            prisma.driver.count(),
            prisma.store.count(),
            prisma.order.count(),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.order.count({ where: { status: "DELIVERED" } }),
            prisma.order.aggregate({
                where: { status: "DELIVERED" },
                _sum: { totalAmount: true },
            }),
            prisma.driverApplication.count({ where: { status: "PENDING" } }),
            prisma.order.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { fullName: true } } } }),
            prisma.driver.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
            prisma.store.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
            prisma.order.aggregate({
                where: { status: "DELIVERED" },
                _sum: { appFee: true },
            }),
            prisma.order.groupBy({
                by: ['storeId'],
                where: { status: "DELIVERED" },
                _sum: { storeEarnings: true, appFee: true }
            })
        ]);

        const { ensurePlatformWallet } = await import("../../driver/controllers/wallet.controller.js");
        const pWallet = await ensurePlatformWallet();

        const storeIds = groupedProfits.map(g => g.storeId);
        const storesData = await prisma.store.findMany({
            where: { id: { in: storeIds } },
            select: { id: true, name: true, logoUrl: true }
        });
        const storesMap = storesData.reduce((acc, store) => {
            acc[store.id] = store;
            return acc;
        }, {});

        const storeEarningsBreakdown = groupedProfits.map(g => ({
            storeId: g.storeId,
            storeName: storesMap[g.storeId]?.name || "Unknown Store",
            logoUrl: storesMap[g.storeId]?.logoUrl || null,
            storeEarnings: Number(g._sum.storeEarnings || 0),
            appProfitFromStore: Number(g._sum.appFee || 0)
        })).sort((a, b) => b.appProfitFromStore - a.appProfitFromStore);

        const activities = [
            ...recentOrders.map(o => ({ id: `o-${o.id}`, text: `New order #${o.id} placed by ${o.user?.fullName || 'a user'}.`, time: o.createdAt, type: 'order' })),
            ...recentDrivers.map(d => ({ id: `d-${d.id}`, text: `New driver ${d.email} registered.`, time: d.createdAt, type: 'driver' })),
            ...recentStores.map(s => ({ id: `s-${s.id}`, text: `Store "${s.name}" went online.`, time: s.createdAt, type: 'store' }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            date.setHours(0, 0, 0, 0);
            return date;
        });

        const revenueHistory = await Promise.all(days.map(async (day) => {
            const nextDay = new Date(day);
            nextDay.setDate(nextDay.getDate() + 1);

            const result = await prisma.order.aggregate({
                where: {
                    status: "DELIVERED",
                    createdAt: { gte: day, lt: nextDay }
                },
                _sum: { totalAmount: true }
            });

            return {
                day: day.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: Number(result._sum.totalAmount || 0)
            };
        }));

        const responseData = {
            users: totalUsers,
            drivers: totalDrivers,
            stores: totalStores,
            orders: { total: totalOrders, pending: pendingOrders, delivered: deliveredOrders },
            revenue: Number(revenue._sum.totalAmount || 0),
            totalAppProfit: Number(appProfitsData._sum.appFee || 0),
            platformWallet: { balance: Number(pWallet.balance) },
            pendingApplications,
            activities,
            revenueHistory,
            storeEarningsBreakdown
        };

        await cache.set(cacheKey, responseData, 120); // 2 minutes

        res.json(new ApiResponse(200, responseData, "Dashboard stats fetched."));
    } catch (err) {
        next(err);
    }
};
