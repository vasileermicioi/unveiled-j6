import { CatalogValidationError } from "./errors";
import { requireNonEmpty } from "./validation";

export const EVENT_CATEGORIES = [
  "theater",
  "opera_house",
  "concert_hall",
  "museum",
  "kunsthalle",
  "commercial_gallery",
  "cinema",
  "cabaret",
  "small_stage",
  "variety_theater",
  "musical_theater",
  "dance_venue",
  "live_music_venue",
  "cultural_center",
  "library",
  "literature_house",
  "planetarium",
  "botanical_garden",
  "zoo_cultural",
  "exhibition_hall",
  "film_museum",
  "music_school",
  "open_air_stage",
  "city_archive",
  "atelierhaus",
  "artists_house",
  "comedy_club",
] as const;

export const EVENT_TYPES = [
  "theater_play",
  "opera_performance",
  "concert",
  "exhibition_opening",
  "exhibition_ongoing",
  "guided_tour",
  "film_screening",
  "film_premiere",
  "reading",
  "book_presentation",
  "poetry_slam",
  "cabaret_evening",
  "comedy_evening",
  "dance_performance",
  "ballet_evening",
  "musical",
  "variety_show",
  "workshop",
  "panel_discussion",
  "talk_lecture",
  "festival",
  "club_concert",
  "live_set",
  "open_air_event",
  "family_event",
  "night_tour",
  "special_event",
  "vernissage",
  "finissage",
  "workshop_series",
  "community_event",
  "networking_evening",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type EventTaxonomyLocale = "de" | "en";

export const EVENT_CATEGORY_LABELS: Record<EventTaxonomyLocale, Record<EventCategory, string>> = {
  de: {
    theater: "Theater",
    opera_house: "Oper / Opernhaus",
    concert_hall: "Konzerthaus / Philharmonie",
    museum: "Museum",
    kunsthalle: "Kunsthalle",
    commercial_gallery: "Galerie",
    cinema: "Kino",
    cabaret: "Kabarett",
    small_stage: "Kleinkunstbühne",
    variety_theater: "Varieté",
    musical_theater: "Musical-Theater",
    dance_venue: "Ballett- und Tanzhaus",
    live_music_venue: "Live-Musik-Venue",
    cultural_center: "Kulturzentrum / soziokulturelles Zentrum",
    library: "Bibliothek",
    literature_house: "Literaturhaus",
    planetarium: "Planetarium",
    botanical_garden: "Botanischer Garten",
    zoo_cultural: "Zoo mit kulturell-edukativem Angebot",
    exhibition_hall: "Ausstellungshalle",
    film_museum: "Filmmuseum",
    music_school: "Musikschule mit öffentlichen Aufführungen",
    open_air_stage: "Freilichtbühne",
    city_archive: "Stadtarchiv mit Ausstellungen",
    atelierhaus: "Atelierhaus",
    artists_house: "Künstlerhaus",
    comedy_club: "Comedy Club",
  },
  en: {
    theater: "Theater",
    opera_house: "Opera / opera house",
    concert_hall: "Concert hall / philharmonic",
    museum: "Museum",
    kunsthalle: "Art gallery (kunsthalle)",
    commercial_gallery: "Gallery (commercial art gallery)",
    cinema: "Cinema",
    cabaret: "Cabaret",
    small_stage: "Small-stage venue",
    variety_theater: "Variety theater",
    musical_theater: "Musical theater",
    dance_venue: "Ballet and dance venue",
    live_music_venue: "Live music venue",
    cultural_center: "Cultural center / community arts center",
    library: "Library",
    literature_house: "Literature house",
    planetarium: "Planetarium",
    botanical_garden: "Botanical garden",
    zoo_cultural: "Zoo with cultural or educational programming",
    exhibition_hall: "Exhibition hall",
    film_museum: "Film museum",
    music_school: "Music school with public performances",
    open_air_stage: "Open air stage",
    city_archive: "City archive with exhibitions",
    atelierhaus: "Artist studio building",
    artists_house: "Artists' house",
    comedy_club: "Comedy club",
  },
};

export const EVENT_TYPE_LABELS: Record<EventTaxonomyLocale, Record<EventType, string>> = {
  de: {
    theater_play: "Theateraufführung / Schauspiel",
    opera_performance: "Opernaufführung",
    concert: "Konzert",
    exhibition_opening: "Ausstellungseröffnung",
    exhibition_ongoing: "Ausstellung (laufend)",
    guided_tour: "Führung",
    film_screening: "Filmvorführung",
    film_premiere: "Filmpremiere",
    reading: "Lesung",
    book_presentation: "Buchvorstellung",
    poetry_slam: "Poetry Slam",
    cabaret_evening: "Kabarettabend",
    comedy_evening: "Comedyabend",
    dance_performance: "Tanzaufführung",
    ballet_evening: "Ballettabend",
    musical: "Musical",
    variety_show: "Varieté-Show",
    workshop: "Workshop",
    panel_discussion: "Podiumsgespräch",
    talk_lecture: "Vortrag",
    festival: "Festival",
    club_concert: "Club-Konzert",
    live_set: "Live-Set",
    open_air_event: "Open-Air-Veranstaltung",
    family_event: "Kinderprogramm / Familienveranstaltung",
    night_tour: "Nachtführung (z. B. Museum bei Nacht)",
    special_event: "Sonderveranstaltung",
    vernissage: "Vernissage",
    finissage: "Finissage",
    workshop_series: "Workshop-Reihe",
    community_event: "Community-Event",
    networking_evening: "Networking-Abend",
  },
  en: {
    theater_play: "Theater performance / play",
    opera_performance: "Opera performance",
    concert: "Concert",
    exhibition_opening: "Exhibition opening",
    exhibition_ongoing: "Exhibition (ongoing)",
    guided_tour: "Guided tour",
    film_screening: "Film screening",
    film_premiere: "Film premiere",
    reading: "Reading",
    book_presentation: "Book presentation",
    poetry_slam: "Poetry slam",
    cabaret_evening: "Cabaret evening",
    comedy_evening: "Comedy evening",
    dance_performance: "Dance performance",
    ballet_evening: "Ballet evening",
    musical: "Musical",
    variety_show: "Variety show",
    workshop: "Workshop",
    panel_discussion: "Panel discussion",
    talk_lecture: "Talk / lecture",
    festival: "Festival",
    club_concert: "Club concert",
    live_set: "Live set",
    open_air_event: "Open air event",
    family_event: "Children's program / family event",
    night_tour: "Night tour (e.g. museum at night)",
    special_event: "Special event",
    vernissage: "Vernissage (opening reception)",
    finissage: "Finissage (closing event)",
    workshop_series: "Workshop series",
    community_event: "Community event",
    networking_evening: "Networking evening",
  },
};

/** Locked parent-guide old → new pairs. Keys are case-sensitive. */
export const LEGACY_EVENT_CATEGORY_MAP: Record<string, EventCategory> = {
  Theater: "theater",
  Kino: "cinema",
  Museum: "museum",
  Ausstellung: "exhibition_hall",
  Konzert: "live_music_venue",
  "Talk/Lesung": "literature_house",
  Comedy: "comedy_club",
  "Tanz/Performance": "dance_venue",
  Other: "cultural_center",
  Music: "live_music_venue",
  music: "live_music_venue",
  Art: "kunsthalle",
  Film: "cinema",
  Talk: "literature_house",
};

export const LEGACY_EVENT_TYPE_MAP: Record<string, EventType> = {
  Performance: "theater_play",
  Concert: "concert",
  Tour: "guided_tour",
  Talk: "talk_lecture",
  Workshop: "workshop",
  Screening: "film_screening",
  Reading: "reading",
  Other: "special_event",
};

export function isEventCategory(value: string): value is EventCategory {
  return (EVENT_CATEGORIES as readonly string[]).includes(value);
}

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value);
}

