import build from "@hono/vite-build/node";
import adapter from "@hono/vite-dev-server/node";
import tailwindcss from "@tailwindcss/vite";
import honox from "honox/vite";
import { defineConfig } from "vite";

export default defineConfig({
  define: {
    "process.env": "process.env",
  },
  ssr: {
    external: ["react", "react-dom", "@heroui/react"],
  },
  plugins: [
    tailwindcss(),
    honox({
      devServer: { adapter },
      client: {
        input: ["/app/client.ts", "/app/styles/globals.css"],
      },
    }),
    build({
      entryContentAfterHooks: [
        async (appName) =>
          `import { serve } from '@hono/node-server'\nserve({ fetch: ${appName}.fetch, port: Number(process.env.PORT) || 3000 })`,
      ],
    }),
  ],
});
