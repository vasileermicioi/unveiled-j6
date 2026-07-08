import path from "node:path";
import { fileURLToPath } from "node:url";

import build from "@hono/vite-build/cloudflare-workers";
import adapter from "@hono/vite-dev-server/node";
import tailwindcss from "@tailwindcss/vite";
import honox from "honox/vite";
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";

const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

const serverEntry = path.join(path.dirname(fileURLToPath(import.meta.url)), "app/server.ts");

/** Paths outside the web app that should not trigger dev-server reloads. */
const devIgnoreWatching = [
  /\/\.git\//,
  /\/dist\//,
  /\/\.dev-plan\//,
  /\/docs\//,
  /\/openspec\//,
  /\/scripts\//,
  /\/\.cursor\//,
];

type SsrApp = { fetch: (request: Request, ...args: unknown[]) => Promise<Response> };

/**
 * HonoX's dev middleware calls ssrLoadModule on every request by default.
 * Cache the app instance and invalidate on file changes so the first compile
 * is expensive but subsequent requests stay fast.
 */
function createCachedLoadModule() {
  let cached: SsrApp | undefined;
  let watcherBound = false;

  return async (server: ViteDevServer, entry: string): Promise<SsrApp> => {
    if (!watcherBound) {
      const invalidate = () => {
        cached = undefined;
      };
      server.watcher.on("change", invalidate);
      server.watcher.on("unlink", invalidate);
      watcherBound = true;
    }

    if (cached) {
      return cached;
    }

    const appModule = await server.ssrLoadModule(entry);
    const app = appModule.default as SsrApp | undefined;
    if (!app?.fetch) {
      throw new Error(`Failed to find default export with fetch from ${entry}`);
    }

    cached = app;
    return app;
  };
}

/** Honox sets `ssr.noExternal: true`, rebundling all of node_modules on every SSR load. Override after config merge. */
function fixHonoxSsrExternals(): Plugin {
  return {
    name: "unveiled-fix-honox-ssr-externals",
    enforce: "post",
    configResolved(config) {
      config.ssr.noExternal = [];
      const existing = config.ssr.external;
      const external = new Set<string>([
        "react",
        "react-dom",
        "@heroui/react",
        "sharp",
        "@unveiled/images",
      ]);
      if (Array.isArray(existing)) {
        for (const item of existing) {
          if (typeof item === "string") {
            external.add(item);
          }
        }
      } else if (typeof existing === "string") {
        external.add(existing);
      }
      config.ssr.external = [...external];
    },
  };
}

/** Preload the SSR entry once Vite is listening so the first browser request is not blocked. */
function warmupSsrEntry(entry: string): Plugin {
  return {
    name: "unveiled-warmup-ssr",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        void server
          .ssrLoadModule(entry)
          .then(() => server.config.logger.info("SSR entry preloaded"))
          .catch((error) => {
            server.config.logger.error(`SSR warmup failed: ${error}`);
          });
      });
    },
  };
}

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
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@heroui/react",
        "@better-auth-ui/react",
        "@better-auth-ui/heroui",
        "@better-auth-ui/core",
        "@tanstack/react-query",
      ],
      exclude: ["sharp"],
    },
    ssr: {
      external: ["react", "react-dom", "@heroui/react", "sharp", "@unveiled/images"],
    },
    server: {
      warmup: {
        clientFiles: [
          "./app/client.ts",
          "./app/styles/globals.css",
          "./app/routes/index.tsx",
          "./app/routes/[locale]/index.tsx",
        ],
      },
    },
    plugins: [
      tailwindcss(),
      honox({
        devServer: {
          adapter,
          ignoreWatching: devIgnoreWatching,
          loadModule: createCachedLoadModule(),
        },
        client: {
          input: ["/app/client.ts", "/app/styles/globals.css"],
        },
      }),
      fixHonoxSsrExternals(),
      warmupSsrEntry(serverEntry),
      build({
        external: ["sharp", "@unveiled/images"],
      }),
    ],
  };
});
