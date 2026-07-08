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
] as const;
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
  "X-Berg",
  "P-Berg",
  "Charlottenburg",
  "Wedding",
  "F-Hain",
  "Schöneberg",
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
export const PREFERRED_LANGUAGES = ["DE", "EN", "Non-Verbal"] as const;
export const MAX_DISTANCE_MIN = 1;
export const MAX_DISTANCE_MAX = 25;

export type AgeGroup = (typeof AGE_GROUPS)[number];
export type EventType = (typeof EVENT_TYPES)[number];
