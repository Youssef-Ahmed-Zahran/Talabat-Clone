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
    getPlatformWallet,
    getStoreWallet,
    listDebtPayments,
    confirmDebtPayment,
    rejectDebtPayment,
    processMonthlyStorePayout,
    getStoreWithdrawals,
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

// ─── Driver Debt Payment Review (VF Cash / InstaPay) ──────────
router.get("/debt-payments", listDebtPayments);
router.post("/debt-payments/:paymentId/confirm", confirmDebtPayment);
router.post("/debt-payments/:paymentId/reject", rejectDebtPayment);

// ─── Platform & Store Wallets ─────────────────────────────────
router.get("/platform/wallet", getPlatformWallet);
router.get("/stores/:storeId/wallet", getStoreWallet);
router.post("/stores/:storeId/payout", processMonthlyStorePayout);
router.get("/stores/:storeId/withdrawals", getStoreWithdrawals);

// ─── Admin Management (SUPER_ADMIN only) ──────────────────────
router.post("/admins", allowAdminRoles("SUPER_ADMIN"), createAdmin);
router.get("/admins", getAllAdmins);

export default router;

