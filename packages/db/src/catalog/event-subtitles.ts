import { CatalogValidationError } from "./errors";
import { isIso6391LanguageCode } from "./iso6391";

/**
 * Spoken-event language allowlist. Kept in `@unveiled/db` so catalog validation does
 * not depend on `@unveiled/auth` (auth → db). Must stay in sync with
 * `PREFERRED_LANGUAGES` / `EVENT_LANGUAGES` in `@unveiled/auth`.
 *
 * Subtitle language is broader: any ISO 639-1 code (see `resolveEventSubtitles`).
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
  /** Uppercase ISO 639-1 alpha-2 when on; null when off. */
  subtitleLanguage: string | null;
};

/**
 * Domain coerce/validate for subtitle metadata.
 * - Off → `subtitleLanguage` forced null (even if a value was submitted).
 * - On → require a non-empty ISO 639-1 alpha-2 code (normalized to uppercase).
 */
export function resolveEventSubtitles(
  hasSubtitles: boolean,
  subtitleLanguage: string | null | undefined,
): ResolvedEventSubtitles {
  if (!hasSubtitles) {
    return { hasSubtitles: false, subtitleLanguage: null };
  }

  const normalized = subtitleLanguage?.trim().toUpperCase() ?? "";
  if (!normalized || !isIso6391LanguageCode(normalized)) {
    throw new CatalogValidationError(
      "INVALID_SUBTITLE_LANGUAGE",
      "subtitleLanguage is required and must be an ISO 639-1 language code when hasSubtitles is true",
    );
  }

  return {
    hasSubtitles: true,
    subtitleLanguage: normalized,
  };
}
