import { Request, Response, NextFunction } from "express";

const VOICE_NOTE_MAX_DURATION_SECONDS = 30;
const ALLOWED_VOICE_NOTE_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
]);

const importMusicMetadata = () =>
  new Function("specifier", "return import(specifier)")("music-metadata") as Promise<
    typeof import("music-metadata")
  >;

export const validateMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { type, text, lat, lng } = req.body;

  const validTypes = ["text", "image", "audio"];
  if (!type || !validTypes.includes(type)) {
    res.status(400).json({ error: "Invalid message type." });
    return;
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    res.status(400).json({ error: "Invalid latitude. Must be between -90 and 90." });
    return;
  }

  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    res.status(400).json({ error: "Invalid longitude. Must be between -180 and 180." });
    return;
  }

  if (type === "text") {
    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: "Text message cannot be empty." });
      return;
    }
    if (text.trim().length > 2000) {
      res.status(400).json({ error: "Text message cannot exceed 2000 characters." });
      return;
    }
  } else {
    if (!req.file) {
      res.status(400).json({ error: `File is required for message type: ${type}` });
      return;
    }

    if (type === "image" && !req.file.mimetype.startsWith("image/")) {
      res.status(400).json({ error: "Please upload an image file." });
      return;
    }

    if (type === "audio") {
      if (!ALLOWED_VOICE_NOTE_MIME_TYPES.has(req.file.mimetype)) {
        res.status(400).json({ error: "Please upload a voice note. MP3 files are not supported." });
        return;
      }

      try {
        const { parseBuffer } = await importMusicMetadata();
        const metadata = await parseBuffer(req.file.buffer, req.file.mimetype);
        const duration = metadata.format.duration;

        if (!duration) {
          res.status(400).json({ error: "Could not read voice note duration." });
          return;
        }

        if (duration > VOICE_NOTE_MAX_DURATION_SECONDS) {
          res.status(400).json({ error: "Voice notes cannot be longer than 30 seconds." });
          return;
        }
      } catch {
        res.status(400).json({ error: "Could not read voice note duration." });
        return;
      }
    }
  }

  next();
};
