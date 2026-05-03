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
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            idNumber: idNumber || null,
            idExpiryDate: idExpiryDate ? new Date(idExpiryDate) : null,
            governorateId: finalGovernorateId,
            residenceGovernorate: residenceGovernorate || null,
            drivingLicenseExpiry: drivingLicenseExpiry ? new Date(drivingLicenseExpiry) : null,
            vehiclePlateNumber: vehiclePlateNumber || null,
            vehicleRegistrationExpiry: vehicleRegistrationExpiry ? new Date(vehicleRegistrationExpiry) : null,
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
                application: { select: { status: true, firstName: true, familyName: true } },
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

        // Check if application is approved before going online
        if (!driver.isOnline) {
            const application = await prisma.driverApplication.findUnique({
                where: { driverId: driver.id },
            });
            if (!application || application.status !== "APPROVED") {
                throw new ApiError(403, "Your application must be approved before going online.");
            }
        }

        const newOnline = !driver.isOnline;
        const newStatus = newOnline ? "ONLINE" : "OFFLINE";

        await prisma.driver.update({
            where: { id: driver.id },
            data: { isOnline: newOnline, status: newStatus },
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
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [earnings, total, totals] = await Promise.all([
            prisma.driverEarning.findMany({
                where: { driverId },
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    order: { select: { id: true, createdAt: true } },
                },
            }),
            prisma.driverEarning.count({ where: { driverId } }),
            prisma.driverEarning.aggregate({
                where: { driverId },
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
            where: { driverId, status: "ACCEPTED" },
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
