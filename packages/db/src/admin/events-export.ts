import { countEvents, listEvents } from "../catalog/events";
import type { Db } from "../index";
import type { Event } from "../schema/events";

/** `yes` / `no` from `published=`; omitted = drafts and published. */
export type EventsExportPublishedFilter = "yes" | "no";

/** Filters for the admin events-table export (mirrors the events list page). */
export type EventsExportFilters = {
  title: string;
  partner: string;
  language: string;
  published?: EventsExportPublishedFilter;
};

const LANGUAGE_CODE_RE = /^[A-Za-z]{2}$/;

/** Parse optional title/partner/language/published filters from the events-export URL. */
export function parseEventsExportFilters(url: URL): EventsExportFilters {
  const title = url.searchParams.get("title")?.trim() ?? "";
  const partner = url.searchParams.get("partner")?.trim() ?? "";
  const languageRaw = url.searchParams.get("language")?.trim() ?? "";
  const language = LANGUAGE_CODE_RE.test(languageRaw) ? languageRaw.toUpperCase() : "";
  const publishedRaw = url.searchParams.get("published")?.trim() ?? "";
  const published =
    publishedRaw === "yes" || publishedRaw === "no"
      ? (publishedRaw as EventsExportPublishedFilter)
      : undefined;

  return published ? { title, partner, language, published } : { title, partner, language };
}

/** Build `?title=&partner=&language=&published=&format=` for HTML/CSV events-export links. */
export function buildEventsExportQueryString(options: {
  title?: string;
  partner?: string;
  language?: string;
  published?: EventsExportPublishedFilter;
  format?: "csv";
}): string {
  const params = new URLSearchParams();
  const title = options.title?.trim();
  if (title) {
    params.set("title", title);
  }
  const partner = options.partner?.trim();
  if (partner) {
    params.set("partner", partner);
  }
  const language = options.language?.trim().toUpperCase();
  if (language) {
    params.set("language", language);
  }
  if (options.published === "yes" || options.published === "no") {
    params.set("published", options.published);
  }
  if (options.format) {
    params.set("format", options.format);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export type ListEventsForExportOptions = {
  title?: string;
  partner?: string;
  language?: string;
  published?: boolean;
};

/** Soft cap for a single CSV download (MVP catalog is far smaller). */
export const EVENTS_EXPORT_MAX_ROWS = 10000;

/**
 * All events matching the admin list filters, newest first (no pagination).
 * Uses the same `listEvents`/`countEvents` filter path as `/admin/events`
 * so the CSV matches the filtered list view.
 */
export async function listEventsForExport(
  db: Db,
  options: ListEventsForExportOptions = {},
): Promise<Event[]> {
  const total = await countEvents(db, {
    title: options.title || undefined,
    partner: options.partner || undefined,
    language: options.language || undefined,
    published: options.published,
  });
  const limit = Math.max(0, Math.min(total, EVENTS_EXPORT_MAX_ROWS));
  if (limit === 0) {
    return [];
  }
  return listEvents(db, {
    title: options.title || undefined,
    partner: options.partner || undefined,
    language: options.language || undefined,
    published: options.published,
    limit,
    offset: 0,
    sort: "created",
    desc: true,
  });
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function csvDate(value: Date | null | undefined): string {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : "";
}

function csvJoin(values: readonly string[] | null | undefined): string {
  return values?.join(";") ?? "";
}

function csvJoinDates(values: readonly Date[] | null | undefined): string {
  if (!values) {
    return "";
  }
  return values.map((d) => (d instanceof Date ? d.toISOString() : "")).join(";");
}

function csvJoinNumbers(values: readonly number[] | null | undefined): string {
  return values?.map((n) => String(n)).join(";") ?? "";
}

/** CSV: full `events` table row per line (debugging aid for browse-visibility issues). */
export const EVENTS_CSV_HEADER =
  "id,partner_id,partner_name,title,title_de,title_en,description,description_de,description_en,address,street,house_number,address_line2,country,city,zip_code,image_id,category,event_type,tags,date_times,date_time,timing_mode,start_time_minutes,weekday,occurrence_credit_prices,credit_price,capacity_mode,occurrence_capacities,total_capacity,remaining_capacity,ticket_type,secret_code,promo_code,event_website_url,language_independent,languages,has_subtitles,subtitle_languages,lat,lng,published,created_at,updated_at";

export function formatEventsCsv(rows: Event[]): string {
  const lines = rows.map((row) =>
    [
      csvEscape(row.id),
      csvEscape(row.partnerId),
      csvEscape(row.partnerName),
      csvEscape(row.title),
      csvEscape(row.titleDe),
      csvEscape(row.titleEn),
      csvEscape(row.description),
      csvEscape(row.descriptionDe),
      csvEscape(row.descriptionEn),
      csvEscape(row.address),
      csvEscape(row.street),
      csvEscape(row.houseNumber),
      csvEscape(row.addressLine2 ?? ""),
      csvEscape(row.country),
      csvEscape(row.city),
      csvEscape(row.zipCode),
      csvEscape(row.imageId),
      csvEscape(row.category),
      csvEscape(row.eventType),
      csvEscape(csvJoin(row.tags)),
      csvEscape(csvJoinDates(row.dateTimes)),
      csvEscape(csvDate(row.dateTime)),
      csvEscape(row.timingMode),
      csvEscape(String(row.startTimeMinutes)),
      csvEscape(String(row.weekday)),
      csvEscape(csvJoinNumbers(row.occurrenceCreditPrices)),
      csvEscape(String(row.creditPrice)),
      csvEscape(row.capacityMode),
      csvEscape(csvJoinNumbers(row.occurrenceCapacities)),
      csvEscape(String(row.totalCapacity)),
      csvEscape(String(row.remainingCapacity)),
      csvEscape(row.ticketType),
      csvEscape(row.secretCode ?? ""),
      csvEscape(row.promoCode ?? ""),
      csvEscape(row.eventWebsiteUrl ?? ""),
      csvEscape(String(row.languageIndependent)),
      csvEscape(csvJoin(row.languages)),
      csvEscape(String(row.hasSubtitles)),
      csvEscape(csvJoin(row.subtitleLanguages)),
      csvEscape(row.lat ?? ""),
      csvEscape(row.lng ?? ""),
      csvEscape(String(row.published)),
      csvEscape(csvDate(row.createdAt)),
      csvEscape(csvDate(row.updatedAt)),
    ].join(","),
  );
  return `${[EVENTS_CSV_HEADER, ...lines].join("\n")}\n`;
}
