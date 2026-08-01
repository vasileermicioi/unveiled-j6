import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type PrebuiltImageVariantsInput,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "@unveiled/images";

import { berlinInclusiveDateRange, getBerlinCalendarDate } from "./datetime";
import type { CreateEventInput } from "./events";
import fixtureJson from "./fixtures/abundo-berlin-demo.json";
import type { CreatePartnerInput } from "./partners";

/**
 * Demo catalog seed — Berlin events from Abundo + local images.
 *
 * Fixture: `fixtures/abundo-berlin-demo.json`
 * Images:  `public/images/seed/{partners,events}/*.jpg` plus `*.jpg.variants/` WebP packs
 * Refresh: `bun scripts/fetch-abundo-seed.ts` then `bun scripts/bake-seed-image-variants.ts`
 *
 * Absolute dates are not stored; `daysFromToday` / hour / minute resolve at seed time.
 * Seed persists prebuilt variants only (no Worker-side resize).
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

const NEIGHBORHOOD_TO_ZIP: Record<string, string> = {
  Mitte: "10115",
  Wedding: "13347",
  "X-Berg": "10961",
  "F-Hain": "10243",
  Kreuzberg: "10961",
  Charlottenburg: "10585",
  Neukölln: "12043",
  Pankow: "10405",
};

function zipFromFixtureEvent(event: {
  zipCode?: string;
  neighborhood?: string;
  address?: string;
}): string {
  if (event.zipCode?.trim()) return event.zipCode.trim();
  const fromAddress = event.address?.match(/\b(1[0-4]\d{3})\b/)?.[1];
  if (fromAddress) return fromAddress;
  const key = event.neighborhood?.trim() ?? "";
  return NEIGHBORHOOD_TO_ZIP[key] ?? "10115";
}

type FixtureEvent = {
  slug: string;
  partnerKey: string;
  title: string;
  description: string;
  address: string;
  /** Legacy abundo field; mapped to zipCode when seeding. */
  neighborhood?: string;
  zipCode?: string;
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

/**
 * Image files still live on disk for local/script seeding.
 * Only call when `getDemoCatalog()` runs — never at module init (Workers validate
 * the bundle with `import.meta.url` undefined).
 */
function catalogDir(): string {
  const metaUrl = import.meta.url;
  if (!metaUrl) {
    throw new Error(
      "Demo catalog images require a filesystem (import.meta.url). Run seed via bun scripts/seed-demo.ts locally.",
    );
  }
  return dirname(fileURLToPath(metaUrl));
}

/** Repo root: packages/db/src/catalog → ../../../../.. */
function repoRoot(): string {
  return join(catalogDir(), "../../../..");
}

function seedImagesRoot(fixture: AbundoFixture): string {
  const relative = fixture.imagesRoot ?? "public/images/seed";
  return join(repoRoot(), relative);
}

function readSeedPrebuilt(
  imagesRoot: string,
  relativePath: string,
  label: string,
): PrebuiltImageVariantsInput {
  const sourceAbs = join(imagesRoot, relativePath);
  const variantsDir = `${sourceAbs}.variants`;
  if (!existsSync(variantsDir)) {
    throw new Error(
      `Missing seed image variants for ${label}: ${variantsDir}\nRun: bun scripts/bake-seed-image-variants.ts`,
    );
  }

  const variants = {} as Record<VariantFilename, Buffer>;
  for (const filename of VARIANT_FILENAMES) {
    const abs = join(variantsDir, filename);
    if (!existsSync(abs)) {
      throw new Error(
        `Missing seed variant ${filename} for ${label}: ${abs}\nRun: bun scripts/bake-seed-image-variants.ts`,
      );
    }
    variants[filename] = readFileSync(abs);
  }

  const metaPath = join(variantsDir, "meta.json");
  let claimedWidth: number | undefined;
  let claimedHeight: number | undefined;
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, "utf8")) as {
        width?: number;
        height?: number;
      };
      if (typeof meta.width === "number" && meta.width >= 1) {
        claimedWidth = meta.width;
      }
      if (typeof meta.height === "number" && meta.height >= 1) {
        claimedHeight = meta.height;
      }
    } catch {
      // Fall through — persist will reject without claims.
    }
  }

  return {
    imageId: crypto.randomUUID(),
    variants,
    ...(claimedWidth !== undefined ? { claimedWidth } : {}),
    ...(claimedHeight !== undefined ? { claimedHeight } : {}),
  };
}

