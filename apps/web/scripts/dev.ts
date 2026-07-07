import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command: string, args: string[]): ReturnType<typeof spawn> {
  return spawn(command, args, {
    cwd: webRoot,
    stdio: "inherit",
  });
}

function waitForExit(child: ReturnType<typeof spawn>, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} exited with code ${code ?? "unknown"}`));
    });
  });
}

const cssBuild = run("bun", ["run", "css:build"]);
await waitForExit(cssBuild, "css:build");

const cssWatch = run("bun", ["run", "css:watch"]);
const vite = run("bun", ["run", "dev:vite"]);

function shutdown(signal: NodeJS.Signals) {
  cssWatch.kill(signal);
  vite.kill(signal);
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown("SIGTERM");
  process.exit(0);
});

await Promise.race([waitForExit(cssWatch, "css:watch"), waitForExit(vite, "vite")]);
