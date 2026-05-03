import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { emitToUser, emitToDriver, emitToAdmins } from "../../../sockets/notifications.socket.js";

// ═══════════════════════════════════════════════════════════════
// GET NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/** GET /api/notifications */
export const getMyNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        let notifications = [];
        let total = 0;

        if (req.user) {
            [notifications, total] = await Promise.all([
                prisma.userNotification.findMany({
                    where: { userId: req.user.id },
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: "desc" },
                }),
                prisma.userNotification.count({ where: { userId: req.user.id } }),
            ]);
        } else if (req.driver) {
            [notifications, total] = await Promise.all([
                prisma.driverNotification.findMany({
                    where: { driverId: req.driver.id },
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: "desc" },
                }),
                prisma.driverNotification.count({ where: { driverId: req.driver.id } }),
            ]);
        } else if (req.admin || req.owner) {
            throw new ApiError(400, "Admins and owners do not have persisted notifications yet.");
        } else {
            throw new ApiError(401, "Unauthorized recipient.");
        }

        res.json(new ApiResponse(200, {
            notifications,
            pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
        }, "Notifications fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// MARK AS READ
// ═══════════════════════════════════════════════════════════════

/** PATCH /api/notifications/:id/read */
export const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        let updated;

        if (req.user) {
            const notification = await prisma.userNotification.findUnique({ where: { id } });
            if (!notification || notification.userId !== req.user.id) throw new ApiError(404, "Notification not found.");
            updated = await prisma.userNotification.update({ where: { id }, data: { isRead: true } });
        } else if (req.driver) {
            const notification = await prisma.driverNotification.findUnique({ where: { id } });
            if (!notification || notification.driverId !== req.driver.id) throw new ApiError(404, "Notification not found.");
            updated = await prisma.driverNotification.update({ where: { id }, data: { isRead: true } });
        } else {
            throw new ApiError(401, "Unauthorized recipient.");
        }

        res.json(new ApiResponse(200, updated, "Notification marked as read."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/notifications/read-all */
export const markAllAsRead = async (req, res, next) => {
    try {
        if (req.user) {
            await prisma.userNotification.updateMany({
                where: { userId: req.user.id, isRead: false },
                data: { isRead: true },
            });
        } else if (req.driver) {
            await prisma.driverNotification.updateMany({
                where: { driverId: req.driver.id, isRead: false },
                data: { isRead: true },
            });
        } else {
            throw new ApiError(401, "Unauthorized recipient.");
        }

        res.json(new ApiResponse(200, null, "All notifications marked as read."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DELETE NOTIFICATION
// ═══════════════════════════════════════════════════════════════

/** DELETE /api/notifications/:id */
export const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user) {
            const notification = await prisma.userNotification.findUnique({ where: { id } });
            if (!notification || notification.userId !== req.user.id) throw new ApiError(404, "Notification not found.");
            await prisma.userNotification.delete({ where: { id } });
        } else if (req.driver) {
            const notification = await prisma.driverNotification.findUnique({ where: { id } });
            if (!notification || notification.driverId !== req.driver.id) throw new ApiError(404, "Notification not found.");
            await prisma.driverNotification.delete({ where: { id } });
        } else {
            throw new ApiError(401, "Unauthorized recipient.");
        }

        res.json(new ApiResponse(200, null, "Notification deleted."));
    } catch (err) {
        next(err);
    }
};


