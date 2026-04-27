import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import { MessageModel } from "../models/Message";
import { MessageType } from "../types/message";

const getResourceType = (mimeType: string): "image" | "video" | "raw" => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "video";
  return "raw";
};

// POST /api/messages
export const createMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { type, text, lat, lng } = req.body;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    let fileUrl: string | undefined;
    let fileMimeType: string | undefined;

    if (req.file) {
      const mimeType = req.file.mimetype;
      const resourceType = getResourceType(mimeType);

      // Upload buffer to Cloudinary
      const uploadResult = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: resourceType,
              folder: "wandr",
              use_filename: false,
              unique_filename: true,
            },
            (error, result) => {
              if (error || !result)
                return reject(error || new Error("Upload failed"));
              resolve(result);
            },
          );
          uploadStream.end(req.file!.buffer);
        },
      );

      fileUrl = uploadResult.secure_url;
      fileMimeType = mimeType;
    }

    const message = await MessageModel.create({
      type: type as MessageType,
      text: text?.trim(),
      fileUrl,
      fileMimeType,
      lat: latNum,
      lng: lngNum,
      location: {
        type: "Point",
        coordinates: [lngNum, latNum],
      },
    });

    res.status(201).json({
      id: message._id,
      status: message.status,
      message: "Your message has been submitted and is pending review.",
    });
  } catch (error) {
    console.error("createMessage error:", error);
    res.status(500).json({ error: "Failed to submit message." });
  }
};

// GET /api/messages/pins
export const getPins = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pins = await MessageModel.find({ status: "approved" })
      .select("_id lat lng type")
      .lean();

    const formattedPins = pins.map((p) => ({
      id: p._id.toString(),
      lat: p.lat,
      lng: p.lng,
      type: p.type,
    }));

    res.json(formattedPins);
  } catch (error) {
    console.error("getPins error:", error);
    res.status(500).json({ error: "Failed to fetch pins." });
  }
};

// GET /api/messages/:id
export const getMessageById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const message = await MessageModel.findById(req.params.id).lean();

    if (!message) {
      res.status(404).json({ error: "Message not found." });
      return;
    }

    if (message.status !== "approved") {
      res.status(403).json({ error: "This message is not available." });
      return;
    }

    res.json({
      id: message._id.toString(),
      type: message.type,
      text: message.text,
      fileUrl: message.fileUrl,
      fileMimeType: message.fileMimeType,
      lat: message.lat,
      lng: message.lng,
      status: message.status,
      reportCount: message.reportCount,
      createdAt: message.createdAt,
    });
  } catch (error) {
    console.error("getMessageById error:", error);
    res.status(500).json({ error: "Failed to fetch message." });
  }
};

// POST /api/messages/:id/report
export const reportMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const message = await MessageModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { reportCount: 1 } },
      { new: true },
    );

    if (!message) {
      res.status(404).json({ error: "Message not found." });
      return;
    }

    // Auto-reject if reported too many times
    if (message.reportCount >= 10) {
      message.status = "rejected";
      await message.save();
    }

    res.json({ message: "Message reported successfully." });
  } catch (error) {
    console.error("reportMessage error:", error);
    res.status(500).json({ error: "Failed to report message." });
  }
};
