import { Router } from "express";
import { verifyUser, verifyOwner, verifyAdmin, verifyDriver } from "../../../middlewares/verifyToken.middleware.js";
import {
    getOrderTracking,
    assignDriver,
    updateTrackingStatus,
    updateDriverLocation,
} from "../controllers/tracking.controller.js";

const router = Router();

// GET requires one of the tokens (handled in controller)
// We just apply a middleware that parse any token softly, but the controller enforces it.
// To handle multiple optional auth correctly, we need an optional token middleware, 
// assuming you have or will adjust one, for now we will just let it pass through an optional token check
import { optionalAuth } from "../../../middlewares/verifyToken.middleware.js"; // This needs to be available

router.get("/:orderId", optionalAuth, getOrderTracking);

// Admin / System
router.patch("/:orderId/assign-driver", verifyAdmin, assignDriver);

// Driver
router.patch("/:orderId/status", verifyDriver, updateTrackingStatus);
router.patch("/location", verifyDriver, updateDriverLocation);

export default router;
