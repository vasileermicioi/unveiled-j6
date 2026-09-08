import type { Locale } from "./locale";

export type EventMapCopy = {
  eyebrow: string;
  title: string;
  listView: string;
  mapView: string;
  emptyMarkers: string;
  emptyFiltered: string;
  capWarning: (shown: number, total: number) => string;
  consentTitle: string;
  consentBody: string;
  consentPrivacy: string;
  externalMaps: string;
  loadError: string;
  popupOpen: string;
  attribution: string;
  mapAriaLabel: string;
};

const copyByLocale: Record<Locale, EventMapCopy> = {
  de: {
    eyebrow: "Entdecken",
    title: "Erlebnis-Karte",
    listView: "Listenansicht",
    mapView: "Kartenansicht",
    emptyMarkers: "Keine Erlebnisse mit Standort in diesem Filter.",
    emptyFiltered: "Keine Erlebnisse entsprechen diesen Filtern.",
    capWarning: (shown, total) =>
      `Karte zeigt die ersten ${shown} von ${total} Erlebnissen. Verfeinere die Filter für die vollständige Liste.`,
    consentTitle: "Karte benötigt Cookie-Zustimmung",
    consentBody:
      "Die interaktive Karte lädt Kartenkacheln von OpenStreetMap. Stimme nicht wesentlichen Cookies zu, um die Karte zu sehen — oder nutze die Adressliste unten.",
    consentPrivacy: "Datenschutz",
    externalMaps: "Auf OpenStreetMap öffnen",
    loadError: "Die Karte konnte nicht geladen werden.",
    popupOpen: "Erlebnis öffnen",
    attribution: "© OpenStreetMap contributors",
    mapAriaLabel: "Karte der gefilterten Erlebnisse",
  },
  en: {
    eyebrow: "Discover",
    title: "Experience map",
    listView: "List view",
    mapView: "Map view",
    emptyMarkers: "No experiences with a location match these filters.",
    emptyFiltered: "No experiences match these filters.",
    capWarning: (shown, total) =>
      `Map shows the first ${shown} of ${total} experiences. Narrow filters to see the full set on the map.`,
    consentTitle: "Map needs cookie consent",
    consentBody:
      "The interactive map loads tiles from OpenStreetMap. Accept non-essential cookies to view the map — or use the address list below.",
    consentPrivacy: "Privacy",
    externalMaps: "Open in OpenStreetMap",
    loadError: "The map could not be loaded.",
    popupOpen: "Open experience",
    attribution: "© OpenStreetMap contributors",
    mapAriaLabel: "Map of filtered experiences",
  },
};

export function getEventMapCopy(locale: Locale): EventMapCopy {
  return copyByLocale[locale];
}
