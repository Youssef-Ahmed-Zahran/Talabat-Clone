import { Router } from "express";
import { verifyAdmin, optionalAuth } from "../../../middlewares/verifyToken.middleware.js";
import {
    createZone,
    getAllZones,
    getZoneById,
    detectZoneFromCoords,
    updateZone,
    deleteZone,
    assignStoresToZone,
    removeStoreFromZone,
    assignDriversToZone,
    removeDriverFromZone,
} from "../controllers/zone.controller.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────
router.get("/detect", detectZoneFromCoords);
router.get("/", getAllZones);
router.get("/:id", getZoneById);

// ── Admin only ────────────────────────────────────────────────
router.post("/", verifyAdmin, createZone);
router.put("/:id", verifyAdmin, updateZone);
router.delete("/:id", verifyAdmin, deleteZone);

// ── Zone ↔ Store assignments ──────────────────────────────────
router.post("/:id/stores", verifyAdmin, assignStoresToZone);
router.delete("/:id/stores/:storeId", verifyAdmin, removeStoreFromZone);

// ── Zone ↔ Driver assignments ─────────────────────────────────
router.post("/:id/drivers", verifyAdmin, assignDriversToZone);
router.delete("/:id/drivers/:driverId", verifyAdmin, removeDriverFromZone);

export default router;
