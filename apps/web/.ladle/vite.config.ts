import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const storyImageBaseUrl =
  process.env.IMAGE_PUBLIC_BASE_URL ?? "https://pub-8c02bc7bbd724290a0d1d3346c0d7ccd.r2.dev";

export default defineConfig({
  plugins: [tailwindcss()],
  define: {
    "process.env.IMAGE_PUBLIC_BASE_URL": JSON.stringify(storyImageBaseUrl),
  },
});
