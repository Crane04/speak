import { Router } from "express";
import {
  createMessage,
  getPins,
  getMessageById,
  reportMessage,
} from "../controllers/message.controller";
import { upload } from "../middleware/upload";
import { messageLimiter, reportLimiter } from "../middleware/rateLimit";
import { validateMessage } from "../middleware/validateMessage";

const router = Router();

// POST /api/messages - create new message
router.post(
  "/",
  messageLimiter,
  upload.single("file"),
  validateMessage,
  createMessage
);

// GET /api/messages/pins - get all approved pin locations (lightweight)
router.get("/pins", getPins);

// GET /api/messages/:id - get full message by ID
router.get("/:id", getMessageById);

// POST /api/messages/:id/report - report a message
router.post("/:id/report", reportLimiter, reportMessage);

export default router;
