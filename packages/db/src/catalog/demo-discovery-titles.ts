import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Stable demo seed titles for E2E / docs — JSON roles only (no image buffers).
 * Server/script import via `@unveiled/db/seed` — never from client islands.
 */

type FixturePartner = { key: string; name: string };
type FixtureEvent = { title: string; partnerKey: string; seedRole?: string };

type AbundoFixture = {
  partners: FixturePartner[];
  events: FixtureEvent[];
};

function loadFixture(): AbundoFixture {
  const path = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "abundo-berlin-demo.json");
  return JSON.parse(readFileSync(path, "utf8")) as AbundoFixture;
}

const FIXTURE = loadFixture();

function titleForRole(role: string, fallback: string): string {
  return FIXTURE.events.find((e) => e.seedRole === role)?.title ?? fallback;
}

export const DEMO_DISCOVERY_TITLES = {
  tonight: titleForRole("tonight", "Tonight: Abundo Demo"),
  pastHidden: titleForRole("pastHidden", "Past Premiere: Abundo Demo"),
  theaterFuture: titleForRole("theaterFuture", "Abundo Theater Demo"),
  ausstellung: titleForRole("ausstellung", "Abundo Ausstellung Demo"),
  konzert: titleForRole("konzert", "Abundo Konzert Demo"),
  soldOutWaitlist: titleForRole("soldOutWaitlist", "Sold Out: Waitlist Demo Night"),
} as const;

/** Partner display name for a seeded event title (JSON only — no image buffers). */
export function partnerNameForSeedTitle(title: string): string {
  const event = FIXTURE.events.find((e) => e.title === title);
  if (!event) {
    throw new Error(`No demo partner for seed title: ${title}`);
  }
  const partner = FIXTURE.partners.find((p) => p.key === event.partnerKey);
  if (!partner) {
    throw new Error(`No demo partner row for key: ${event.partnerKey}`);
  }
  return partner.name;
}
