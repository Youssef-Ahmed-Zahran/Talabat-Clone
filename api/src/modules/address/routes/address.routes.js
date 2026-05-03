import { Router } from "express";
import { verifyUser } from "../../../middlewares/verifyToken.middleware.js";
import {
    getMyAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from "../controllers/address.controller.js";

const router = Router();

router.get("/", verifyUser, getMyAddresses);
router.post("/", verifyUser, addAddress);
router.put("/:id", verifyUser, updateAddress);
router.delete("/:id", verifyUser, deleteAddress);
router.patch("/:id/default", verifyUser, setDefaultAddress);

export default router;
