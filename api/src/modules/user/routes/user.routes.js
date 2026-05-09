import { Router } from "express";
import { verifyUser } from "../../../middlewares/verifyToken.middleware.js";
import {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
} from "../controllers/user.controller.js";
import { getMyUserWallet } from "../../driver/controllers/wallet.controller.js";

const router = Router();

router.get("/wallet", verifyUser, getMyUserWallet);
router.get("/profile", verifyUser, getProfile);
router.put("/profile", verifyUser, updateProfile);
router.patch("/password", verifyUser, changePassword);
router.delete("/account", verifyUser, deleteAccount);

export default router;
