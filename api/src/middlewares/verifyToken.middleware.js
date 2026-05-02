import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

// ─── Secret map ──────────────────────────────────────────────────────────────
const SECRETS = {
    user: () => process.env.JWT_SECRET_USER,
    driver: () => process.env.JWT_SECRET_DRIVER,
    admin: () => process.env.JWT_SECRET_ADMIN,
    owner: () => process.env.JWT_SECRET_OWNER,
};

// ─── DB lookup per role ───────────────────────────────────────────────────────
const DB_FINDERS = {
    user: (id) =>
        prisma.user.findUnique({
            where: { id },
            select: { id: true, isBlocked: true, isVerified: true },
        }),

    driver: (id) =>
        prisma.driver.findUnique({
            where: { id },
            select: { id: true, status: true },
        }),

    admin: async (id) => {
        // First try the dedicated Admin table
        const adminActor = await prisma.admin.findUnique({
            where: { id },
            select: { id: true, isActive: true, role: true },
        });
        if (adminActor) return adminActor;

        // If not found, check the User table for promoted users
        const userActor = await prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true, isBlocked: true },
        });

        if (userActor && (userActor.role === "ADMIN" || userActor.role === "SUPER_ADMIN")) {
            return {
                id: userActor.id,
                isActive: !userActor.isBlocked,
                role: userActor.role,
                isFromUserTable: true,
            };
        }
        return null;
    },

    owner: (id) =>
        prisma.ownerAccount.findUnique({
            where: { id },
            select: { id: true, isActive: true, storeId: true },
        }),
};

// ─── Core verifier factory ────────────────────────────────────────────────────
/**
 * Returns an Express middleware that:
 *  1. Extracts Bearer token from Authorization header.
 *  2. Verifies it against the role-specific secret.
 *  3. Looks the actor up in the DB (live check — catches bans/deletions).
 *  4. Attaches the actor to req[role] (e.g. req.user, req.driver …).
 *
 * @param {"user"|"driver"|"admin"|"owner"} role
 */
const makeVerifier = (role) => async (req, res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided. Please log in.",
            });
        }

        // 2. Verify signature + expiry
        let decoded;
        const tryVerify = (secret) => {
            try {
                return jwt.verify(token, secret);
            } catch (err) {
                return null;
            }
        };

        // Try the primary secret for the requested role
        const primarySecret = SECRETS[role]();
        decoded = tryVerify(primarySecret);

        // Fallback for promoted users: If we're verifying for "admin" but failed, try "user" secret
        if (!decoded && role === "admin") {
            const userSecret = SECRETS.user();
            decoded = tryVerify(userSecret);
        }

        if (!decoded) {
            // Check if it was expired or just invalid by trying one last time to capture the error
            try {
                jwt.verify(token, primarySecret);
            } catch (err) {
                const message =
                    err.name === "TokenExpiredError"
                        ? "Session expired. Please log in again."
                        : "Invalid token. Please log in again.";
                return res.status(401).json({ success: false, message });
            }
        }

        // 3. Sanity check — token role must match the middleware role
        // EXCEPTION: Allow "user" tokens to access "admin" routes if the user has been promoted
        let rolesMatch = decoded.role === role;

        if (!rolesMatch && role === "admin" && decoded.role === "user") {
            // We'll allow this mismatch here, but the DB lookup below will enforce the actual role
            rolesMatch = true; 
        }

        if (!rolesMatch) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Insufficient permissions.",
            });
        }

        // 4. Live DB lookup
        const finder = DB_FINDERS[role];
        const actor = await finder(decoded.id);

        if (!actor) {
            return res.status(401).json({
                success: false,
                message: "Account not found. Please log in again.",
            });
        }

        // 5. Role-specific active checks
        if (role === "user" && actor.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended. Contact support.",
            });
        }

        if (role === "driver" && actor.status === "SUSPENDED") {
            return res.status(403).json({
                success: false,
                message: "Your driver account has been suspended. Contact support.",
            });
        }

            if (role === "admin" && actor.isFromUserTable) {
             // For users promoted to admin, we've already verified the token above.
             // We just need to ensure req.user is also populated for convenience.
                req.user = actor;
            }

        if ((role === "admin" || role === "owner") && !actor.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Contact support.",
            });
        }

        // 6. Attach actor to request
        req[role] = actor;
        next();
    } catch (err) {
        next(err);
    }
};

// ─── Named middleware exports ─────────────────────────────────────────────────
export const verifyUser = makeVerifier("user");
export const verifyDriver = makeVerifier("driver");
export const verifyAdmin = makeVerifier("admin");
export const verifyOwner = makeVerifier("owner");

