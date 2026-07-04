import build from "@hono/vite-build/node";
import adapter from "@hono/vite-dev-server/node";
import honox from "honox/vite";
import { defineConfig } from "vite";

export default defineConfig({
  define: {
    "process.env": "process.env",
  },
  ssr: {
    external: ["react", "react-dom"],
  },
  plugins: [honox({ devServer: { adapter } }), build()],
});
