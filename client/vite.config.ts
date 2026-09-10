import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/trpc": "http://localhost:3333",
      "/uploads": "http://localhost:3333",
      "/files": "http://localhost:3333",
    },
  },
});
