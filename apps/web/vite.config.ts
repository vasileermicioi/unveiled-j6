import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import build from "@hono/vite-build/cloudflare-workers";
import adapter from "@hono/vite-dev-server/node";
import tailwindcss from "@tailwindcss/vite";
import honox from "honox/vite";
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";

const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const requireFromImages = createRequire(path.join(repoRoot, "packages/images/src/index.ts"));
const sipMainPath = requireFromImages.resolve("@standardagents/sip");
const sipEmscriptenPath = path.join(path.dirname(sipMainPath), "sip.js");
const sipEmscriptenDevStub = path.join(repoRoot, "packages/images/src/sip-emscripten-dev-stub.ts");

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
      // Keep workspace image pipeline on Vite's transform path (sip WASM + TS entry).
      config.ssr.noExternal = ["@unveiled/images", "@standardagents/sip"];
      const existing = config.ssr.external;
      const external = new Set<string>(["react", "react-dom", "@heroui/react"]);
      if (Array.isArray(existing)) {
        for (const item of existing) {
          if (
            typeof item === "string" &&
            item !== "@unveiled/images" &&
            item !== "@standardagents/sip"
          ) {
            external.add(item);
          }
        }
      } else if (
        typeof existing === "string" &&
        existing !== "@unveiled/images" &&
        existing !== "@standardagents/sip"
      ) {
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

/**
 * Handle `.wasm` for both Vite serve and Workers build.
 *
 * Serve/SSR: stub the module so Vite does not hit its unsupported ESM-Wasm path.
 * Local `sip-ready` falls back to sip's Node/Bun loader (no emscripten alias).
 *
 * Workers build: keep imports as external sibling modules for Wrangler
 * CompiledWasm and copy the binary next to `dist/index.js`.
 */
function workersWasmAsModule(): Plugin {
  const wasmSources = new Map<string, Buffer>();
  let isWorkerSsrBuild = false;

  return {
    name: "unveiled-workers-wasm-as-module",
    enforce: "pre",
    config(_userConfig, { command, mode }) {
      isWorkerSsrBuild = command === "build" && mode !== "client";
    },
    async resolveId(source, importer) {
      const bare = source.split("?")[0] ?? source;
      if (!bare.endsWith(".wasm")) {
        return null;
      }

      let absolute: string;
      if (path.isAbsolute(bare)) {
        absolute = bare;
      } else if (bare.startsWith(".") || bare.startsWith("/")) {
        absolute = path.resolve(path.dirname(importer ?? process.cwd()), bare);
      } else {
        // Package specifier e.g. `@standardagents/sip/dist/sip.wasm`
        const resolved = await this.resolve(bare, importer, { skipSelf: true });
        if (!resolved?.id) {
          return null;
        }
        absolute = resolved.id.split("?")[0] ?? resolved.id;
      }

      const fileName = path.basename(absolute);

      if (!isWorkerSsrBuild) {
        // Avoid Vite's "ESM integration proposal for Wasm" error during `bun run dev`.
        return `\0unveiled-wasm-stub:${fileName}`;
      }

      if (!wasmSources.has(fileName)) {
        wasmSources.set(fileName, await fs.readFile(absolute));
      }

      return { id: `./${fileName}`, external: true };
    },
    load(id) {
      if (id.startsWith("\0unveiled-wasm-stub:")) {
        return "export default undefined;";
      }
      return null;
    },
    async writeBundle(options) {
      if (!isWorkerSsrBuild) {
        return;
      }
      const outDir =
        options.dir ?? (options.file ? path.dirname(options.file) : path.resolve("dist"));
      await fs.mkdir(outDir, { recursive: true });
      for (const [fileName, source] of wasmSources) {
        await fs.writeFile(path.join(outDir, fileName), source);
      }
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  // Workers SSR build gets the real Emscripten factory; serve/client get a stub so
  // Vite never needs to resolve sip's non-exported path (and wasm stays stubbed).
  const workerSsrBuild = command === "build" && mode !== "client";

  return {
    envDir: repoRoot,
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? mode),
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@unveiled/sip-emscripten": workerSsrBuild ? sipEmscriptenPath : sipEmscriptenDevStub,
      },
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
    },
    ssr: {
      external: ["react", "react-dom", "@heroui/react"],
      noExternal: ["@unveiled/images", "@standardagents/sip"],
    },
    server: {
      port: 3000,
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
      workersWasmAsModule(),
      tailwindcss(),
      honox({
        devServer: {
          adapter,
          ignoreWatching: devIgnoreWatching,
          loadModule: createCachedLoadModule(),
        },
        client: {
          input: ["/app/client.ts", "/app/styles/globals.css"],
          jsxImportSource: "react",
        },
      }),
      fixHonoxSsrExternals(),
      warmupSsrEntry(serverEntry),
      build({
        // Bundle @unveiled/images + sip into the Worker; wasm stays a sibling module.
        external: [],
      }),
    ],
  };
});
