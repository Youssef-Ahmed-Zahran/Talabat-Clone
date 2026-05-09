import bcrypt from "bcryptjs";
import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

/** GET /api/owners/store */
export const getMyStore = async (req, res, next) => {
    try {
        const storeId = req.owner.storeId;

        const store = await prisma.store.findUnique({
            where: { id: storeId },
            include: {
                city: {
                    include: {
                        country: { select: { id: true, name: true } },
                        governorate: { select: { id: true, name: true } },
                    },
                },
                mainCategory: { select: { id: true, name: true } },
                storeCategories: {
                    include: { subCategory: { select: { id: true, name: true } } },
                },
                sections: {
                    orderBy: { sortOrder: "asc" },
                    include: { _count: { select: { products: true } } },
                },
                paymentMethods: {
                    include: { paymentMethod: { select: { id: true, name: true } } },
                },
                _count: {
                    select: {
                        restaurantProducts: true,
                        groceryProducts: true,
                        pharmacyProducts: true,
                        reviews: true,
                        orders: true,
                    },
                },
            },
        });

        if (!store) throw new ApiError(404, "Store not found.");

        res.json(new ApiResponse(200, store, "Store fetched."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/owners/password */
export const updatePassword = async (req, res, next) => {
    try {
        const ownerId = req.owner.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw new ApiError(400, "Current password and new password are required.");
        }

        if (newPassword.length < 6) {
            throw new ApiError(400, "New password must be at least 6 characters.");
        }

        const owner = await prisma.ownerAccount.findUnique({ where: { id: ownerId } });
        if (!owner) throw new ApiError(404, "Owner not found.");

        const valid = await bcrypt.compare(currentPassword, owner.passwordHash);
        if (!valid) throw new ApiError(401, "Current password is incorrect.");

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.ownerAccount.update({
            where: { id: ownerId },
            data: { passwordHash },
        });

        res.json(new ApiResponse(200, null, "Password changed successfully."));
    } catch (err) {
        next(err);
    }
};

/** GET /api/owners/logs */
export const getActionLogs = async (req, res, next) => {
    try {
        const ownerId = req.owner.id;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [logs, total] = await Promise.all([
            prisma.ownerActionLog.findMany({
                where: { ownerId },
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
            }),
            prisma.ownerActionLog.count({ where: { ownerId } }),
        ]);

        res.json(
            new ApiResponse(200, {
                logs,
                pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
            }, "Action logs fetched.")
        );
    } catch (err) {
        next(err);
    }
};

/** GET /api/owners/dashboard */
export const getDashboardStats = async (req, res, next) => {
    try {
        const storeId = req.owner.storeId;

        const [
            totalOrders,
            pendingOrders,
            deliveredOrders,
            cancelledOrders,
            revenue,
            store,
        ] = await Promise.all([
            prisma.order.count({ where: { storeId } }),
            prisma.order.count({ where: { storeId, status: "PENDING" } }),
            prisma.order.count({ where: { storeId, status: "DELIVERED" } }),
            prisma.order.count({ where: { storeId, status: "CANCELLED" } }),
            prisma.order.aggregate({
                where: { storeId, status: "DELIVERED" },
                _sum: { totalAmount: true, storeEarnings: true, appFee: true },
            }),
            prisma.store.findUnique({
                where: { id: storeId },
                select: { averageRating: true, totalReviews: true },
            }),
        ]);

        const { ensureStoreWallet } = await import("../../driver/controllers/wallet.controller.js");
        const wallet = await ensureStoreWallet(storeId);

        res.json(
            new ApiResponse(200, {
                wallet: { balance: Number(wallet.balance) },
                orders: { total: totalOrders, pending: pendingOrders, delivered: deliveredOrders, cancelled: cancelledOrders },
                revenue: Number(revenue._sum.totalAmount || 0),
                storeEarnings: Number(revenue._sum.storeEarnings || 0),
                appCommissionPaid: Number(revenue._sum.appFee || 0),
                reviews: store,
            }, "Dashboard stats fetched.")
        );
    } catch (err) {
        next(err);
    }
};