/**
 * Combined middleware that allows either an Owner or an Admin.
 * Used for store management routes (Restaurant, Pharmacy, Grocery).
 */
export const verifyStoreManager = async (req, res, next) => {
    // We'll try to find a valid actor by checking admin first, then owner.
    // This is because an admin might be logged in with a user token (promoted) 
    // or a dedicated admin token.
    
    // We can reuse the logic by manually checking tokens or using a utility.
    // For simplicity and to avoid duplicating too much logic, we'll try to 
    // verify for both and see if either attaches an actor.

    try {
        let token = null;
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided." });
        }

        let decoded;
        try {
            decoded = jwt.decode(token);
        } catch {
            return res.status(401).json({ success: false, message: "Invalid token." });
        }

        if (!decoded || !decoded.role) {
            return res.status(401).json({ success: false, message: "Invalid token payload." });
        }

        const role = decoded.role.toLowerCase();

        // If it's an admin or a user (who might be promoted), try admin verification
        if (role === "admin" || role === "super_admin" || role === "user") {
            // Attempt admin verification via DB_FINDERS.admin
            // Use both admin and user secrets if necessary
            let adminDecoded = null;
            try {
                adminDecoded = jwt.verify(token, SECRETS.admin());
            } catch {
                try {
                    adminDecoded = jwt.verify(token, SECRETS.user());
                } catch { /* ignore */ }
            }

            if (adminDecoded) {
                const actor = await DB_FINDERS.admin(adminDecoded.id);
                if (actor && actor.isActive) {
                    req.admin = actor;
                    return next();
                }
            }
        }

        // If it's an owner, try owner verification
        if (role === "owner") {
            try {
                const ownerDecoded = jwt.verify(token, SECRETS.owner());
                if (ownerDecoded) {
                    const actor = await DB_FINDERS.owner(ownerDecoded.id);
                    if (actor && actor.isActive) {
                        req.owner = actor;
                        return next();
                    }
                }
            } catch { /* ignore */ }
        }

        return res.status(403).json({
            success: false,
            message: "Access denied. Store manager permissions required.",
        });
    } catch (err) {
        next(err);
    }
};

// ─── Admin role guard ─────────────────────────────────────────────────────────
/**
 * Use AFTER verifyAdmin.
 * Allows only admins whose role is in the provided allowedRoles array.
 *
 * @param {...string} allowedRoles  e.g. allowAdminRoles("SUPER_ADMIN")
 *
 * @example
 * router.delete("/user/:id", verifyAdmin, allowAdminRoles("SUPER_ADMIN"), handler);
 */
export const allowAdminRoles = (...allowedRoles) =>
    (req, res, next) => {
        if (!req.admin || !allowedRoles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${allowedRoles.join(", ")}.`,
            });
        }
        next();
    };

/**
 * Optional-auth middleware — attaches req.user if a valid user token is
 * present, but does NOT block the request if there is none.
 * Useful for public endpoints that personalise results when logged in.
 */
export const optionalUser = async (req, _res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) return next();
        const secret = SECRETS.user();
        if (!secret) return next();

        const decoded = jwt.verify(token, secret);
        if (decoded.role !== "user") return next();

        const user = await DB_FINDERS.user(decoded.id);
        if (user && !user.isBlocked) req.user = user;
    } catch {
        // silently ignore — optional auth
    }
    next();
};

/**
 * Optional-auth middleware — decodes generic token for all 4 roles 
 * (User, Driver, Admin, Owner) without blocking if token is missing.
 */
export const optionalAuth = async (req, res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) return next();
        
        let decoded;
        try {
            // we decode without verifying signature first to find the role
            decoded = jwt.decode(token); 
        } catch {
            return next();
        }

        if (!decoded || !decoded.role) return next();

        const role = decoded.role.toLowerCase() === "super_admin" ? "admin" : decoded.role.toLowerCase();
        
        // Verify token properly now using the correct secret
        const secret = SECRETS[role]();
        if (!secret) return next();

        jwt.verify(token, secret);

        const actor = await DB_FINDERS[role](decoded.id);
        
        if (actor) {
            req[role] = actor;
            // Also map it back to specific original keys like req.user
            if (decoded.role === "USER") req.user = actor;
            if (decoded.role === "DRIVER") req.driver = actor;
            if (decoded.role === "OWNER") req.owner = actor;
            if (decoded.role === "ADMIN" || decoded.role === "SUPER_ADMIN") req.admin = actor;
        }
    } catch {
        // silently ignore
    }
    next();
};