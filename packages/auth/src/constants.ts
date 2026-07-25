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
export const DISTRICTS = [
  "Mitte",
  "Friedrichshain-Kreuzberg",
  "Pankow",
  "Charlottenburg-Wilmersdorf",
  "Spandau",
  "Steglitz-Zehlendorf",
  "Tempelhof-Schöneberg",
  "Neukölln",
  "Treptow-Köpenick",
  "Marzahn-Hellersdorf",
  "Lichtenberg",
  "Reinickendorf",
] as const;
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

/** Compact language set for admin event metadata (not the full member catalog). */
export const EVENT_LANGUAGES = ["DE", "EN"] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type PreferredLanguage = (typeof PREFERRED_LANGUAGES)[number];
export type EventLanguage = (typeof EVENT_LANGUAGES)[number];
