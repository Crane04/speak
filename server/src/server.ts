import "dotenv/config";
import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Speak API running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
