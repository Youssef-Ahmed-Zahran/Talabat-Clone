import bcrypt from "bcryptjs";
import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import {
    createUserToken,
    createDriverToken,
    createAdminToken,
    createOwnerToken,
} from "../../../utils/createToken.js";
import { resolveGeographyData } from "../../../utils/geography.util.js";

const setTokenCookie = (res, token, role) => {
    res.cookie(`jwt_${role}`, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
    });
};

// ═══════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/logout
 * Clears the jwt cookie for any role (User, Driver, Admin, Owner)
 */
export const logout = (req, res, next) => {
    try {
        const cookieOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            path: "/",
        };
        res.clearCookie("jwt_user", cookieOpts);
        res.clearCookie("jwt_driver", cookieOpts);
        res.clearCookie("jwt_admin", cookieOpts);
        res.clearCookie("jwt_owner", cookieOpts);
        res.clearCookie("jwt", cookieOpts); // Fallback for old sessions

        res.status(200).json(new ApiResponse(200, null, "Logout successful."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// USER AUTH
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/user/register
 */
export const registerUser = async (req, res, next) => {
    try {
        const { fullName, email, password, phone } = req.body;

        if (!fullName || !email || !password) {
            throw new ApiError(400, "Full name, email, and password are required.");
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new ApiError(409, "Email is already registered.");
        }

        if (phone) {
            const phoneExists = await prisma.user.findUnique({ where: { phone } });
            if (phoneExists) {
                throw new ApiError(409, "Phone number is already registered.");
            }
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: { fullName, email, phone: phone || null, passwordHash },
            select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
        });

        const token = createUserToken(user.id);
        setTokenCookie(res, token, "user");

        res.status(201).json(
            new ApiResponse(201, { user, token }, "Registration successful.")
        );
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/user/login
 */
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, "Email and password are required.");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new ApiError(401, "Invalid email or password.");
        }

        if (user.isBlocked) {
            throw new ApiError(403, "Your account has been suspended. Contact support.");
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new ApiError(401, "Invalid email or password.");
        }

        const token = createUserToken(user.id);
        setTokenCookie(res, token, "user");

        res.json(
            new ApiResponse(200, {
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isVerified: user.isVerified,
                },
                token,
            }, "Login successful.")
        );
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DRIVER AUTH
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/driver/register
 */
export const registerDriver = async (req, res, next) => {
    try {
        const { email, password, phone, cityName, governorateName, countryName, countryCode } = req.body;

        if (!email || !password || !cityName || !countryName || !countryCode) {
            throw new ApiError(400, "Email, password, cityName, countryName, and countryCode are required.");
        }

        const existing = await prisma.driver.findUnique({ where: { email } });
        if (existing) {
            throw new ApiError(409, "Email is already registered.");
        }

        if (phone) {
            const phoneExists = await prisma.driver.findUnique({ where: { phone } });
            if (phoneExists) {
                throw new ApiError(409, "Phone number is already registered.");
            }
        }

        // Resolve city
        const resolvedGeo = await resolveGeographyData({
            cityName,
            governorateName,
            countryName,
            countryCode
        });

        const passwordHash = await bcrypt.hash(password, 12);

        const driver = await prisma.driver.create({
            data: { 
                email, 
                phone: phone || null, 
                passwordHash, 
                cityId: resolvedGeo.cityId,
                wallet: { create: {} } // Create default wallet
            },
            select: {
                id: true, email: true, phone: true, cityId: true,
                status: true, isOnline: true, createdAt: true,
                application: {
                    select: { status: true, vehicleType: true, vehiclePlateNumber: true, firstName: true, familyName: true }
                }
            },
        });

        const token = createDriverToken(driver.id);
        setTokenCookie(res, token, "driver");

        res.status(201).json(
            new ApiResponse(201, {
                driver: {
                    id: driver.id,
                    email: driver.email,
                    phone: driver.phone,
                    status: driver.status,
                    isOnline: driver.isOnline,
                    createdAt: driver.createdAt,
                    applicationStatus: driver.application?.status ?? null,
                    vehicleType: driver.application?.vehicleType ?? null,
                    vehiclePlateNumber: driver.application?.vehiclePlateNumber ?? null,
                    firstName: driver.application?.firstName ?? null,
                    familyName: driver.application?.familyName ?? null,
                },
                token
            }, "Driver registration successful.")
        );
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/driver/login
 */
export const loginDriver = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, "Email and password are required.");
        }

        const driver = await prisma.driver.findUnique({
            where: { email },
            include: {
                application: {
                    select: { status: true, vehicleType: true, vehiclePlateNumber: true, firstName: true, familyName: true }
                }
            }
        });
        if (!driver) {
            throw new ApiError(401, "Invalid email or password.");
        }

        if (driver.status === "SUSPENDED") {
            throw new ApiError(403, "Your driver account has been suspended. Contact support.");
        }

        const valid = await bcrypt.compare(password, driver.passwordHash);
        if (!valid) {
            throw new ApiError(401, "Invalid email or password.");
        }

        const token = createDriverToken(driver.id);
        setTokenCookie(res, token, "driver");

        res.json(
            new ApiResponse(200, {
                driver: {
                    id: driver.id,
                    email: driver.email,
                    phone: driver.phone,
                    status: driver.status,
                    isOnline: driver.isOnline,
                    createdAt: driver.createdAt,
                    applicationStatus: driver.application?.status ?? null,
                    vehicleType: driver.application?.vehicleType ?? null,
                    vehiclePlateNumber: driver.application?.vehiclePlateNumber ?? null,
                    firstName: driver.application?.firstName ?? null,
                    familyName: driver.application?.familyName ?? null,
                },
                token,
            }, "Login successful.")
        );
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN AUTH
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/admin/login
 */
export const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, "Email and password are required.");
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            throw new ApiError(401, "Invalid email or password.");
        }

        if (!admin.isActive) {
            throw new ApiError(403, "Your admin account is inactive. Contact support.");
        }

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) {
            throw new ApiError(401, "Invalid email or password.");
        }

        const token = createAdminToken(admin.id);
        setTokenCookie(res, token, "admin");

        res.json(
            new ApiResponse(200, {
                admin: {
                    id: admin.id,
                    fullName: admin.fullName,
                    email: admin.email,
                    role: admin.role,
                },
                token,
            }, "Admin login successful.")
        );
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// OWNER AUTH
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/owner/login
 */
export const loginOwner = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, "Email and password are required.");
        }

        const owner = await prisma.ownerAccount.findUnique({
            where: { email },
            include: {
                store: {
                    select: { id: true, name: true, storeType: true },
                },
            },
        });
        if (!owner) {
            throw new ApiError(401, "Invalid email or password.");
        }

        if (!owner.isActive) {
            throw new ApiError(403, "Your owner account is inactive. Contact support.");
        }

        const valid = await bcrypt.compare(password, owner.passwordHash);
        if (!valid) {
            throw new ApiError(401, "Invalid email or password.");
        }

        const token = createOwnerToken(owner.id);
        setTokenCookie(res, token, "owner");

        res.json(
            new ApiResponse(200, {
                owner: {
                    id: owner.id,
                    email: owner.email,
                    storeId: owner.storeId,
                    store: owner.store,
                },
                token,
            }, "Owner login successful.")
        );
    } catch (err) {
        next(err);
    }
};
