import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, "../../..");

const storyImageBaseUrl =
  process.env.IMAGE_PUBLIC_BASE_URL ?? "https://pub-8c02bc7bbd724290a0d1d3346c0d7ccd.r2.dev";

export default defineConfig({
  plugins: [tailwindcss()],
  // Serve web public assets (logos) so Logo stories resolve `/logos/*` paths.
  publicDir: path.resolve(repoRoot, "apps/web/public"),
  define: {
    "process.env.IMAGE_PUBLIC_BASE_URL": JSON.stringify(storyImageBaseUrl),
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
    // Do not hardcode HMR clientPort — Ladle may bind 61000+N when the
    // preferred port is taken; a fixed port leaves the canvas blank.
  },
});
