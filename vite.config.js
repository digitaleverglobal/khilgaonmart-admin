import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/v1": {
        target: "https://api.khilgaonmart.com",
        changeOrigin: true,
      },
      "/images": {
        target: "https://api.khilgaonmart.com",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "https://api.khilgaonmart.com",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ["react-is"],
  },
});
