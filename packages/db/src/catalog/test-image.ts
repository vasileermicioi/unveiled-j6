import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type PrebuiltImageVariantsInput,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "@unveiled/images";

/**
 * Load a committed six-variant JPEG pack for Bun tests/seed helpers.
 * Does not import `@unveiled/images/offline` or `/client` (Workers-safe type graph).
 */
export function createTestImagePrebuilt(): PrebuiltImageVariantsInput {
  const here = dirname(fileURLToPath(import.meta.url));
  const fixturesDir = join(here, "../../../images/test/fixtures/prebuilt-800x420");
  const variants = {} as Record<VariantFilename, Buffer>;

  for (const filename of VARIANT_FILENAMES) {
    variants[filename] = readFileSync(join(fixturesDir, filename));
  }

  return {
    imageId: crypto.randomUUID(),
    variants,
    claimedWidth: 800,
    claimedHeight: 420,
  };
}
