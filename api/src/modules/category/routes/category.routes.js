import { Router } from "express";
import { verifyAdmin } from "../../../middlewares/verifyToken.middleware.js";
import {
    getAllMainCategories,
    getMainCategoryById,
    getSubCategories,
    createMainCategory,
    updateMainCategory,
    deleteMainCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    linkStoreToSubCategory,
    unlinkStoreFromSubCategory,
    getStoresInSubCategory,
    getAllStoresInSubCategoryAdmin,
} from "../controllers/category.controller.js";

const router = Router();

// ─── Main Categories ──────────────────────────────────────────
router.get("/", getAllMainCategories);
router.get("/:id", getMainCategoryById);
router.post("/", verifyAdmin, createMainCategory);
router.put("/:id", verifyAdmin, updateMainCategory);
router.delete("/:id", verifyAdmin, deleteMainCategory);

// ─── Sub-Categories ───────────────────────────────────────────
router.get("/:id/sub-categories", getSubCategories);
router.post("/:id/sub-categories", verifyAdmin, createSubCategory);
router.put("/sub-categories/:subId", verifyAdmin, updateSubCategory);
router.delete("/sub-categories/:subId", verifyAdmin, deleteSubCategory);

// ─── Store ↔ Sub-Category Links ──────────────────────────────
router.get("/sub-categories/:subId/stores/all", verifyAdmin, getAllStoresInSubCategoryAdmin);
router.get("/sub-categories/:subId/stores", getStoresInSubCategory);
router.post("/sub-categories/:subId/stores", verifyAdmin, linkStoreToSubCategory);
router.delete("/sub-categories/:subId/stores/:storeId", verifyAdmin, unlinkStoreFromSubCategory);

export default router;
