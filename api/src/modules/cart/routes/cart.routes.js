import { Router } from "express";
import { verifyUser } from "../../../middlewares/verifyToken.middleware.js";
import {
    getCart,
    updateItemQuantity,
    removeItem,
    clearCart,
    addItem,
} from "../controllers/cart.controller.js";

const router = Router();

router.get("/:storeId", verifyUser, getCart);
router.post("/items", verifyUser, addItem);
router.patch("/items/:itemId/quantity", verifyUser, updateItemQuantity);
router.delete("/items/:itemId", verifyUser, removeItem);
router.delete("/:cartId", verifyUser, clearCart);

export default router;
