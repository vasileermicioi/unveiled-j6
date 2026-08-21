import { ilike, or, type SQL } from "drizzle-orm";

import { events } from "../schema/events";
import { requireNonEmpty } from "./validation";

export type EventCopyLocale = "de" | "en";

export type EventCopyWriteInput = {
  titleDe?: string | null;
  titleEn?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  /** Legacy single-field posts; copied into both locales when locale fields are omitted. */
  title?: string | null;
  description?: string | null;
};

export type ResolvedEventCopyFields = {
  titleDe: string;
  titleEn: string;
  descriptionDe: string;
  descriptionEn: string;
  /** Canonical = German. */
  title: string;
  description: string;
};

export type EventCopySource = {
  title: string;
  description: string;
  titleDe?: string | null;
  titleEn?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
};

export type ResolvedEventCopy = {
  title: string;
  description: string;
};

function hasLocaleWrite(input: EventCopyWriteInput): boolean {
  return (
    input.titleDe !== undefined ||
    input.titleEn !== undefined ||
    input.descriptionDe !== undefined ||
    input.descriptionEn !== undefined
  );
}

/**
 * Catalog write coerce for event title/description.
 * Locale path: require all four non-empty (trimmed). Canonical = DE.
 * Legacy path: copy `title` / `description` into both locales.
 */
export function resolveEventCopyFields(input: EventCopyWriteInput): ResolvedEventCopyFields {
  if (hasLocaleWrite(input)) {
    const titleDe = requireNonEmpty(input.titleDe, "titleDe");
    const titleEn = requireNonEmpty(input.titleEn, "titleEn");
    const descriptionDe = requireNonEmpty(input.descriptionDe, "descriptionDe");
    const descriptionEn = requireNonEmpty(input.descriptionEn, "descriptionEn");
    return {
      titleDe,
      titleEn,
      descriptionDe,
      descriptionEn,
      title: titleDe,
      description: descriptionDe,
    };
  }

  const title = requireNonEmpty(input.title, "title");
  const description = requireNonEmpty(input.description, "description");
  return {
    titleDe: title,
    titleEn: title,
    descriptionDe: description,
    descriptionEn: description,
    title,
    description,
  };
}

/** Merge update input with stored copy. Locale fields skip the legacy shim. */
export function resolveUpdatedEventCopyFields(
  input: EventCopyWriteInput,
  existing: ResolvedEventCopyFields,
): ResolvedEventCopyFields {
  if (hasLocaleWrite(input)) {
    return resolveEventCopyFields({
      titleDe: input.titleDe !== undefined ? input.titleDe : existing.titleDe,
      titleEn: input.titleEn !== undefined ? input.titleEn : existing.titleEn,
      descriptionDe:
        input.descriptionDe !== undefined ? input.descriptionDe : existing.descriptionDe,
      descriptionEn:
        input.descriptionEn !== undefined ? input.descriptionEn : existing.descriptionEn,
    });
  }
  if (input.title !== undefined || input.description !== undefined) {
    return resolveEventCopyFields({
      title: input.title !== undefined ? input.title : existing.title,
      description: input.description !== undefined ? input.description : existing.description,
    });
  }
  return existing;
}

function localePair(
  event: EventCopySource,
  locale: EventCopyLocale,
): { title: string; description: string } | null {
  const title = locale === "de" ? event.titleDe : event.titleEn;
  const description = locale === "de" ? event.descriptionDe : event.descriptionEn;
  if (!title?.trim()) {
    return null;
  }
  return { title: title.trim(), description: description ?? "" };
}

/**
 * Read fallback: requested locale (by non-empty title) → other locale → canonical.
 */
export function resolveEventCopy(
  event: EventCopySource,
  locale: EventCopyLocale,
): ResolvedEventCopy {
  const other: EventCopyLocale = locale === "de" ? "en" : "de";
  return (
    localePair(event, locale) ??
    localePair(event, other) ?? {
      title: event.title,
      description: event.description,
    }
  );
}

/** JS spec of title substring search (case-insensitive OR across locales). */
export function eventTitleMatchesQuery(titleDe: string, titleEn: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return false;
  }
  return titleDe.toLowerCase().includes(q) || titleEn.toLowerCase().includes(q);
}

/** Admin / member / sales title ILIKE: match `title_de` or `title_en`. */
export function eventTitleLocaleIlike(pattern: string): SQL | undefined {
  return or(ilike(events.titleDe, pattern), ilike(events.titleEn, pattern));
}
