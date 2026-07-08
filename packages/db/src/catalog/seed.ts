import type { Db } from "../index";
import { countEvents, createEvent, deleteEvent, listEvents } from "./events";
import { countPartners, createPartner, deletePartner, listPartners } from "./partners";
import { DEMO_CATALOG } from "./seed-data";

export type DemoSeedResult = "seeded" | "skipped";

export async function shouldRunDemoSeed(db: Db): Promise<boolean> {
  const [partnerCount, eventCount] = await Promise.all([countPartners(db), countEvents(db)]);
  return partnerCount === 0 && eventCount === 0;
}

export async function resetCatalogData(
  db: Db,
  options: { skipBucket?: boolean } = {},
): Promise<{ partnersDeleted: number; eventsDeleted: number }> {
  const events = await listEvents(db, { limit: 10_000 });
  for (const event of events) {
    await deleteEvent(db, event.id, { skipBucket: options.skipBucket });
  }

  const partners = await listPartners(db, { limit: 10_000 });
  for (const partner of partners) {
    await deletePartner(db, partner.id, { skipBucket: options.skipBucket });
  }

  return { partnersDeleted: partners.length, eventsDeleted: events.length };
}

const SEED_IMAGE_PAUSE_MS = 750;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDemoSeed(
  db: Db,
  options: { force?: boolean; skipBucket?: boolean } = {},
): Promise<DemoSeedResult> {
  if (options.force) {
    await resetCatalogData(db, { skipBucket: options.skipBucket });
  } else if (!(await shouldRunDemoSeed(db))) {
    return "skipped";
  }

  const pauseMs = SEED_IMAGE_PAUSE_MS;

  for (const entry of DEMO_CATALOG) {
    const partner = await createPartner(db, entry.partner);
    await sleep(pauseMs);

    for (const eventInput of entry.events) {
      await createEvent(db, { ...eventInput, partnerId: partner.id });
      await sleep(pauseMs);
    }
  }

  return "seeded";
}
