import type { Locale } from "./locale";

export type EventMapCopy = {
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
    title: "Event-Karte",
    listView: "Listenansicht",
    mapView: "Kartenansicht",
    emptyMarkers: "Keine Events mit Standort in diesem Filter.",
    emptyFiltered: "Keine Events in diesem Zeitraum gefunden.",
    capWarning: (shown, total) =>
      `Karte zeigt die ersten ${shown} von ${total} Events. Verfeinere die Filter für die vollständige Liste.`,
    consentTitle: "Karte benötigt Cookie-Zustimmung",
    consentBody:
      "Die interaktive Karte lädt Kartenkacheln von OpenStreetMap. Stimme nicht wesentlichen Cookies zu, um die Karte zu sehen — oder nutze die Adressliste unten.",
    consentPrivacy: "Datenschutz",
    externalMaps: "Auf OpenStreetMap öffnen",
    loadError: "Die Karte konnte nicht geladen werden.",
    popupOpen: "Event öffnen",
    attribution: "© OpenStreetMap contributors",
    mapAriaLabel: "Karte der gefilterten Events",
  },
  en: {
    title: "Event map",
    listView: "List view",
    mapView: "Map view",
    emptyMarkers: "No events with a location match these filters.",
    emptyFiltered: "No events found for this period.",
    capWarning: (shown, total) =>
      `Map shows the first ${shown} of ${total} events. Narrow filters to see the full set on the map.`,
    consentTitle: "Map needs cookie consent",
    consentBody:
      "The interactive map loads tiles from OpenStreetMap. Accept non-essential cookies to view the map — or use the address list below.",
    consentPrivacy: "Privacy",
    externalMaps: "Open in OpenStreetMap",
    loadError: "The map could not be loaded.",
    popupOpen: "Open event",
    attribution: "© OpenStreetMap contributors",
    mapAriaLabel: "Map of filtered events",
  },
};

export function getEventMapCopy(locale: Locale): EventMapCopy {
  return copyByLocale[locale];
}
