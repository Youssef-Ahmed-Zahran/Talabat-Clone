import { Router } from "express";
import { optionalAuth } from "../../../middlewares/verifyToken.middleware.js";
import {
  getConversationByOrder,
  getMessages,
  sendMessage,
} from "../controllers/messaging.controller.js";

const router = Router();

// optionalAuth decodes any valid token (user or driver) and attaches req.user / req.driver
router.get("/conversations/:orderId", optionalAuth, getConversationByOrder);
router.get(
  "/conversations/:conversationId/messages",
  optionalAuth,
  getMessages,
);
router.post(
  "/conversations/:conversationId/messages",
  optionalAuth,
  sendMessage,
);

export default router;
