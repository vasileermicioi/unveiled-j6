/** Load one route by path relative to apps/web. Run: bunx vite-node scripts/debug-ssr-one.ts app/routes/index.tsx */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
if (!target) {
  console.error("Usage: debug-ssr-one.ts <path-relative-to-apps/web>");
  process.exit(1);
}

const abs = path.resolve(webRoot, target);
const vite = await createServer({
  configFile: path.join(webRoot, "vite.config.ts"),
  root: webRoot,
  logLevel: "warn",
});

const t0 = performance.now();
await vite.ssrLoadModule(abs);
console.log(`OK in ${((performance.now() - t0) / 1000).toFixed(2)}s: ${target}`);
await vite.close();
