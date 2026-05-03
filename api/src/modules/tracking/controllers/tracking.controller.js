import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

// ═══════════════════════════════════════════════════════════════
// GET LIVE TRACKING (User / Owner)
// ═══════════════════════════════════════════════════════════════

/** GET /api/tracking/:orderId */
export const getOrderTracking = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const tracking = await prisma.liveTracking.findUnique({
            where: { orderId },
            include: {
                order: {
                    select: {
                        id: true,
                        status: true,
                        storeId: true,
                        userId: true,
                        store: { select: { name: true, latitude: true, longitude: true, deliveryTimeMinutes: true } },
                        address: { select: { latitude: true, longitude: true, street: true } },
                    },
                },
                driver: {
                    select: {
                        id: true,
                        phone: true,
                        latitude: true,
                        longitude: true,
                        application: {
                            select: {
                                firstName: true,
                                familyName: true,
                                vehicleType: true,
                            },
                        },
                    },
                },
            },
        });

        if (!tracking) throw new ApiError(404, "Tracking info not found for this order.");

        // Authorization check
        const isUser = req.user && req.user.id === tracking.order.userId;
        const isOwner = req.owner && req.owner.storeId === tracking.order.storeId;

        if (!isUser && !isOwner) {
            throw new ApiError(403, "You do not have permission to view this tracking info.");
        }

        res.json(new ApiResponse(200, tracking, "Tracking info fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ASSIGN DRIVER (System/Admin)
// ═══════════════════════════════════════════════════════════════

/** PATCH /api/tracking/:orderId/assign-driver */
export const assignDriver = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { driverId } = req.body;

        if (!driverId) throw new ApiError(400, "Driver ID is required.");

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new ApiError(404, "Order not found.");

        const driver = await prisma.driver.findUnique({ where: { id: driverId } });
        if (!driver) throw new ApiError(404, "Driver not found.");

        const updatedTracking = await prisma.$transaction(async (tx) => {
            // Update tracking
            const tracking = await tx.liveTracking.update({
                where: { orderId },
                data: {
                    driverId,
                    status: "DRIVER_HEADING_TO_STORE",
                },
            });

            // Update order delivery if it exists, or create it
            const existingDelivery = await tx.delivery.findUnique({ where: { orderId } });
            if (existingDelivery) {
                await tx.delivery.update({
                    where: { orderId },
                    data: { driverId, acceptedAt: new Date() },
                });
            } else {
                await tx.delivery.create({
                    data: {
                        orderId,
                        driverId,
                        acceptedAt: new Date(),
                    },
                });
            }

            // Auto-create a chat Conversation between the user and the driver
            const existingConversation = await tx.conversation.findUnique({ where: { orderId } });
            if (!existingConversation) {
                await tx.conversation.create({
                    data: {
                        orderId,
                        userId:   order.userId,
                        driverId,
                    },
                });
            }

            return tracking;
        });

        res.json(new ApiResponse(200, updatedTracking, "Driver assigned successfully."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE TRACKING STATUS (Driver)
// ═══════════════════════════════════════════════════════════════

/** PATCH /api/tracking/:orderId/status */
export const updateTrackingStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status, estimatedArrival } = req.body;
        const driverId = req.driver.id;

        if (!status) throw new ApiError(400, "Tracking status is required.");

        // Valid LiveTracking statuses
        const VALID_LIVE_STATUSES = [
            "WAITING_FOR_DRIVER", "DRIVER_ASSIGNED", "DRIVER_HEADING_TO_STORE",
            "DRIVER_AT_STORE", "DRIVER_HEADING_TO_CUSTOMER", "DELIVERED",
        ];
        if (!VALID_LIVE_STATUSES.includes(status)) {
            throw new ApiError(400, `Invalid tracking status: ${status}`);
        }

        const tracking = await prisma.liveTracking.findUnique({
            where: { orderId },
            include: {
                order: {
                    select: {
                        id: true,
                        userId: true,
                        status: true,
                        store: { select: { name: true } },
                    },
                },
            },
        });
        if (!tracking) throw new ApiError(404, "Tracking info not found.");

        if (tracking.driverId !== driverId) {
            throw new ApiError(403, "You are not assigned to this order.");
        }

        const data = { status };
        if (estimatedArrival) data.estimatedArrival = new Date(estimatedArrival);

        const updated = await prisma.liveTracking.update({
            where: { orderId },
            data,
        });

        // ── Sync order status based on driver's tracking update ───────────
        // Map LiveTracking status → OrderStatus
        const orderStatusMap = {
            DRIVER_AT_STORE:            "READY_FOR_PICKUP",
            DRIVER_HEADING_TO_CUSTOMER: "ON_THE_WAY",
            DELIVERED:                  "DELIVERED",
        };
        const newOrderStatus = orderStatusMap[status];

        if (newOrderStatus) {
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: newOrderStatus },
                });

                await tx.orderStatusHistory.create({
                    data: {
                        orderId,
                        status: newOrderStatus,
                        changedByType: "DRIVER",
                        changedByDriverId: driverId,
                    },
                });

                if (newOrderStatus === "ON_THE_WAY") {
                    await tx.delivery.update({
                        where: { orderId },
                        data: { pickedUpAt: new Date() },
                    });
                }

                if (newOrderStatus === "DELIVERED") {
                    await tx.delivery.update({
                        where: { orderId },
                        data: { deliveredAt: new Date() },
                    });
                    // Driver back to ONLINE
                    await tx.driver.update({
                        where: { id: driverId },
                        data: { status: "ONLINE" },
                    });
                }
            });
        }

        // ── Real-time notifications ──────────────────────────────────────
        const storeName = tracking.order.store.name;
        const notifMap = {
            DRIVER_HEADING_TO_STORE:    { title: "Driver on the way 🛵", body: `Your driver is heading to ${storeName}.` },
            DRIVER_AT_STORE:            { title: "Driver at store 📍", body: `Your driver has arrived at ${storeName} and is picking up your order.` },
            DRIVER_HEADING_TO_CUSTOMER: { title: "On the way to you 🚀", body: `Your driver picked up your order from ${storeName} and is heading to you!` },
            DELIVERED:                  { title: "Delivered! 🎉", body: `Your order from ${storeName} has arrived. Enjoy!` },
        };

        try {
            const { getIO } = await import("../../../config/socket.js");
            const io = getIO();

            // Broadcast to tracking room
            io.of("/tracking").to(`order:${orderId}`).emit("tracking:status_changed", {
                orderId,
                status,
                liveStatus: status,
                changedAt: new Date(),
            });

            // Push notification to user
            if (notifMap[status]) {
                const { emitToUser } = await import("../../../sockets/notifications.socket.js");
                await emitToUser(io, tracking.order.userId, {
                    ...notifMap[status],
                    type: "ORDER_UPDATE",
                    relatedOrderId: orderId,
                });
            }
        } catch (socketErr) {
            console.error("[updateTrackingStatus] Socket error (non-blocking):", socketErr);
        }

        res.json(new ApiResponse(200, updated, "Tracking status updated."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE DRIVER LOCATION (Driver)
// ═══════════════════════════════════════════════════════════════

/** PATCH /api/tracking/location */
export const updateDriverLocation = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            throw new ApiError(400, "Latitude and longitude are required.");
        }

        await prisma.driver.update({
            where: { id: driverId },
            data: { latitude, longitude },
        });

        res.json(new ApiResponse(200, null, "Driver location updated."));
    } catch (err) {
        next(err);
    }
};
