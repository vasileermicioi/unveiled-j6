import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, "../../..");
const webRoot = path.join(repoRoot, "apps/web");

const storyImageBaseUrl =
  process.env.IMAGE_PUBLIC_BASE_URL ?? "https://pub-8c02bc7bbd724290a0d1d3346c0d7ccd.r2.dev";

export default defineConfig({
  plugins: [tailwindcss()],
  define: {
    "process.env.IMAGE_PUBLIC_BASE_URL": JSON.stringify(storyImageBaseUrl),
  },
  resolve: {
    alias: {
      // Production theme CSS lives in apps/web and imports packages only installed there.
      "@better-auth-ui/heroui": path.join(webRoot, "node_modules/@better-auth-ui/heroui"),
      "maplibre-gl": path.join(webRoot, "node_modules/maplibre-gl"),
    },
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
    hmr: {
      clientPort: 61000,
    },
  },
});
