import { Router } from "express";
import { verifyUser, verifyOwner, verifyAdmin } from "../../../middlewares/verifyToken.middleware.js";
import {
    placeOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    reorder,
    getStoreOrders,
    updateOrderStatus,
    getOrdersByAdmin,
} from "../controllers/order.controller.js";

const router = Router();

// ─── User ─────────────────────────────────────────────────────
router.post("/", verifyUser, placeOrder);
router.get("/my", verifyUser, getMyOrders);
router.get("/my/:id", verifyUser, getOrderById);
router.patch("/:id/cancel", verifyUser, cancelOrder);
router.post("/:id/reorder", verifyUser, reorder);

// ─── Owner ────────────────────────────────────────────────────
router.get("/store", verifyOwner, getStoreOrders);
router.patch("/store/:id/status", verifyOwner, updateOrderStatus);

// ─── Admin ────────────────────────────────────────────────────
router.get("/admin/all", verifyAdmin, getOrdersByAdmin);
router.patch("/admin/:id/status", verifyAdmin, updateOrderStatus);

export default router;
