import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { uploadToCloudinary } from "../../../utils/cloudinaryUpload.js";
import { resolveGeographyData } from "../../../utils/geography.util.js";
import { getIO } from "../../../config/socket.js";
import { acceptAssignment, rejectAssignment } from "../../../sockets/dispatch.socket.js";

// ═══════════════════════════════════════════════════════════════
// DRIVER APPLICATION
// ═══════════════════════════════════════════════════════════════

/** POST /api/drivers/application */
export const submitApplication = async (req, res, next) => {
    try {
        const driverId = req.driver.id;

        const {
            vehicleType,
            firstName,
            familyName,
            phone,
            secondPhone,
            isOver18,
            nationalId,
            nationality,
            gender,
            dateOfBirth,
            idNumber,
            idExpiryDate,
            residenceGovernorate,
            drivingLicenseExpiry,
            vehiclePlateNumber,
            vehicleRegistrationExpiry,
            interestedInTobacco,
            shirtSize,
            cityName,
            governorateName,
            countryName,
            countryCode,
        } = req.body;

        if (!vehicleType || !firstName || !familyName || !phone) {
            throw new ApiError(400, "vehicleType, firstName, familyName, and phone are required.");
        }

        if (!isOver18) {
            throw new ApiError(400, "You must be over 18 to apply.");
        }

        // Check if application already exists
        const existing = await prisma.driverApplication.findUnique({ where: { driverId } });

        let finalGovernorateId = null;
        if (cityName && countryName && countryCode && governorateName) {
            const resolvedGeo = await resolveGeographyData({
                cityName,
                governorateName,
                countryName,
                countryCode
            });
            finalGovernorateId = resolvedGeo.governorateId;
        }

        const safeDate = (val) => {
            if (!val || typeof val !== 'string' || val.trim() === '') return null;
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        };

        const data = {
            vehicleType,
            firstName,
            familyName,
            phone,
            secondPhone: secondPhone || null,
            isOver18: isOver18 || false,
            nationalId: nationalId || null,
            nationality: nationality || null,
            gender: gender || null,
            dateOfBirth: safeDate(dateOfBirth),
            idNumber: idNumber || null,
            idExpiryDate: safeDate(idExpiryDate),
            governorateId: finalGovernorateId,
            residenceGovernorate: residenceGovernorate || null,
            drivingLicenseExpiry: safeDate(drivingLicenseExpiry),
            vehiclePlateNumber: vehiclePlateNumber || null,
            vehicleRegistrationExpiry: safeDate(vehicleRegistrationExpiry),
            interestedInTobacco: interestedInTobacco || false,
            shirtSize: shirtSize || null,
        };

        let application;
        if (existing) {
            // Only allow re-submission if rejected
            if (existing.status === "APPROVED") {
                throw new ApiError(400, "Your application is already approved.");
            }
            application = await prisma.driverApplication.update({
                where: { driverId },
                data: { ...data, status: "PENDING", rejectionReason: null, reviewedAt: null },
            });
        } else {
            application = await prisma.driverApplication.create({
                data: { driverId, ...data },
            });
        }

        res.status(201).json(new ApiResponse(201, application, "Application submitted."));
    } catch (err) {
        next(err);
    }
};

