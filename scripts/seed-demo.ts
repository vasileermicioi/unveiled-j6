import { createDb } from "@unveiled/db";
import { resetCatalogData, runDemoSeed } from "@unveiled/db/seed";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run the demo seed.");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--reset") || args.includes("--force");
const skipUpload = args.includes("--skip-upload");

const db = createDb(databaseUrl);

if (force) {
  const cleared = await resetCatalogData(db, { skipBucket: skipUpload });
  console.log(
    `Catalog reset: removed ${cleared.eventsDeleted} events and ${cleared.partnersDeleted} partners.`,
  );
}

const result = await runDemoSeed(db, { force, skipBucket: skipUpload });

if (result === "seeded") {
  console.log(
    "Demo seed complete: created Berlin partners/events from Abundo fixture (local images in public/images/seed).",
  );
  if (skipUpload) {
    console.log("Note: --skip-upload was set; image rows exist but R2 objects were not written.");
  }
} else {
  console.log(
    "Demo seed skipped: partners or events already exist. Pass --reset to replace catalog data.",
  );
}
