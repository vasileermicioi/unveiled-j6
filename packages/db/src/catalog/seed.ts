import type { Db } from "../index";
import { countEvents, createEvent } from "./events";
import { countPartners, createPartner } from "./partners";
import { buildDemoEvents, DEMO_PARTNERS } from "./seed-data";

export type DemoSeedResult = "seeded" | "skipped";

export async function shouldRunDemoSeed(db: Db): Promise<boolean> {
  const [partnerCount, eventCount] = await Promise.all([countPartners(db), countEvents(db)]);
  return partnerCount === 0 && eventCount === 0;
}

export async function runDemoSeed(db: Db): Promise<DemoSeedResult> {
  if (!(await shouldRunDemoSeed(db))) {
    return "skipped";
  }

  const createdPartners = [];
  for (const partnerInput of DEMO_PARTNERS) {
    const partner = await createPartner(db, partnerInput);
    createdPartners.push(partner);
  }

  for (const partner of createdPartners) {
    const demoEvents = buildDemoEvents(partner.id);
    for (const eventInput of demoEvents) {
      await createEvent(db, eventInput);
    }
  }

  return "seeded";
}
