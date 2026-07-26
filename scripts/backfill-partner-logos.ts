/**
 * Backfill NULL `partners.logo_image_id` with a solid five-variant WebP set
 * via `@unveiled/images/offline`, then leave the column ready for NOT NULL.
 *
 * Usage:
 *   bun scripts/backfill-partner-logos.ts
 *   bun scripts/backfill-partner-logos.ts --dry-run
 *   bun scripts/backfill-partner-logos.ts --skip-upload
 *
 * Invoked automatically before `drizzle-kit migrate` via root `db:migrate`.
 * Never import this from Workers routes.
 */
import { createDb } from "@unveiled/db";

import { backfillNullPartnerLogos } from "../packages/db/src/catalog/backfill-partner-logos.ts";

const dryRun = process.argv.includes("--dry-run");

function hasS3Config(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_REGION &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  );
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const skipUpload = process.argv.includes("--skip-upload") || !hasS3Config();
if (skipUpload && !process.argv.includes("--skip-upload") && !hasS3Config()) {
  console.warn("S3 env incomplete — backfilling image rows with skipUpload (no R2 objects).");
}

const db = createDb(databaseUrl);
const result = await backfillNullPartnerLogos(db, { skipUpload, dryRun });

if (result.found === 0) {
  console.log("No partners with NULL logo_image_id — nothing to backfill.");
} else if (result.dryRun) {
  console.log(`Found ${result.found} partner(s) with NULL logo_image_id (dry-run; no writes).`);
} else {
  console.log(`Backfilled ${result.updated} partner logo(s).`);
}
