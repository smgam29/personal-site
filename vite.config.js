import { defineConfig } from "vite";

// GitHub Actions sets CI=true → project Pages URL path.
// Local preview keeps serving from /
const base = process.env.CI ? "/personal-site/" : "/";

export default defineConfig({
  base,
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
