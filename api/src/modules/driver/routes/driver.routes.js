import { Router } from "express";
import { verifyDriver } from "../../../middlewares/verifyToken.middleware.js";
import {
    submitApplication,
    getMyApplication,
    uploadDocument,
    getMyDocuments,
    getProfile,
    updateProfile,
    updateLocation,
    toggleOnline,
    getMyEarnings,
    getPendingAssignment,
    getActiveDelivery,
    acceptOrder,
    rejectOrder,
} from "../controllers/driver.controller.js";

const router = Router();

// ─── Application ──────────────────────────────────────────────
router.post("/application", verifyDriver, submitApplication);
router.get("/application", verifyDriver, getMyApplication);

// ─── Documents ────────────────────────────────────────────────
router.post("/documents", verifyDriver, uploadDocument);
router.get("/documents", verifyDriver, getMyDocuments);

// ─── Profile ──────────────────────────────────────────────────
router.get("/profile", verifyDriver, getProfile);
router.put("/profile", verifyDriver, updateProfile);

// ─── Location & Status ────────────────────────────────────────
router.patch("/location", verifyDriver, updateLocation);
router.patch("/toggle-online", verifyDriver, toggleOnline);

// ─── Earnings ─────────────────────────────────────────────────
router.get("/earnings", verifyDriver, getMyEarnings);

// ─── Order Dispatch (Accept / Reject) ─────────────────────────
router.get("/orders/pending", verifyDriver, getPendingAssignment);
router.get("/orders/active", verifyDriver, getActiveDelivery);
router.post("/orders/:orderId/accept", verifyDriver, acceptOrder);
router.post("/orders/:orderId/reject", verifyDriver, rejectOrder);

export default router;
