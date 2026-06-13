import { Router } from "express";
import { verifyStoreManager } from "../../../middlewares/verifyToken.middleware.js";
import {
    createSection,
    getSections,
    updateSection,
    deleteSection,
    reorderSections,
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    reorderProducts,
    createOptionGroup,
    getOptionGroups,
    updateOptionGroup,
    deleteOptionGroup,
    createOptionValue,
    getOptionValueById,
    updateOptionValue,
    deleteOptionValue,
    bulkAddSections,
} from "../controllers/catalog.controller.js";

const router = Router();

// ─── Bulk ─────────────────────────────────────────────────────
router.post("/:storeId/bulk", verifyStoreManager, bulkAddSections);

// ─── Sections ─────────────────────────────────────────────────
router.post("/:storeId/sections", verifyStoreManager, createSection);
router.get("/:storeId/sections", getSections);
router.put("/sections/:sectionId", verifyStoreManager, updateSection);
router.delete("/sections/:sectionId", verifyStoreManager, deleteSection);
router.patch("/:storeId/sections/reorder", verifyStoreManager, reorderSections);

// ─── Products ─────────────────────────────────────────────────
router.post("/:storeId/products", verifyStoreManager, createProduct);
router.get("/:storeId/products", getProducts);
router.get("/:storeId/products/:productId", getProductById);
router.put("/products/:productId", verifyStoreManager, updateProduct);
router.delete("/products/:productId", verifyStoreManager, deleteProduct);
router.patch("/:storeId/products/reorder", verifyStoreManager, reorderProducts);

// ─── Option Groups ────────────────────────────────────────────
router.post("/products/:productId/option-groups", verifyStoreManager, createOptionGroup);
router.get("/products/:productId/option-groups", getOptionGroups);
router.put("/option-groups/:groupId", verifyStoreManager, updateOptionGroup);
router.delete("/option-groups/:groupId", verifyStoreManager, deleteOptionGroup);

// ─── Option Values ────────────────────────────────────────────
router.post("/option-groups/:groupId/values", verifyStoreManager, createOptionValue);
router.get("/option-values/:valueId", getOptionValueById);
router.put("/option-values/:valueId", verifyStoreManager, updateOptionValue);
router.delete("/option-values/:valueId", verifyStoreManager, deleteOptionValue);

export default router;

