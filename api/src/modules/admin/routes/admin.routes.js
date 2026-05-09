import { Router } from "express";
import { verifyAdmin, allowAdminRoles } from "../../../middlewares/verifyToken.middleware.js";
import {
    getAllUsers,
    getUserById,
    blockUser,
    unblockUser,
    getAllDrivers,
    getDriverById,
    approveApplication,
    rejectApplication,
    suspendDriver,
    unsuspendDriver,
    deleteDriver,
    verifyDocument,
    rejectDocument,
    createAdmin,
    getAllAdmins,
    getDashboardStats,
    getUserOrders,
} from "../controllers/admin.controller.js";
import { 
    getDriverWalletByAdmin, 
    adminTopUp, 
    adminDebit, 
    updateCreditLimit,
    getPlatformWallet
} from "../../driver/controllers/wallet.controller.js";

const router = Router();

// All routes require admin auth
router.use(verifyAdmin);

// ─── Dashboard ────────────────────────────────────────────────
router.get("/dashboard", getDashboardStats);

// ─── Customer Management ──────────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.get("/users/:id/orders", getUserOrders);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);

// ─── Driver Management ────────────────────────────────────────
router.get("/drivers", getAllDrivers);
router.get("/drivers/:id", getDriverById);
router.patch("/drivers/:id/approve", approveApplication);
router.patch("/drivers/:id/reject", rejectApplication);
router.patch("/drivers/:id/suspend", suspendDriver);
router.patch("/drivers/:id/unsuspend", unsuspendDriver);
router.delete("/drivers/:id", deleteDriver);
router.patch("/drivers/documents/:docId/verify", verifyDocument);
router.patch("/drivers/documents/:docId/reject", rejectDocument);

// ─── Driver Wallet Management ─────────────────────────────────
router.get("/drivers/:driverId/wallet", getDriverWalletByAdmin);
router.post("/drivers/:driverId/wallet/topup", adminTopUp);
router.post("/drivers/:driverId/wallet/debit", adminDebit);
router.patch("/drivers/:driverId/wallet/credit-limit", updateCreditLimit);
router.get("/platform/wallet", getPlatformWallet);

// ─── Admin Management (SUPER_ADMIN only) ──────────────────────
router.post("/admins", allowAdminRoles("SUPER_ADMIN"), createAdmin);
router.get("/admins", getAllAdmins);

export default router;
