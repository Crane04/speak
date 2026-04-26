import { Router } from "express";
import {
  getPendingMessages,
  approveMessage,
  rejectMessage,
  deleteMessage,
  getAllMessages,
} from "../controllers/admin.controller";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

// Apply admin auth to all admin routes
router.use(adminAuth);

// GET /api/admin/messages - get all messages (filterable by status)
router.get("/messages", getAllMessages);

// GET /api/admin/messages/pending - get pending messages
router.get("/messages/pending", getPendingMessages);

// PATCH /api/admin/messages/:id/approve
router.patch("/messages/:id/approve", approveMessage);

// PATCH /api/admin/messages/:id/reject
router.patch("/messages/:id/reject", rejectMessage);

// DELETE /api/admin/messages/:id
router.delete("/messages/:id", deleteMessage);

export default router;
