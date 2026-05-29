import { Router } from "express";
import { verifyAdmin, verifyStoreManager, optionalAuth } from "../../../middlewares/verifyToken.middleware.js";
import {
    createStore,
    getAllStores,
    getNearbyStores,
    getStoreById,
    updateStore,
    deleteStore,
    toggleStoreActive,
} from "../controllers/store.controller.js";
import { globalSearch } from "../controllers/search.controller.js";

const router = Router();

router.post("/", verifyAdmin, createStore);
router.get("/admin", verifyAdmin, getAllStores);
router.get("/nearby", optionalAuth, getNearbyStores);
router.get("/search", optionalAuth, globalSearch);   // ← Global search (before /:id)
router.get("/", optionalAuth, getAllStores);
router.get("/:id", getStoreById);
router.put("/:id", verifyStoreManager, updateStore);
router.delete("/:id", verifyAdmin, deleteStore);
router.patch("/:id/toggle", verifyAdmin, toggleStoreActive);

export default router;
