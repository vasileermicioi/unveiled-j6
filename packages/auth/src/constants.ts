export const AGE_GROUPS = ["18-25", "26-35", "36-50", "50+"] as const;
export const INTERESTS = [
  "Theater",
  "Kino",
  "Museum",
  "Ausstellung",
  "Konzert",
  "Talk/Lesung",
  "Comedy",
  "Tanz/Performance",
  "Other",
] as const;
/** Max trimmed length for `profile.interests_other` when interest `Other` is selected. */
export const INTERESTS_OTHER_MAX_LENGTH = 100;
export const MOODS = ["Leicht", "Experimentell", "Klassisch", "Politisch", "Fam"] as const;
export const TIMING_OPTIONS = ["After Work", "Weekend", "Day"] as const;
export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
/** Member onboarding / profile preferred languages (full allowlist). */
export const PREFERRED_LANGUAGES = [
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

/**
 * Default-visible languages in searchable multi-selects (Berlin-oriented).
 * Full `PREFERRED_LANGUAGES` remain available via search; UI pins these first.
 */
export const FEATURED_PREFERRED_LANGUAGES = [
  "DE",
  "EN",
  "TR",
  "RU",
  "PL",
  "AR",
  "FR",
  "ES",
  "IT",
  "UK",
  "VI",
  "PT",
] as const satisfies ReadonlyArray<(typeof PREFERRED_LANGUAGES)[number]>;

/** Admin event metadata languages — same allowlist as member preferred languages. */
export const EVENT_LANGUAGES = PREFERRED_LANGUAGES;

export type AgeGroup = (typeof AGE_GROUPS)[number];
export type PreferredLanguage = (typeof PREFERRED_LANGUAGES)[number];
export type FeaturedPreferredLanguage = (typeof FEATURED_PREFERRED_LANGUAGES)[number];
export type EventLanguage = PreferredLanguage;
