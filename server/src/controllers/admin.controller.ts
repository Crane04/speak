import { Request, Response } from "express";
import { MessageModel } from "../models/Message";

// GET /api/admin/messages/pending
export const getPendingMessages = async (_req: Request, res: Response): Promise<void> => {
  try {
    const messages = await MessageModel.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = messages.map((m) => ({
      id: m._id.toString(),
      type: m.type,
      text: m.text,
      fileUrl: m.fileUrl,
      fileMimeType: m.fileMimeType,
      lat: m.lat,
      lng: m.lng,
      status: m.status,
      reportCount: m.reportCount,
      createdAt: m.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("getPendingMessages error:", error);
    res.status(500).json({ error: "Failed to fetch pending messages." });
  }
};

// PATCH /api/admin/messages/:id/approve
export const approveMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await MessageModel.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!message) {
      res.status(404).json({ error: "Message not found." });
      return;
    }

    res.json({ id: message._id.toString(), status: message.status });
  } catch (error) {
    console.error("approveMessage error:", error);
    res.status(500).json({ error: "Failed to approve message." });
  }
};

// PATCH /api/admin/messages/:id/reject
export const rejectMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await MessageModel.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!message) {
      res.status(404).json({ error: "Message not found." });
      return;
    }

    res.json({ id: message._id.toString(), status: message.status });
  } catch (error) {
    console.error("rejectMessage error:", error);
    res.status(500).json({ error: "Failed to reject message." });
  }
};

// DELETE /api/admin/messages/:id
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await MessageModel.findByIdAndDelete(req.params.id);

    if (!message) {
      res.status(404).json({ error: "Message not found." });
      return;
    }

    res.json({ message: "Message deleted." });
  } catch (error) {
    console.error("deleteMessage error:", error);
    res.status(500).json({ error: "Failed to delete message." });
  }
};

// GET /api/admin/messages (all - for full dashboard view)
export const getAllMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const messages = await MessageModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formatted = messages.map((m) => ({
      id: m._id.toString(),
      type: m.type,
      text: m.text,
      fileUrl: m.fileUrl,
      fileMimeType: m.fileMimeType,
      lat: m.lat,
      lng: m.lng,
      status: m.status,
      reportCount: m.reportCount,
      createdAt: m.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("getAllMessages error:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};
