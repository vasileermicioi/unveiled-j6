import { createDb, runDemoSeed } from "@unveiled/db";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run the demo seed.");
  process.exit(1);
}

const db = createDb(databaseUrl);
const result = await runDemoSeed(db);

if (result === "seeded") {
  console.log("Demo seed complete: created sample partners and events.");
} else {
  console.log("Demo seed skipped: partners or events already exist.");
}
