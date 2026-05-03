import { Router } from "express";
import { optionalAuth } from "../../../middlewares/verifyToken.middleware.js";
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controllers/notification.controller.js";

const router = Router();

// Apply optionalAuth as any generic authenticated actor can fetch their notifications
router.use(optionalAuth);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