export function getEventCategoryLabel(locale: EventTaxonomyLocale, key: string): string {
  if (isEventCategory(key)) {
    return EVENT_CATEGORY_LABELS[locale][key];
  }
  return key;
}

export function getEventTypeLabel(locale: EventTaxonomyLocale, key: string): string {
  if (isEventType(key)) {
    return EVENT_TYPE_LABELS[locale][key];
  }
  return key;
}

export function mapLegacyEventCategory(value: string): EventCategory | undefined {
  return LEGACY_EVENT_CATEGORY_MAP[value];
}

export function mapLegacyEventType(value: string): EventType | undefined {
  return LEGACY_EVENT_TYPE_MAP[value];
}

export function assertEventCategory(value: string | undefined | null): EventCategory {
  const trimmed = requireNonEmpty(value, "category");
  if (!isEventCategory(trimmed)) {
    throw new CatalogValidationError(
      "INVALID_EVENT_CATEGORY",
      `category ${trimmed} is not an allowlisted event category`,
    );
  }
  return trimmed;
}

export function assertEventType(value: string | undefined | null): EventType {
  const trimmed = requireNonEmpty(value, "eventType");
  if (!isEventType(trimmed)) {
    throw new CatalogValidationError(
      "INVALID_EVENT_TYPE",
      `eventType ${trimmed} is not an allowlisted event type`,
    );
  }
  return trimmed;
}
