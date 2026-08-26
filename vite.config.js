import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api/* is proxied to the Express server, so the browser sees one origin
// and the backend needs zero CORS configuration.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
      "/health": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
