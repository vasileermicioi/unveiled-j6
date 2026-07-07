/**
 * Find route modules that hang or fail SSR load.
 * Run: bunx vite-node apps/web/scripts/debug-ssr-routes.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routesRoot = path.join(webRoot, "app/routes");

function listRouteFiles(dir: string, base = routesRoot): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listRouteFiles(full, base));
      continue;
    }
    if (!/\.(tsx?|mdx?)$/.test(entry.name)) {
      continue;
    }
    const rel = path.relative(base, full).replace(/\\/g, "/");
    if (rel.startsWith("_") || rel.includes("/_") || rel.includes("/-")) {
      continue;
    }
    files.push(full);
  }
  return files.sort();
}

const vite = await createServer({
  configFile: path.join(webRoot, "vite.config.ts"),
  root: webRoot,
  logLevel: "error",
});

const files = listRouteFiles(routesRoot);
console.log(`Testing ${files.length} route modules...\n`);

const slow: Array<{ file: string; ms: number }> = [];
const failed: Array<{ file: string; error: string }> = [];

for (const file of files) {
  const rel = path.relative(webRoot, file);
  const t0 = performance.now();
  try {
    await Promise.race([
      vite.ssrLoadModule(file),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout 30s")), 30_000)),
    ]);
    const ms = performance.now() - t0;
    const label = `${(ms / 1000).toFixed(2)}s`;
    if (ms > 3000) {
      slow.push({ file: rel, ms });
      console.log(`SLOW  ${label.padStart(7)}  ${rel}`);
    } else {
      console.log(`  ok  ${label.padStart(7)}  ${rel}`);
    }
  } catch (error) {
    failed.push({ file: rel, error: error instanceof Error ? error.message : String(error) });
    console.log(` FAIL           ${rel} — ${failed.at(-1)?.error}`);
  }
}

await vite.close();

console.log(`\nDone. slow=${slow.length} failed=${failed.length}`);
if (slow.length > 0) {
  console.log("\nSlowest:");
  for (const entry of slow.sort((a, b) => b.ms - a.ms).slice(0, 10)) {
    console.log(`  ${(entry.ms / 1000).toFixed(2)}s  ${entry.file}`);
  }
}
