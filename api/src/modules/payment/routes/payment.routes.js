import { Router } from "express";
import { verifyUser, verifyAdmin } from "../../../middlewares/verifyToken.middleware.js";
import {
    addSavedCard,
    getSavedCards,
    deleteSavedCard,
    setDefaultCard,
    getPaymentMethods,
    getStorePaymentMethods,
    updatePaymentStatus,
} from "../controllers/payment.controller.js";

const router = Router();

// ─── Saved Cards ──────────────────────────────────────────────
router.post("/cards", verifyUser, addSavedCard);
router.get("/cards", verifyUser, getSavedCards);
router.delete("/cards/:id", verifyUser, deleteSavedCard);
router.patch("/cards/:id/default", verifyUser, setDefaultCard);

// ─── Payment Methods ──────────────────────────────────────────
router.get("/methods", getPaymentMethods);
router.get("/stores/:storeId/methods", getStorePaymentMethods);

// ─── Payment Status ───────────────────────────────────────────
router.patch("/:orderId/status", verifyAdmin, updatePaymentStatus);

export default router;
