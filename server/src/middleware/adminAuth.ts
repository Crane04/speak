import { Request, Response, NextFunction } from "express";

export const adminAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const secret = req.headers["x-admin-secret"];

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized. Invalid admin secret." });
    return;
  }

  next();
};
