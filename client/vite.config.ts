import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["three"],
  },
  server: {
    port: 5173,
    host: "0.0.0.0", // Listen on all network interfaces
    allowedHosts: true,
  },
  build: { target: "esnext" },
  optimizeDeps: { esbuildOptions: { target: "esnext" } },
});
