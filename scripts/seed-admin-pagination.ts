import { createDb } from "@unveiled/db";
import {
  assertPaginationSeedImageEnv,
  parseSeedAdminPaginationArgs,
  printSeedAdminPaginationHelp,
  resetPaginationSeed,
  runSeedAdminPagination,
  type SeedAdminPaginationOptions,
} from "@unveiled/db/catalog/seed-pagination";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run the admin pagination seed.");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printSeedAdminPaginationHelp();
  process.exit(0);
}

let options: SeedAdminPaginationOptions;
try {
  options = parseSeedAdminPaginationArgs(args);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  printSeedAdminPaginationHelp();
  process.exit(1);
}

const db = createDb(databaseUrl);

if (options.reset && options.partnerCount === 0 && options.eventCount === 0) {
  try {
    assertPaginationSeedImageEnv(options.skipUpload ?? false);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const removed = await resetPaginationSeed(db, { skipBucket: options.skipUpload });
  console.log(
    `Removed ${removed.partners} pagination partners and ${removed.events} pagination events.`,
  );
  process.exit(0);
}

try {
  assertPaginationSeedImageEnv(options.skipUpload ?? false);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error(
    "Set R2 env vars in .env or pass --skip-upload for DB-only rows without thumbnails.",
  );
  process.exit(1);
}

const result = await runSeedAdminPagination(db, options);

console.log(
  `Seeded ${result.partnersCreated} partners and ${result.eventsCreated} events for admin pagination testing.`,
);
console.log(
  `Images: ${result.imagesUploaded ? "uploaded to R2 (thumbnails should load)" : "skipped — thumbnails will not load"}.`,
);
console.log(
  `Admin list page size: ${result.pageSize} → ${result.partnerPages} partner page(s), ${result.eventPages} event page(s).`,
);
console.log("Try:");
console.log(`  /de/admin/partners?page=2`);
console.log(`  /de/admin/events?q=${encodeURIComponent(result.searchTerm)}&page=2`);
console.log(`  /de/admin/partners?page=99  (should redirect to last valid page)`);
