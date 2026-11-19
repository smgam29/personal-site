import { defineConfig } from "vite";

export default defineConfig({
  // Project Pages: https://smgam29.github.io/personal-site/
  base: "/personal-site/",
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
