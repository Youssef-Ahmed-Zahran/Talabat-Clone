import jwt from "jsonwebtoken";

/**
 * Supported actor types for token generation.
 * @typedef {"user" | "driver" | "admin" | "owner"} ActorType
 */

/**
 * Signs a JWT for the given actor.
 *
 * @param {object} params
 * @param {string}    params.id         - The actor's UUID (from DB)
 * @param {ActorType} params.role       - Actor type: user | driver | admin | owner
 * @param {string}   [params.secret]    - Override env secret (optional, for tests)
 * @param {string}   [params.expiresIn] - Override expiry (optional, e.g. "7d")
 * @returns {string} Signed JWT string
 */
export const createToken = ({ id, role, secret, expiresIn }) => {
    if (!id || !role) {
        throw new Error("createToken: 'id' and 'role' are required.");
    }

    const SECRETS = {
        user: process.env.JWT_SECRET_USER,
        driver: process.env.JWT_SECRET_DRIVER,
        admin: process.env.JWT_SECRET_ADMIN,
        owner: process.env.JWT_SECRET_OWNER,
    };

    const EXPIRIES = {
        user: process.env.JWT_EXPIRES_USER || "30d",
        driver: process.env.JWT_EXPIRES_DRIVER || "30d",
        admin: process.env.JWT_EXPIRES_ADMIN || "8h",
        owner: process.env.JWT_EXPIRES_OWNER || "30d",
    };

    const resolvedSecret = secret || SECRETS[role];
    const resolvedExpiry = expiresIn || EXPIRIES[role];

    if (!resolvedSecret) {
        throw new Error(
            `createToken: No JWT secret found for role "${role}". ` +
            `Set JWT_SECRET_${role.toUpperCase()} in your .env file.`
        );
    }

    const payload = { id, role };

    return jwt.sign(payload, resolvedSecret, { expiresIn: resolvedExpiry });
};

/**
 * Convenience wrappers — use these in route handlers.
 */
export const createUserToken = (id) => createToken({ id, role: "user" });
export const createDriverToken = (id) => createToken({ id, role: "driver" });
export const createAdminToken = (id) => createToken({ id, role: "admin" });
export const createOwnerToken = (id) => createToken({ id, role: "owner" });