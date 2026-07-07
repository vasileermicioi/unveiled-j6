/**
 * Binary-search SSR hang: load entry points with increasing scope.
 * Run: bun apps/web/scripts/debug-ssr-load.ts [target]
 * Targets: honox | server | index
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2] ?? "server";

const targets: Record<string, string> = {
  honox: "honox/server",
  server: path.join(webRoot, "app/server.ts"),
  index: path.join(webRoot, "app/routes/index.tsx"),
};

const entry = targets[target];
if (!entry) {
  console.error(`Unknown target. Use one of: ${Object.keys(targets).join(", ")}`);
  process.exit(1);
}

function elapsed(start: number): string {
  return `${((performance.now() - start) / 1000).toFixed(2)}s`;
}

const vite = await createServer({
  configFile: path.join(webRoot, "vite.config.ts"),
  root: webRoot,
  logLevel: "info",
});

try {
  console.log(`ssrLoadModule(${target})...`);
  const t0 = performance.now();
  await Promise.race([
    vite.ssrLoadModule(entry),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout after 90s")), 90_000),
    ),
  ]);
  console.log(`  OK in ${elapsed(t0)}`);
} finally {
  await vite.close();
}
