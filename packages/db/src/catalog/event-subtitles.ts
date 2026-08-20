import { CatalogValidationError } from "./errors";
import { isIso6391LanguageCode } from "./iso6391";

/**
 * Spoken-event language allowlist. Kept in `@unveiled/db` so catalog validation does
 * not depend on `@unveiled/auth` (auth → db). Must stay in sync with
 * `PREFERRED_LANGUAGES` / `EVENT_LANGUAGES` in `@unveiled/auth`.
 *
 * Subtitle languages are broader: any ISO 639-1 code (see `resolveEventSubtitles`).
 */
export const EVENT_LANGUAGE_CODES = [
  "DE",
  "EN",
  "AR",
  "BG",
  "CS",
  "DA",
  "EL",
  "ES",
  "FA",
  "FI",
  "FR",
  "HE",
  "HI",
  "HR",
  "HU",
  "IT",
  "JA",
  "KO",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "RU",
  "SV",
  "TR",
  "UK",
  "VI",
  "ZH",
] as const;

export type EventLanguageCode = (typeof EVENT_LANGUAGE_CODES)[number];

export type ResolvedEventSubtitles = {
  hasSubtitles: boolean;
  /** Unique uppercase ISO 639-1 alpha-2 codes when on; null when off. */
  subtitleLanguages: string[] | null;
};

/** Wrap a backfill-equivalent single code as a one-element list. */
export function coerceSubtitleLanguages(
  subtitleLanguages: string[] | string | null | undefined,
): string[] {
  if (subtitleLanguages == null) {
    return [];
  }
  return typeof subtitleLanguages === "string" ? [subtitleLanguages] : subtitleLanguages;
}

/**
 * Domain coerce/validate for subtitle metadata.
 * - Off → `subtitleLanguages` forced null (even if values were submitted).
 * - On → require at least one ISO 639-1 alpha-2 code (unique uppercase, first-seen order).
 */
export function resolveEventSubtitles(
  hasSubtitles: boolean,
  subtitleLanguages: string[] | string | null | undefined,
): ResolvedEventSubtitles {
  if (!hasSubtitles) {
    return { hasSubtitles: false, subtitleLanguages: null };
  }

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const raw of coerceSubtitleLanguages(subtitleLanguages)) {
    const normalized = raw.trim().toUpperCase();
    if (!normalized) {
      continue;
    }
    if (!isIso6391LanguageCode(normalized)) {
      throw new CatalogValidationError(
        "INVALID_SUBTITLE_LANGUAGE",
        "subtitleLanguages must contain at least one ISO 639-1 language code when hasSubtitles is true",
      );
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(normalized);
  }

  if (unique.length === 0) {
    throw new CatalogValidationError(
      "INVALID_SUBTITLE_LANGUAGE",
      "subtitleLanguages must contain at least one ISO 639-1 language code when hasSubtitles is true",
    );
  }

  return {
    hasSubtitles: true,
    subtitleLanguages: unique,
  };
}
