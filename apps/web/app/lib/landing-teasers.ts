import { type Db, type Event, listUpcomingEvents, resolveEventCopy } from "@unveiled/db";
import { buildVariantUrl } from "@unveiled/images/urls";
import { landingFallbackTeasers } from "./content/landing-v3";
import type { LandingLiveTeaser } from "./content/types";
import type { Locale } from "./locale";

const BERLIN_TZ = "Europe/Berlin";

/** Rail shows the first 3 upcoming published events (enforced by query + defensive slice). */
export const LANDING_LIVE_TEASER_LIMIT = 3;

/** `DD MMM` uppercase in Europe/Berlin (e.g. `02 SEP`), language-independent. */
export function formatTeaserDateLabel(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    timeZone: BERLIN_TZ,
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${day} ${month}`.trim().toUpperCase();
}

/** `HH:MM` in Europe/Berlin with locale prefix (`ab`/`from`); empty for all-day events. */
export function formatTeaserTime(date: Date, locale: Locale, timingMode: string): string {
  if (timingMode === "ALL_DAY") {
    return "";
  }
  const hhmm = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BERLIN_TZ,
  }).format(date);
  return locale === "de" ? `ab ${hhmm}` : `from ${hhmm}`;
}

function teaserImage(imageId: string | null | undefined): string | undefined {
  if (!imageId?.trim()) {
    return undefined;
  }
  try {
    return buildVariantUrl(imageId, "medium-640.webp");
  } catch {
    return undefined;
  }
}

/**
 * Guest-safe projection of a catalog event row.
 * Exposes only id/title/description/date labels/place/image —
 * never credit price, capacity, redemption, or event-detail URLs.
 */
export function toLandingLiveTeaser(event: Event, locale: Locale): LandingLiveTeaser {
  const copy = resolveEventCopy(event, locale);
  return {
    id: event.id,
    title: copy.title,
    description: copy.description,
    dateLabel: formatTeaserDateLabel(event.dateTime),
    time: formatTeaserTime(event.dateTime, locale, event.timingMode),
    place: event.partnerName?.trim() || event.zipCode || "",
    image: teaserImage(event.imageId),
  };
}

/** Map rows to teasers, soonest-first by `dateTime` (stable for equal instants). */
export function mapLandingLiveTeasers(events: Event[], locale: Locale): LandingLiveTeaser[] {
  return [...events]
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
    .map((event) => toLandingLiveTeaser(event, locale));
}

/**
 * Static fallback (previous rail items minus credits) when the catalog query
 * is empty or unreachable, so the locale-home build stays green.
 */
export function getLandingFallbackTeasers(locale: Locale): LandingLiveTeaser[] {
  return landingFallbackTeasers[locale];
}

/**
 * Loader path for `GET [locale]/index.tsx`: first 3 upcoming published events
 * as guest-safe teasers, with static fallback on empty result or DB throw.
 * Never throws for teaser failure.
 */
export async function loadLandingLiveTeasers(
  db: Db,
  locale: Locale,
  now?: Date,
): Promise<LandingLiveTeaser[]> {
  try {
    const rows = await listUpcomingEvents(db, {
      limit: LANDING_LIVE_TEASER_LIMIT,
      ...(now ? { now } : {}),
    });
    if (rows.length === 0) {
      return getLandingFallbackTeasers(locale);
    }
    return mapLandingLiveTeasers(rows, locale).slice(0, LANDING_LIVE_TEASER_LIMIT);
  } catch (error) {
    console.error("landing teasers fetch failed", error);
    return getLandingFallbackTeasers(locale);
  }
}
