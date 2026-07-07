import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const t0 = performance.now();

const vite = await createServer({
  root: webRoot,
  logLevel: "warn",
  appType: "custom",
});

console.log(`createServer: ${((performance.now() - t0) / 1000).toFixed(2)}s`);

const t1 = performance.now();
await Promise.race([
  vite.ssrLoadModule("react"),
  new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 15_000)),
]);
console.log(`ssrLoadModule(react): ${((performance.now() - t1) / 1000).toFixed(2)}s`);

await vite.close();
