/**
 * Bake six JPEG variants next to each seed source JPEG for Workers-safe demo seed.
 *
 * Usage: bun scripts/bake-seed-image-variants.ts
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { VARIANT_FILENAMES } from "../packages/images/src/constants.ts";
import { bufferToPrebuiltVariants } from "../packages/images/src/offline/index.ts";

const ROOT = join(import.meta.dir, "..");
const SEED_ROOT = join(ROOT, "public/images/seed");

function listJpegFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (entry.endsWith(".variants")) {
        continue;
      }
      out.push(...listJpegFiles(abs));
      continue;
    }
    if (entry.toLowerCase().endsWith(".jpg") || entry.toLowerCase().endsWith(".jpeg")) {
      out.push(abs);
    }
  }
  return out;
}

async function bakeOne(sourcePath: string): Promise<void> {
  const variantsDir = `${sourcePath}.variants`;
  mkdirSync(variantsDir, { recursive: true });
  const buffer = readFileSync(sourcePath);
  const prebuilt = await bufferToPrebuiltVariants(buffer, { source: "UPLOAD" });
  for (const filename of VARIANT_FILENAMES) {
    writeFileSync(join(variantsDir, filename), prebuilt.variants[filename]);
  }
  console.log(`baked ${relative(ROOT, variantsDir)}`);
}

async function main() {
  if (!existsSync(SEED_ROOT)) {
    throw new Error(`Missing seed images dir: ${SEED_ROOT}`);
  }
  const files = listJpegFiles(SEED_ROOT);
  console.log(`Baking variants for ${files.length} seed JPEGs…`);
  for (const file of files) {
    await bakeOne(file);
  }
  console.log("Done.");
}

await main();
