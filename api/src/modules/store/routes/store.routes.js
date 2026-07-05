import { Router } from "express";
import multer from "multer";
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
import { bulkImportStores } from "../controllers/bulkImport.controller.js";
import { globalSearch } from "../controllers/search.controller.js";

const router = Router();

// Multer: memory storage, xlsx only, max 15 MB
const xlsxUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];
        if (allowed.includes(file.mimetype) || file.originalname.endsWith(".xlsx")) {
            cb(null, true);
        } else {
            cb(new Error("Only .xlsx Excel files are accepted."));
        }
    },
});

router.post("/bulk-import", verifyAdmin, xlsxUpload.single("file"), bulkImportStores);
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
