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
export const EVENT_TYPES = [
  "Performance",
  "Concert",
  "Tour",
  "Talk",
  "Workshop",
  "Screening",
  "Reading",
  "Other",
] as const;
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
/** Member onboarding / profile preferred languages (DE/EN first; UI sorts the rest by label). */
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

/** Admin event metadata languages — same allowlist as member preferred languages. */
export const EVENT_LANGUAGES = PREFERRED_LANGUAGES;

/** Inclusive km bounds for `users.profile.max_distance` (active preference again). */
export const MAX_DISTANCE_MIN = 1;
export const MAX_DISTANCE_MAX = 50;

export type AgeGroup = (typeof AGE_GROUPS)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type PreferredLanguage = (typeof PREFERRED_LANGUAGES)[number];
export type EventLanguage = PreferredLanguage;
