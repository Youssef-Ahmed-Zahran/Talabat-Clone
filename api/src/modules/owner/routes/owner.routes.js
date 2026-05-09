import { Router } from "express";
import { verifyOwner } from "../../../middlewares/verifyToken.middleware.js";
import {
    getMyStore,
    updatePassword,
    getActionLogs,
    getDashboardStats,
} from "../controllers/owner.controller.js";
import { getStoreWallet } from "../../driver/controllers/wallet.controller.js";

const router = Router();

router.get("/wallet", verifyOwner, getStoreWallet);
router.get("/store", verifyOwner, getMyStore);
router.patch("/password", verifyOwner, updatePassword);
router.get("/logs", verifyOwner, getActionLogs);
router.get("/dashboard", verifyOwner, getDashboardStats);

export default router;
