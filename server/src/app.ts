import express from "express";
import cors from "cors";
import "dotenv/config";
import { globalLimiter } from "./middleware/rateLimit";
import messageRoutes from "./routes/message.routes";
import adminRoutes from "./routes/admin.routes";
import geoRoutes from "./routes/geo.routes";

const app = express();

// CORS
app.use(
  cors({
    // origin: process.env.CLIENT_URL || "http://localhost:5173",
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "x-admin-secret"],
  }),
);

// Global rate limiter
app.use(globalLimiter);

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/geo", geoRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "speak-api" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

export default app;
