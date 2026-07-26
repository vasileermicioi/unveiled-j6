import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type PrebuiltImageVariantsInput,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "@unveiled/images";

/**
 * Load a committed five-variant WebP pack for Bun tests/seed helpers.
 * Does not import `@unveiled/images/offline` or `/client` (Workers-safe type graph).
 */
export function createTestImagePrebuilt(): PrebuiltImageVariantsInput {
  const here = dirname(fileURLToPath(import.meta.url));
  const fixturesDir = join(here, "../../../images/test/fixtures/prebuilt-800x420");
  const variants = {} as Record<VariantFilename, Buffer>;

  for (const filename of VARIANT_FILENAMES) {
    variants[filename] = readFileSync(join(fixturesDir, filename));
  }

  let claimedWidth = 800;
  let claimedHeight = 420;
  try {
    const meta = JSON.parse(readFileSync(join(fixturesDir, "meta.json"), "utf8")) as {
      width?: number;
      height?: number;
    };
    if (typeof meta.width === "number" && meta.width >= 1) {
      claimedWidth = meta.width;
    }
    if (typeof meta.height === "number" && meta.height >= 1) {
      claimedHeight = meta.height;
    }
  } catch {
    // Keep defaults.
  }

  return {
    imageId: crypto.randomUUID(),
    variants,
    claimedWidth,
    claimedHeight,
  };
}