/** GET /api/drivers/application */
export const getMyApplication = async (req, res, next) => {
    try {
        const driverId = req.driver.id;

        const application = await prisma.driverApplication.findUnique({
            where: { driverId },
            include: {
                governorate: { select: { id: true, name: true } },
            },
        });

        if (!application) {
            return res.json(new ApiResponse(200, null, "No application found."));
        }

        res.json(new ApiResponse(200, application, "Application fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DRIVER DOCUMENTS
// ═══════════════════════════════════════════════════════════════

/** POST /api/drivers/documents */
export const uploadDocument = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { documentType, file } = req.body;

        if (!documentType || !file) {
            throw new ApiError(400, "documentType and file (base64) are required.");
        }

        const fileUrl = await uploadToCloudinary(file, `drivers/${driverId}/documents`);

        // Upsert — replace existing document of the same type
        const existing = await prisma.driverDocument.findFirst({
            where: { driverId, documentType },
        });

        let document;
        if (existing) {
            document = await prisma.driverDocument.update({
                where: { id: existing.id },
                data: { fileUrl, status: "PENDING", rejectionReason: null, verifiedAt: null },
            });
        } else {
            document = await prisma.driverDocument.create({
                data: { driverId, documentType, fileUrl },
            });
        }

        res.status(201).json(new ApiResponse(201, document, "Document uploaded."));
    } catch (err) {
        next(err);
    }
};

/** GET /api/drivers/documents */
export const getMyDocuments = async (req, res, next) => {
    try {
        const driverId = req.driver.id;

        const documents = await prisma.driverDocument.findMany({
            where: { driverId },
            orderBy: { createdAt: "desc" },
        });

        res.json(new ApiResponse(200, documents, "Documents fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DRIVER PROFILE
// ═══════════════════════════════════════════════════════════════

/** GET /api/drivers/profile */
export const getProfile = async (req, res, next) => {
    try {
        const driver = await prisma.driver.findUnique({
            where: { id: req.driver.id },
            select: {
                id: true,
                email: true,
                phone: true,
                cityId: true,
                status: true,
                isOnline: true,
                latitude: true,
                longitude: true,
                createdAt: true,
                city: {
                    include: {
                        country: { select: { id: true, name: true } },
                        governorate: { select: { id: true, name: true } },
                    },
                },
                application: { select: { status: true, firstName: true, familyName: true, vehicleType: true } },
                _count: { select: { deliveries: true, earnings: true } },
            },
        });

        res.json(new ApiResponse(200, driver, "Profile fetched."));
    } catch (err) {
        next(err);
    }
};

/** PUT /api/drivers/profile */
export const updateProfile = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { phone, cityName, governorateName, countryName, countryCode } = req.body;

        if (phone) {
            const phoneExists = await prisma.driver.findFirst({
                where: { phone, id: { not: driverId } },
            });
            if (phoneExists) throw new ApiError(409, "Phone number already in use.");
        }

        let cityId = undefined;
        if (cityName && countryName && countryCode) {
            const resolvedGeo = await resolveGeographyData({
                cityName,
                governorateName,
                countryName,
                countryCode,
            });
            cityId = resolvedGeo.cityId;
        }

        const driver = await prisma.driver.update({
            where: { id: driverId },
            data: {
                ...(phone !== undefined && { phone }),
                ...(cityId && { cityId }),
            },
            select: { id: true, email: true, phone: true, cityId: true },
        });

        res.json(new ApiResponse(200, driver, "Profile updated."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DRIVER LOCATION & ONLINE STATUS
// ═══════════════════════════════════════════════════════════════

/** PATCH /api/drivers/location */
export const updateLocation = async (req, res, next) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            throw new ApiError(400, "latitude and longitude are required.");
        }

        await prisma.driver.update({
            where: { id: req.driver.id },
            data: { latitude, longitude },
        });

        res.json(new ApiResponse(200, null, "Location updated."));
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/drivers/toggle-online */
export const toggleOnline = async (req, res, next) => {
    try {
        const driver = await prisma.driver.findUnique({ where: { id: req.driver.id } });

        // ── 1. Application approval gate ────────────────────────────────
        if (!driver.isOnline) {
            const application = await prisma.driverApplication.findUnique({
                where: { driverId: driver.id },
            });
            if (!application || application.status !== "APPROVED") {
                throw new ApiError(403, "Your application must be approved before going online.");
            }
        }

        // ── 2. Strict Geofencing check (only when going ONLINE) ─────────
        if (!driver.isOnline) {
            const { latitude, longitude } = req.body;

            if (latitude === undefined || longitude === undefined) {
                throw new ApiError(400, "Your current location (latitude & longitude) is required to go online.");
            }

            // Check if the driver's city has any active zones with boundaries defined
            const cityZones = await prisma.$queryRaw`
                SELECT id, name
                FROM zones
                WHERE "cityId" = ${driver.cityId}
                AND "isActive" = true
                AND boundary IS NOT NULL
                LIMIT 1;
            `;

            // Only enforce geofencing if the city actually has zones defined
            if (cityZones.length > 0) {
                const insideZone = await prisma.$queryRaw`
                    SELECT z.id, z.name
                    FROM zones z
                    WHERE z."cityId" = ${driver.cityId}
                    AND z."isActive" = true
                    AND z.boundary IS NOT NULL
                    AND ST_Contains(
                        z.boundary,
                        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
                    )
                    LIMIT 1;
                `;

                if (insideZone.length === 0) {
                    // Fetch the city name for a friendly error message
                    const city = await prisma.city.findUnique({
                        where: { id: driver.cityId ?? "" },
                        select: { name: true },
                    });
                    const cityName = city?.name ?? "your registered city";
                    throw new ApiError(
                        403,
                        `You are outside your registered working zone (${cityName}). Please move to your zone to go online.`
                    );
                }
            }
        }

        // ── 3. Toggle the online status ──────────────────────────────────
        const newOnline = !driver.isOnline;
        const newStatus = newOnline ? "ONLINE" : "OFFLINE";

        // Save GPS coordinates when going online so dispatch can find the driver
        const updateData = { isOnline: newOnline, status: newStatus };
        if (newOnline) {
            const { latitude, longitude } = req.body;
            if (latitude !== undefined && longitude !== undefined) {
                updateData.latitude = latitude;
                updateData.longitude = longitude;
            }
        }

        await prisma.driver.update({
            where: { id: driver.id },
            data: updateData,
        });

        res.json(new ApiResponse(200, { isOnline: newOnline, status: newStatus }, `Driver is now ${newStatus}.`));

    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DRIVER EARNINGS
// ═══════════════════════════════════════════════════════════════

/** GET /api/drivers/earnings */
export const getMyEarnings = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { page = 1, limit = 20, period } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = { driverId };

        if (period && period !== "all") {
            const now = new Date();
            let startDate = new Date();
            if (period === "today") {
                startDate.setHours(0, 0, 0, 0);
            } else if (period === "week") {
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
            } else if (period === "month") {
                startDate.setMonth(now.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);
            }
            where.createdAt = { gte: startDate };
        }

        const [earnings, total, totals] = await Promise.all([
            prisma.driverEarning.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    order: { select: { id: true, createdAt: true } },
                },
            }),
            prisma.driverEarning.count({ where }),
            prisma.driverEarning.aggregate({
                where,
                _sum: { totalAmount: true, tipAmount: true, baseAmount: true },
            }),
        ]);

        res.json(
            new ApiResponse(200, {
                earnings,
                summary: totals._sum,
                pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
            }, "Earnings fetched.")
        );
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DRIVER ORDER MANAGEMENT (Dispatch Accept / Reject)
// ═══════════════════════════════════════════════════════════════

/** GET /api/drivers/orders/pending — Get the current pending assignment */
export const getPendingAssignment = async (req, res, next) => {
    try {
        const driverId = req.driver.id;

        const assignment = await prisma.orderDriverAssignment.findFirst({
            where: { driverId, status: "PENDING" },
            include: {
                order: {
                    select: {
                        id: true,
                        subtotal: true,
                        deliveryFees: true,
                        tipAmount: true,
                        totalAmount: true,
                        deliveryInstructions: true,
                        createdAt: true,
                        user: { select: { fullName: true, phone: true } },
                        store: {
                            select: {
                                id: true,
                                name: true,
                                logoUrl: true,
                                latitude: true,
                                longitude: true,
                                deliveryTimeMinutes: true,
                            },
                        },
                        address: {
                            select: {
                                latitude: true,
                                longitude: true,
                                street: true,
                                buildingName: true,
                                floor: true,
                                apartmentNumber: true,
                            },
                        },
                    },
                },
            },
            orderBy: { assignedAt: "desc" },
        });

        if (!assignment) {
            return res.json(new ApiResponse(200, null, "No pending assignment."));
        }

        res.json(new ApiResponse(200, assignment, "Pending assignment fetched."));
    } catch (err) {
        next(err);
    }
};

/** GET /api/drivers/orders/active — Get the driver's current active delivery */
export const getActiveDelivery = async (req, res, next) => {
    try {
        const driverId = req.driver.id;

        const assignment = await prisma.orderDriverAssignment.findFirst({
            where: {
                driverId,
                status: "ACCEPTED",
                order: {
                    status: {
                        notIn: ["DELIVERED", "CANCELLED"]
                    }
                }
            },
            include: {
                order: {
                    select: {
                        id: true,
                        status: true,
                        subtotal: true,
                        deliveryFees: true,
                        tipAmount: true,
                        totalAmount: true,
                        deliveryInstructions: true,
                        createdAt: true,
                        user: { select: { fullName: true, phone: true } },
                        store: {
                            select: {
                                id: true,
                                name: true,
                                logoUrl: true,
                                latitude: true,
                                longitude: true,
                            },
                        },
                        address: {
                            select: {
                                latitude: true,
                                longitude: true,
                                street: true,
                                buildingName: true,
                                floor: true,
                                apartmentNumber: true,
                            },
                        },
                        liveTracking: {
                            select: {
                                status: true,
                                driverLatitude: true,
                                driverLongitude: true,
                                estimatedArrival: true,
                            },
                        },
                    },
                },
            },
            orderBy: { acceptedAt: "desc" },
        });

        if (!assignment) {
            return res.json(new ApiResponse(200, null, "No active delivery."));
        }

        res.json(new ApiResponse(200, assignment, "Active delivery fetched."));
    } catch (err) {
        next(err);
    }
};

/** POST /api/drivers/orders/:orderId/accept — Accept a pending assignment (REST fallback) */
export const acceptOrder = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { orderId } = req.params;

        const io = getIO();
        const result = await acceptAssignment(io, orderId, driverId);

        if (!result.success) {
            throw new ApiError(400, result.message);
        }

        res.json(new ApiResponse(200, { orderId }, result.message));
    } catch (err) {
        next(err);
    }
};

/** POST /api/drivers/orders/:orderId/reject — Reject a pending assignment (REST fallback) */
export const rejectOrder = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { orderId } = req.params;
        const { reason } = req.body;

        const io = getIO();
        const result = await rejectAssignment(io, orderId, driverId, reason);

        if (!result.success) {
            throw new ApiError(400, result.message);
        }

        res.json(new ApiResponse(200, { orderId }, result.message));
    } catch (err) {
        next(err);
    }
};

/** 
 * PATCH /api/drivers/orders/:orderId/status
 * Driver updates the status of their active delivery
 */
export const updateDeliveryStatus = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ["READY_FOR_PICKUP", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];
        if (!validStatuses.includes(status)) {
            throw new ApiError(400, "Invalid status for driver update.");
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                driverAssign: true,
                paymentMethod: true,
                store: { select: { name: true } },
            }
        });

        if (!order) throw new ApiError(404, "Order not found.");
        if (order.driverAssign?.driverId !== driverId) {
            throw new ApiError(403, "This order is not assigned to you.");
        }

        const liveStatusMap = {
            READY_FOR_PICKUP: "DRIVER_AT_STORE",
            PICKED_UP: "DRIVER_HEADING_TO_CUSTOMER",
            ON_THE_WAY: "DRIVER_HEADING_TO_CUSTOMER",
            DELIVERED: "DELIVERED",
        };

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update order status
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status }
            });

            // 2. Update status history
            await tx.orderStatusHistory.create({
                data: {
                    orderId,
                    status,
                    changedByType: "DRIVER",
                    changedByDriverId: driverId
                }
            });

            // 3. Update delivery table
            const deliveryData = {};
            if (status === "PICKED_UP") deliveryData.pickedUpAt = new Date();
            if (status === "DELIVERED") deliveryData.deliveredAt = new Date();

            await tx.delivery.update({
                where: { orderId },
                data: deliveryData
            });

            // 4. Update LiveTracking
            if (liveStatusMap[status]) {
                await tx.liveTracking.update({
                    where: { orderId },
                    data: { status: liveStatusMap[status] }
                });
            }

            // 5. Special logic for DELIVERED
            if (status === "DELIVERED") {
                // Release driver
                await tx.driver.update({
                    where: { id: driverId },
                    data: { status: "ONLINE" }
                });

                // Handle Driver Earning (simple version: driver gets delivery fee + tip)
                // In a real app, this would be a more complex formula
                const baseAmount = order.deliveryType === "TALABAT_DELIVERY" ? order.deliveryFees : 0;
                const totalEarning = Number(baseAmount) + Number(order.tipAmount);

                await tx.driverEarning.create({
                    data: {
                        driverId,
                        orderId,
                        baseAmount,
                        tipAmount: order.tipAmount,
                        totalAmount: totalEarning
                    }
                });

                // ─── WALLET LOGIC FOR CASH ORDERS ───
                if (order.paymentMethod.name === "CASH") {
                    // Driver collected total cash. They now owe this to the platform.
                    // We debit the Total Amount from their wallet.

                    let wallet = await tx.driverWallet.findUnique({ where: { driverId } });
                    if (!wallet) {
                        wallet = await tx.driverWallet.create({ data: { driverId } });
                    }

                    const debitAmount = Number(order.totalAmount);
                    const newBalance = Number(wallet.balance) - debitAmount;

                    await tx.driverWallet.update({
                        where: { id: wallet.id },
                        data: { balance: newBalance }
                    });

                    await tx.driverWalletTransaction.create({
                        data: {
                            walletId: wallet.id,
                            orderId,
                            type: "CASH_ORDER_DEBIT",
                            amount: -debitAmount,
                            balanceAfter: newBalance,
                            note: `Cash collected for order #${orderId.slice(-6)}`
                        }
                    });

                    // Auto-suspend if credit limit exceeded
                    if (newBalance <= -Number(wallet.creditLimit)) {
                        await tx.driver.update({
                            where: { id: driverId },
                            data: { status: "SUSPENDED", isOnline: false }
                        });
                    }
                } else {
                    // For Online/Visa orders, the delivery fee (earning) is added to their wallet as credit
                    let wallet = await tx.driverWallet.findUnique({ where: { driverId } });
                    if (!wallet) {
                        wallet = await tx.driverWallet.create({ data: { driverId } });
                    }

                    const creditAmount = totalEarning;
                    if (creditAmount > 0) {
                        const newBalance = Number(wallet.balance) + creditAmount;
                        await tx.driverWallet.update({
                            where: { id: wallet.id },
                            data: { balance: newBalance }
                        });

                        await tx.driverWalletTransaction.create({
                            data: {
                                walletId: wallet.id,
                                orderId,
                                type: "DELIVERY_FEE_CREDIT",
                                amount: creditAmount,
                                balanceAfter: newBalance,
                                note: `Earnings for order #${orderId.slice(-6)}`
                            }
                        });
                    }
                }
            }

            return updatedOrder;
        });

        // ── Notifications ──
        try {
            const io = getIO();
            io.of("/tracking").to(`order:${orderId}`).emit("tracking:status_changed", {
                orderId,
                status,
                liveStatus: liveStatusMap[status]
            });

            const { emitToUser, emitToOwner, emitToAdmins } = await import("../../../sockets/notifications.socket.js");
            const userNotifs = {
                READY_FOR_PICKUP: { title: "Driver at store 📍", body: "Your driver has arrived at the store and is picking up your order." },
                PICKED_UP: { title: "Picked up! 🚀", body: "Your driver has picked up your order and is heading to you." },
                DELIVERED: { title: "Delivered! 😋", body: "Enjoy your meal! Don't forget to rate the store." }
            };
            if (userNotifs[status]) {
                await emitToUser(io, order.userId, {
                    ...userNotifs[status],
                    type: "ORDER_UPDATE",
                    relatedOrderId: orderId
                });

                const storeOwner = await prisma.ownerAccount.findFirst({
                    where: { storeId: order.storeId, isActive: true }
                });
                
                if (storeOwner) {
                    await emitToOwner(io, storeOwner.id, {
                        ...userNotifs[status],
                        type: "ORDER_UPDATE",
                        relatedOrderId: orderId
                    });
                }

                emitToAdmins(io, {
                    ...userNotifs[status],
                    type: "ORDER_UPDATE",
                    meta: { orderId }
                });
            }
        } catch (err) {
            console.error("Socket error:", err);
        }

        res.json(new ApiResponse(200, result, `Order status updated to ${status}.`));
    } catch (err) {
        next(err);
    }
};

