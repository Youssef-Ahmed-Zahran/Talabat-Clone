import { Router } from "express";
import {
    logout,
    registerUser,
    loginUser,
    registerDriver,
    loginDriver,
    loginAdmin,
    loginOwner,
} from "../controllers/auth.controller.js";

const router = Router();

// ─── General Auth ─────────────────────────────────────────────
router.post("/logout", logout);

// ─── User ─────────────────────────────────────────────────────
router.post("/user/register", registerUser);
router.post("/user/login", loginUser);

// ─── Driver ───────────────────────────────────────────────────
router.post("/driver/register", registerDriver);
router.post("/driver/login", loginDriver);

// ─── Admin ────────────────────────────────────────────────────
router.post("/admin/login", loginAdmin);

// ─── Owner ────────────────────────────────────────────────────
router.post("/owner/login", loginOwner);

export default router;
