import { Router } from "express";
import { verifyUser, verifyAdmin, optionalUser } from "../../../middlewares/verifyToken.middleware.js";
import {
    createReview,
    getStoreReviews,
    deleteReview,
} from "../controllers/review.controller.js";

const router = Router();

router.post("/stores/:storeId/orders/:orderId", verifyUser, createReview);
router.get("/stores/:storeId", getStoreReviews);
router.delete("/:reviewId", verifyUser, deleteReview);

export default router;
