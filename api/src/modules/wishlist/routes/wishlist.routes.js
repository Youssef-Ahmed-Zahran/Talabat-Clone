import { Router } from "express";
import { verifyUser } from "../../../middlewares/verifyToken.middleware.js";
import {
    toggleWishlist,
    getWishlist,
    checkWishlistStatus,
    clearWishlist,
} from "../controllers/wishlist.controller.js";

const router = Router();

// All wishlist routes require authentication
router.use(verifyUser);

router.get("/", getWishlist);
router.delete("/", clearWishlist);
router.post("/:storeId", toggleWishlist);
router.get("/check/:storeId", checkWishlistStatus);

export default router;
