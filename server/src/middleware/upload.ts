import multer from "multer";
import { Request } from "express";

const ALLOWED_MIME_TYPES = [
  // images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  // video
  "video/mp4",
  "video/webm",
  "video/ogg",
  // documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
