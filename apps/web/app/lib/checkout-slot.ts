import type { Locale } from "./locale";

export type CheckoutOccurrence = {
  startsAtIso: string;
  creditPrice: number;
  maxQty: number;
};

const MIN_QTY = 1;

/** SSR hidden POST field; the book island updates this when the slot select changes. */
export const BOOK_DATE_TIME_INPUT_ID = "book-date-time";

export function clampQty(value: number, maxQty: number): number {
  if (!Number.isFinite(value)) {
    return MIN_QTY;
  }
  if (maxQty < MIN_QTY) {
    return MIN_QTY;
  }
  return Math.min(maxQty, Math.max(MIN_QTY, Math.trunc(value)));
}

export function withQtyAndDateTimeQuery(path: string, qty: number, dateTimeIso?: string): string {
  const url = new URL(path, "https://unveiled.local");
  url.searchParams.set("qty", String(qty));
  if (dateTimeIso) {
    url.searchParams.set("dateTime", dateTimeIso);
  }
  return `${url.pathname}${url.search}`;
}

export function resolveSelectedOccurrence(
  occurrences: CheckoutOccurrence[],
  defaultDateTimeIso?: string,
): CheckoutOccurrence | undefined {
  if (occurrences.length === 0) {
    return undefined;
  }
  if (defaultDateTimeIso) {
    const match = occurrences.find((occurrence) => occurrence.startsAtIso === defaultDateTimeIso);
    if (match) {
      return match;
    }
  }
  return occurrences[0];
}

export function formatOccurrenceLabel(startsAtIso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(startsAtIso));
}

/** Unit-price line on the book form. Kept serializable (no function island props). */
export function formatSlotUnitPrice(creditPrice: number, locale: Locale): string {
  const credits =
    locale === "de"
      ? `${creditPrice} Credit${creditPrice === 1 ? "" : "s"}`
      : `${creditPrice} credit${creditPrice === 1 ? "" : "s"}`;
  const perTicket = locale === "de" ? "pro Ticket" : "per ticket";
  return `${credits} ${perTicket}`;
}

export function firstFormString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
}

export function parseDateTimeParam(raw: string | undefined): Date | null {
  if (!raw?.trim()) {
    return null;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}
