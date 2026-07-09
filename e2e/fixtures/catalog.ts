import { createDb, listEvents, listPartners } from "@unveiled/db";

/**
 * Resolve a demo partner id for GET `partnerId=` filters.
 * Prefer this over HeroUI Select popover scraping (portal/listbox is flaky in headless).
 */
export async function getPartnerIdByName(name: string): Promise<string> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to resolve partner ids for discovery E2E");
  }

  const db = createDb(url);
  const rows = await listPartners(db, { q: name, limit: 25 });
  const hit = rows.find((partner) => partner.name === name);
  if (!hit) {
    throw new Error(`Partner not found in catalog: ${name}`);
  }
  return hit.id;
}

/** Resolve a seeded event id by exact title (for public detail / map consent E2E). */
export async function getEventIdByTitle(title: string): Promise<string> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to resolve event ids for E2E");
  }

  const db = createDb(url);
  const rows = await listEvents(db, { q: title, limit: 25 });
  const hit = rows.find((event) => event.title === title);
  if (!hit) {
    throw new Error(`Event not found in catalog: ${title}`);
  }
  return hit.id;
}