/** Read a baked seed variant pack for demo gallery (or other) attaches outside `getDemoCatalog()`. */
export function readDemoSeedPrebuilt(
  relativePath: string,
  label = relativePath,
): PrebuiltImageVariantsInput {
  const fixture = FIXTURE;
  const imagesRoot = seedImagesRoot(fixture);
  return readSeedPrebuilt(imagesRoot, relativePath, label);
}

/** Bundled fixture — no fs / fileURLToPath at import time (Workers-safe). */
const FIXTURE = fixtureJson as AbundoFixture;

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

    if (!logoPath) {
      if (partner.logoUrl) {
        throw new Error(
          `Partner ${partner.key} has logoUrl but no logoPath variants. Refresh seed images.`,
        );
      }
      throw new Error(
        `Partner ${partner.key} is missing required logoPath. Every seed partner must have a logo.`,
      );
    }

    partnerInput.logoPrebuilt = readSeedPrebuilt(imagesRoot, logoPath, `partner ${partner.key}`);
    if (partner.logoSourceUrl) {
      partnerInput.logoUrl = partner.logoSourceUrl;
    }

    catalog.push({
      partner: partnerInput,
      events: partnerEvents.map((event) => {
        const base: Omit<CreateEventInput, "partnerId"> = {
          title: event.title,
          description: event.description,
          address: event.address,
          country: "DE",
          city: "berlin",
          zipCode: zipFromFixtureEvent(event),
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
          base.imagePrebuilt = readSeedPrebuilt(imagesRoot, event.imagePath, `event ${event.slug}`);
          if (event.imageSourceUrl) {
            base.imageUrl = event.imageSourceUrl;
          }
        } else if (event.imageUrl) {
          throw new Error(
            `Event ${event.slug} has imageUrl but no imagePath variants. Refresh seed images.`,
          );
        }

        return base;
      }),
    });
  }

  return catalog;
}

let cachedDemoCatalog: DemoCatalogEntry[] | null = null;

/** Lazy: reads local seed images only when seeding runs (not at Workers module init). */
export function getDemoCatalog(): DemoCatalogEntry[] {
  if (!cachedDemoCatalog) {
    cachedDemoCatalog = buildDemoCatalog(FIXTURE);
  }
  return cachedDemoCatalog;
}

/** @deprecated Prefer `getDemoCatalog()`. */
export const DEMO_CATALOG: DemoCatalogEntry[] = new Proxy([] as DemoCatalogEntry[], {
  get(_target, prop, receiver) {
    const catalog = getDemoCatalog();
    const value = Reflect.get(catalog, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(catalog)
      : value;
  },
  ownKeys() {
    return Reflect.ownKeys(getDemoCatalog());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getDemoCatalog(), prop);
  },
  has(_target, prop) {
    return Reflect.has(getDemoCatalog(), prop);
  },
});

/** Re-export for callers that already import catalog titles alongside DEMO_CATALOG. */
export { DEMO_DISCOVERY_TITLES } from "./demo-discovery-titles";

/** @deprecated Use getDemoCatalog() — kept for tests referencing partner list length. */
export const DEMO_PARTNERS: Omit<CreatePartnerInput, "logoUpload">[] = new Proxy(
  [] as Omit<CreatePartnerInput, "logoUpload">[],
  {
    get(_target, prop, receiver) {
      const partners = getDemoCatalog().map(({ partner }) => {
        const { logoUpload: _logoUpload, ...rest } = partner;
        return rest;
      });
      const value = Reflect.get(partners, prop, receiver);
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(partners)
        : value;
    },
    ownKeys() {
      return Reflect.ownKeys(
        getDemoCatalog().map(({ partner }) => {
          const { logoUpload: _logoUpload, ...rest } = partner;
          return rest;
        }),
      );
    },
  },
);

/** @deprecated Use getDemoCatalog() — builds one event for backward-compatible tests. */
export function buildDemoEvents(partnerId: string): CreateEventInput[] {
  const template = getDemoCatalog()[0]?.events[0];
  if (!template) {
    return [];
  }

  return [{ ...template, partnerId }];
}
