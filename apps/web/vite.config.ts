import path from "node:path";
import { fileURLToPath } from "node:url";

import build from "@hono/vite-build/node";
import adapter from "@hono/vite-dev-server/node";
import tailwindcss from "@tailwindcss/vite";
import honox from "honox/vite";
import { defineConfig, loadEnv } from "vite";

const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    envDir: repoRoot,
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? mode),
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
  };
});
