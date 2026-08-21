import { and, asc, desc, eq, gte, ilike, inArray, lt, type SQL, sql } from "drizzle-orm";

import {
  type BerlinDayRange,
  berlinInclusiveDateRange,
  getBerlinCalendarDate,
} from "../catalog/datetime";
import { eventTitleLocaleIlike } from "../catalog/event-copy";
import type { Db } from "../index";
import { bookings } from "../schema/bookings";
import { events } from "../schema/events";

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Booking statuses that count toward tickets sold. */
export const SALES_EXPORT_COUNTED_STATUSES = ["CONFIRMED", "USED"] as const;

export type SalesByEventRow = {
  eventId: string;
  title: string;
  partnerName: string;
  dateTime: Date;
  ticketsSold: number;
};

export type SalesExportPeriodOk = {
  ok: true;
  from: string;
  to: string;
  range: BerlinDayRange;
  usedDefault: boolean;
};

export type SalesExportPeriodError = {
  ok: false;
  reason: "invalid" | "inverted";
  from: string;
  to: string;
};

export type SalesExportPeriodResult = SalesExportPeriodOk | SalesExportPeriodError;

export function isValidSalesExportYmd(value: string): boolean {
  return YMD_RE.test(value.trim());
}

/**
 * Default inclusive window: last 30 Europe/Berlin calendar days ending today
 * (`today − 29` … `today`).
 */
export function defaultSalesExportPeriod(now: Date = new Date()): { from: string; to: string } {
  const to = getBerlinCalendarDate(now);
  const match = YMD_RE.exec(to);
  if (!match) {
    throw new Error(`Unexpected Berlin calendar date: ${to}`);
  }

  const year = Number.parseInt(match[1] ?? "0", 10);
  const month = Number.parseInt(match[2] ?? "0", 10);
  const day = Number.parseInt(match[3] ?? "0", 10);
  const fromUtcNoon = new Date(Date.UTC(year, month - 1, day - 29, 12, 0, 0));
  const from = `${fromUtcNoon.getUTCFullYear()}-${String(fromUtcNoon.getUTCMonth() + 1).padStart(2, "0")}-${String(fromUtcNoon.getUTCDate()).padStart(2, "0")}`;

  return { from, to };
}

/**
 * Resolve `from`/`to` query params for the sales-export page.
 * Both omitted → default last-30-days window. Either present → both must be
 * valid `YYYY-MM-DD` with `from <= to`.
 */
export function resolveSalesExportPeriod(input: {
  from?: string | null;
  to?: string | null;
  now?: Date;
}): SalesExportPeriodResult {
  const rawFrom = input.from?.trim() ?? "";
  const rawTo = input.to?.trim() ?? "";

  if (!rawFrom && !rawTo) {
    const { from, to } = defaultSalesExportPeriod(input.now);
    return {
      ok: true,
      from,
      to,
      range: berlinInclusiveDateRange(from, to),
      usedDefault: true,
    };
  }

  if (!isValidSalesExportYmd(rawFrom) || !isValidSalesExportYmd(rawTo)) {
    return { ok: false, reason: "invalid", from: rawFrom, to: rawTo };
  }

  if (rawFrom > rawTo) {
    return { ok: false, reason: "inverted", from: rawFrom, to: rawTo };
  }

  return {
    ok: true,
    from: rawFrom,
    to: rawTo,
    range: berlinInclusiveDateRange(rawFrom, rawTo),
    usedDefault: false,
  };
}

export type ListSalesByEventOptions = {
  /** YYYY-MM-DD Europe/Berlin calendar day (inclusive). */
  from: string;
  /** YYYY-MM-DD Europe/Berlin calendar day (inclusive). */
  to: string;
  /** Case-insensitive substring filter on event title. */
  title?: string;
  /** Case-insensitive substring filter on denormalized partner name. */
  partner?: string;
};

export type SalesExportFilters = {
  title: string;
  partner: string;
};

