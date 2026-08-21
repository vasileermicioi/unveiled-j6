/**
 * Stable demo seed titles for E2E / docs — JSON fixture only (no node:fs).
 * Safe to import from Workers SSR and Playwright via `@unveiled/db/seed-titles`.
 */

import fixture from "./fixtures/abundo-berlin-demo.json";

type FixturePartner = { key: string; name: string };
type FixtureEvent = { title: string; partnerKey: string; seedRole?: string };

type AbundoFixture = {
  partners: FixturePartner[];
  events: FixtureEvent[];
};

const FIXTURE = fixture as AbundoFixture;

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
  /** Additive SECRET_CODE titles with distinct DE vs EN copy for locale e2e. */
  localeCopyDe: "Konzertabend: Unveiled-DE-Copy",
  localeCopyEn: "Concert Night: Unveiled-EN-Copy",
  /** Additive seed titles for ticket-redemption demos (not in Abundo fixture roles). */
  voucherPromo: "Demo: Promo Code Inventory Night",
  voucherPdf: "Demo: PDF Voucher Inventory Night",
} as const;

/** Stable promo codes stocked on the demo VOUCHER_PROMO event (≥4 for multi-ticket books). */
export const DEMO_PROMO_CODES = [
  "DEMO-PROMO-01",
  "DEMO-PROMO-02",
  "DEMO-PROMO-03",
  "DEMO-PROMO-04",
  "DEMO-PROMO-05",
  "DEMO-PROMO-06",
] as const;

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
