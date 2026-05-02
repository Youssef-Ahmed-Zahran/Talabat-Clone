import bcrypt from "bcryptjs";
import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

/**
 * GET /api/users/profile
 */
export const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                isVerified: true,
                createdAt: true,
                _count: {
                    select: {
                        addresses: true,
                        savedCards: true,
                        orders: true,
                        storeWishlists: true,
                    },
                },
            },
        });

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        res.json(new ApiResponse(200, user, "Profile fetched."));
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { fullName, phone, email } = req.body || {};
        const userId = req.user.id;

        // Check unique constraints if changing email/phone
        if (email) {
            const emailExists = await prisma.user.findFirst({
                where: { email, id: { not: userId } },
            });
            if (emailExists) {
                throw new ApiError(409, "Email already in use.");
            }
        }

        if (phone) {
            const phoneExists = await prisma.user.findFirst({
                where: { phone, id: { not: userId } },
            });
            if (phoneExists) {
                throw new ApiError(409, "Phone number already in use.");
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(fullName && { fullName }),
                ...(email && { email }),
                ...(phone !== undefined && { phone: phone || null }),
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                isVerified: true,
            },
        });

        res.json(new ApiResponse(200, user, "Profile updated."));
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/users/password
 */
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            throw new ApiError(400, "Current password and new password are required.");
        }

        if (newPassword.length < 6) {
            throw new ApiError(400, "New password must be at least 6 characters.");
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
            throw new ApiError(401, "Current password is incorrect.");
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { passwordHash },
        });

        res.json(new ApiResponse(200, null, "Password changed successfully."));
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/users/account
 */
export const deleteAccount = async (req, res, next) => {
    try {
        const { password } = req.body || {};

        if (!password) {
            throw new ApiError(400, "Password is required to delete your account.");
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new ApiError(401, "Incorrect password.");
        }

        await prisma.user.delete({ where: { id: req.user.id } });

        res.json(new ApiResponse(200, null, "Account deleted successfully."));
    } catch (err) {
        next(err);
    }
};