/** Parse optional title/partner filters from the sales-export URL. */
export function parseSalesExportFilters(url: URL): SalesExportFilters {
  return {
    title: url.searchParams.get("title")?.trim() ?? "",
    partner: url.searchParams.get("partner")?.trim() ?? "",
  };
}

/** Build `?from=&to=&title=&partner=&format=` for HTML/CSV sales-export links. */
export function buildSalesExportQueryString(options: {
  from: string;
  to: string;
  title?: string;
  partner?: string;
  format?: "csv";
}): string {
  const params = new URLSearchParams();
  params.set("from", options.from);
  params.set("to", options.to);
  const title = options.title?.trim();
  if (title) {
    params.set("title", title);
  }
  const partner = options.partner?.trim();
  if (partner) {
    params.set("partner", partner);
  }
  if (options.format) {
    params.set("format", options.format);
  }
  return `?${params.toString()}`;
}

/**
 * One row per event with tickets sold in `[from, to]` (Berlin calendar days).
 * Tickets sold = sum of `tickets_count` for CONFIRMED/USED bookings whose
 * `created_at` falls in the inclusive period (exclusive end bound in UTC).
 * Optional `title` / `partner` filters limit which events appear (HTML + CSV).
 */
export async function listSalesByEvent(
  db: Db,
  options: ListSalesByEventOptions,
): Promise<SalesByEventRow[]> {
  if (!isValidSalesExportYmd(options.from) || !isValidSalesExportYmd(options.to)) {
    throw new Error("Invalid sales-export period");
  }
  if (options.from > options.to) {
    throw new Error("Inverted sales-export period");
  }

  const range = berlinInclusiveDateRange(options.from, options.to);

  const sales = db
    .select({
      eventId: bookings.eventId,
      ticketsSold: sql<number>`coalesce(sum(${bookings.ticketsCount}), 0)::int`.as("tickets_sold"),
    })
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, [...SALES_EXPORT_COUNTED_STATUSES]),
        gte(bookings.createdAt, range.start),
        lt(bookings.createdAt, range.end),
      ),
    )
    .groupBy(bookings.eventId)
    .as("sales_by_event");

  const conditions: SQL[] = [];
  const title = options.title?.trim();
  if (title) {
    const titleCondition = eventTitleLocaleIlike(`%${title}%`);
    if (titleCondition) {
      conditions.push(titleCondition);
    }
  }
  const partner = options.partner?.trim();
  if (partner) {
    conditions.push(ilike(events.partnerName, `%${partner}%`));
  }

  let query = db
    .select({
      eventId: events.id,
      title: events.title,
      partnerName: events.partnerName,
      dateTime: events.dateTime,
      ticketsSold: sql<number>`coalesce(${sales.ticketsSold}, 0)::int`.mapWith(Number),
    })
    .from(events)
    .leftJoin(sales, eq(events.id, sales.eventId))
    .$dynamic();

  if (conditions.length === 1) {
    query = query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions));
  }

  const rows = await query.orderBy(
    desc(sql`coalesce(${sales.ticketsSold}, 0)`),
    desc(events.dateTime),
    asc(events.title),
  );

  return rows.map(
    (row: {
      eventId: string;
      title: string;
      partnerName: string;
      dateTime: Date;
      ticketsSold: number;
    }): SalesByEventRow => ({
      eventId: row.eventId,
      title: row.title,
      partnerName: row.partnerName,
      dateTime: row.dateTime,
      ticketsSold: row.ticketsSold,
    }),
  );
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/** CSV: `event_id,title,partner_name,date_time,tickets_sold` */
export function formatSalesByEventCsv(rows: SalesByEventRow[]): string {
  const header = "event_id,title,partner_name,date_time,tickets_sold";
  const lines = rows.map((row) =>
    [
      csvEscape(row.eventId),
      csvEscape(row.title),
      csvEscape(row.partnerName),
      csvEscape(row.dateTime.toISOString()),
      String(row.ticketsSold),
    ].join(","),
  );
  return `${[header, ...lines].join("\n")}\n`;
}
