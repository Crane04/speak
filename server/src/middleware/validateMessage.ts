import { Request, Response, NextFunction } from "express";

export const validateMessage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { type, text, lat, lng } = req.body;

  const validTypes = ["text", "image", "audio", "document", "video"];
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
  }

  next();
};
