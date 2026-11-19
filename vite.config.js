import { defineConfig } from "vite";

// Apex custom domain (scottgamble.co.uk) serves from site root.
export default defineConfig({
  base: "/",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
