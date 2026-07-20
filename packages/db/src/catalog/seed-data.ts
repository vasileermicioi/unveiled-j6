import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { berlinInclusiveDateRange, getBerlinCalendarDate } from "./datetime";
import type { CreateEventInput } from "./events";
import type { CreatePartnerInput } from "./partners";

/**
 * Demo catalog seed — Berlin events from Abundo + local images.
 *
 * Fixture: `fixtures/abundo-berlin-demo.json`
 * Images:  `public/images/seed/{partners,events}/*.jpg`
 * Refresh: `bun scripts/fetch-abundo-seed.ts`
 *
 * Absolute dates are not stored; `daysFromToday` / hour / minute resolve at seed time.
 */

export type DemoCatalogEntry = {
  partner: CreatePartnerInput;
  events: Omit<CreateEventInput, "partnerId">[];
};

type FixturePartner = {
  key: string;
  name: string;
  address: string;
  contactEmail: string;
  /** Relative to `public/images/seed/` */
  logoPath: string;
  logoSourceUrl?: string;
  /** @deprecated Prefer logoPath — kept for older fixtures */
  logoUrl?: string;
  lat: string;
  lng: string;
};

type FixtureEvent = {
  slug: string;
  partnerKey: string;
  title: string;
  description: string;
  address: string;
  neighborhood: string;
  category: string;
  eventType: string;
  tags: string[];
  /** Relative to `public/images/seed/` */
  imagePath: string;
  imageSourceUrl?: string;
  /** @deprecated Prefer imagePath — kept for older fixtures */
  imageUrl?: string;
  creditPrice: number;
  secretCode: string;
  languages: string[];
  barrierFree: boolean;
  lat: string;
  lng: string;
  daysFromToday: number;
  hour: number;
  minute: number;
  seedRole?: string;
  totalCapacity?: number;
  soldOut?: boolean;
  sourceUrl?: string;
};

type AbundoFixture = {
  source: string;
  city: string;
  imagesRoot?: string;
  partners: FixturePartner[];
  events: FixtureEvent[];
};

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function addCalendarDays(ymd: string, days: number): string {
  const match = YMD_RE.exec(ymd);
  if (!match) {
    throw new Error(`Invalid calendar date: ${ymd}`);
  }
  const year = Number.parseInt(match[1] ?? "0", 10);
  const month = Number.parseInt(match[2] ?? "0", 10);
  const day = Number.parseInt(match[3] ?? "0", 10);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

/** Instant at `hour`:`minute` on the Europe/Berlin calendar day `ymd`. */
function berlinAt(ymd: string, hour: number, minute = 0): Date {
  const { start } = berlinInclusiveDateRange(ymd, ymd);
  return new Date(start.getTime() + hour * 3_600_000 + minute * 60_000);
}

function berlinDaysFromToday(days: number, hour = 19, minute = 30): Date {
  const today = getBerlinCalendarDate(new Date());
  return berlinAt(addCalendarDays(today, days), hour, minute);
}

/**
 * Abundo sometimes ships `0,0` (Null Island) when a venue has no geocode.
 * Treat that as missing so demos never pin Berlin addresses in Africa.
 */
function normalizeSeedCoords(
  lat: string | null | undefined,
  lng: string | null | undefined,
): { lat: string | null; lng: string | null } {
  const latN = Number.parseFloat(String(lat ?? ""));
  const lngN = Number.parseFloat(String(lng ?? ""));
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
    return { lat: null, lng: null };
  }
  if (Math.abs(latN) < 0.01 && Math.abs(lngN) < 0.01) {
    return { lat: null, lng: null };
  }
  return { lat: String(latN), lng: String(lngN) };
}

function catalogDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/** Repo root: packages/db/src/catalog → ../../../../.. */
function repoRoot(): string {
  return join(catalogDir(), "../../../..");
}

function seedImagesRoot(fixture: AbundoFixture): string {
  const relative = fixture.imagesRoot ?? "public/images/seed";
  return join(repoRoot(), relative);
}

function loadFixture(): AbundoFixture {
  const path = join(catalogDir(), "fixtures", "abundo-berlin-demo.json");
  return JSON.parse(readFileSync(path, "utf8")) as AbundoFixture;
}

function readSeedImage(imagesRoot: string, relativePath: string, label: string): Buffer {
  const abs = join(imagesRoot, relativePath);
  if (!existsSync(abs)) {
    throw new Error(
      `Missing seed image for ${label}: ${abs}\nRun: bun scripts/fetch-abundo-seed.ts`,
    );
  }
  return readFileSync(abs);
}

const FIXTURE = loadFixture();

function buildDemoCatalog(fixture: AbundoFixture): DemoCatalogEntry[] {
  const imagesRoot = seedImagesRoot(fixture);
  const eventsByPartner = new Map<string, FixtureEvent[]>();

  for (const event of fixture.events) {
    const list = eventsByPartner.get(event.partnerKey) ?? [];
    list.push(event);
    eventsByPartner.set(event.partnerKey, list);
  }

  const catalog: DemoCatalogEntry[] = [];

  for (const partner of fixture.partners) {
    const partnerEvents = eventsByPartner.get(partner.key) ?? [];
    if (partnerEvents.length === 0) continue;

    const logoPath = partner.logoPath;
    const partnerInput: CreatePartnerInput = {
      name: partner.name,
      address: partner.address,
      contactEmail: partner.contactEmail,
    };

    if (logoPath) {
      partnerInput.logoUpload = readSeedImage(imagesRoot, logoPath, `partner ${partner.key}`);
    } else if (partner.logoUrl) {
      partnerInput.logoUrl = partner.logoUrl;
    }

    catalog.push({
      partner: partnerInput,
      events: partnerEvents.map((event) => {
        const base: Omit<CreateEventInput, "partnerId"> = {
          title: event.title,
          description: event.description,
          address: event.address,
          neighborhood: event.neighborhood,
          category: event.category,
          eventType: event.eventType,
          tags: event.tags,
          dateTime: berlinDaysFromToday(event.daysFromToday, event.hour, event.minute),
          creditPrice: event.creditPrice,
          ...(event.totalCapacity != null ? { totalCapacity: event.totalCapacity } : {}),
          secretCode: event.secretCode,
          languages: event.languages,
          barrierFree: event.barrierFree,
          ...normalizeSeedCoords(event.lat, event.lng),
        };

        if (event.imagePath) {
          base.imageUpload = readSeedImage(imagesRoot, event.imagePath, `event ${event.slug}`);
        } else if (event.imageUrl) {
          base.imageUrl = event.imageUrl;
        }

        return base;
      }),
    });
  }

  return catalog;
}

export const DEMO_CATALOG: DemoCatalogEntry[] = buildDemoCatalog(FIXTURE);

/** Re-export for callers that already import catalog titles alongside DEMO_CATALOG. */
export { DEMO_DISCOVERY_TITLES } from "./demo-discovery-titles";

/** @deprecated Use DEMO_CATALOG — kept for tests referencing partner list length. */
export const DEMO_PARTNERS: Omit<CreatePartnerInput, "logoUpload">[] = DEMO_CATALOG.map(
  ({ partner }) => {
    const { logoUpload: _logoUpload, ...rest } = partner;
    return rest;
  },
);

/** @deprecated Use DEMO_CATALOG — builds one event for backward-compatible tests. */
export function buildDemoEvents(partnerId: string): CreateEventInput[] {
  const template = DEMO_CATALOG[0]?.events[0];
  if (!template) {
    return [];
  }

  return [{ ...template, partnerId }];
}
