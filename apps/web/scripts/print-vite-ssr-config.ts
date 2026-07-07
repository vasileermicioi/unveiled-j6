import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveConfig } from "vite";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = await resolveConfig(
  { configFile: path.join(webRoot, "vite.config.ts"), command: "serve", mode: "development" },
  "serve",
);
console.log("ssr.noExternal:", config.ssr.noExternal);
console.log("ssr.external:", config.ssr.external);
