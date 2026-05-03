import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { resolveGeographyData } from "../../../utils/geography.util.js";

/**
 * GET /api/addresses
 */
export const getMyAddresses = async (req, res, next) => {
    try {
        const addresses = await prisma.userAddress.findMany({
            where: { userId: req.user.id },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
            include: {
                city: {
                    include: {
                        country: { select: { id: true, name: true, code: true } },
                        governorate: { select: { id: true, name: true } },
                    },
                },
            },
        });

        res.json(new ApiResponse(200, addresses, "Addresses fetched."));
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/addresses
 */
export const addAddress = async (req, res, next) => {
    try {
        const {
            cityId,
            type,
            label,
            buildingName,
            apartmentNumber,
            floor,
            street,
            phone,
            latitude,
            longitude,
            isDefault,
            cityName,
            governorateName,
            countryName,
            countryCode,
        } = req.body;
        const userId = req.user.id;

        if (latitude === undefined || longitude === undefined || !cityName || !countryName || !countryCode) {
            throw new ApiError(400, "latitude, longitude, cityName, countryName, and countryCode are required.");
        }

        const resolvedGeo = await resolveGeographyData({
            cityName,
            governorateName,
            countryName,
            countryCode
        });

        // If setting as default, unset other defaults
        if (isDefault) {
            await prisma.userAddress.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const address = await prisma.userAddress.create({
            data: {
                userId,
                cityId: resolvedGeo.cityId,
                type: type || "APARTMENT",
                label: label || null,
                buildingName: buildingName || null,
                apartmentNumber: apartmentNumber || null,
                floor: floor || null,
                street: street || null,
                phone: phone || null,
                latitude,
                longitude,
                isDefault: isDefault || false,
            },
            include: {
                city: {
                    include: {
                        country: { select: { id: true, name: true, code: true } },
                    },
                },
            },
        });

        res.status(201).json(new ApiResponse(201, address, "Address added."));
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/addresses/:id
 */
export const updateAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const {
            type,
            label,
            buildingName,
            apartmentNumber,
            floor,
            street,
            phone,
            latitude,
            longitude,
            cityName,
            governorateName,
            countryName,
            countryCode,
        } = req.body;

        const existing = await prisma.userAddress.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            throw new ApiError(404, "Address not found.");
        }

        let finalCityId = undefined;
        if (cityName && countryName && countryCode) {
            const resolvedGeo = await resolveGeographyData({
                cityName,
                governorateName,
                countryName,
                countryCode
            });
            finalCityId = resolvedGeo.cityId;
        }

        const address = await prisma.userAddress.update({
            where: { id },
            data: {
                ...(type && { type }),
                ...(label !== undefined && { label }),
                ...(buildingName !== undefined && { buildingName }),
                ...(apartmentNumber !== undefined && { apartmentNumber }),
                ...(floor !== undefined && { floor }),
                ...(street !== undefined && { street }),
                ...(phone !== undefined && { phone }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                ...(finalCityId && { cityId: finalCityId }),
            },
            include: {
                city: {
                    include: {
                        country: { select: { id: true, name: true, code: true } },
                    },
                },
            },
        });

        res.json(new ApiResponse(200, address, "Address updated."));
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/addresses/:id
 */
export const deleteAddress = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await prisma.userAddress.findFirst({
            where: { id, userId: req.user.id },
        });
        if (!existing) {
            throw new ApiError(404, "Address not found.");
        }

        await prisma.userAddress.delete({ where: { id } });

        res.json(new ApiResponse(200, null, "Address deleted."));
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/addresses/:id/default
 */
export const setDefaultAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const existing = await prisma.userAddress.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            throw new ApiError(404, "Address not found.");
        }

        // Unset all defaults, then set this one
        await prisma.$transaction([
            prisma.userAddress.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            }),
            prisma.userAddress.update({
                where: { id },
                data: { isDefault: true },
            }),
        ]);

        res.json(new ApiResponse(200, null, "Default address updated."));
    } catch (err) {
        next(err);
    }
};
