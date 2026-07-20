import type { Locale } from "./locale";

export type EventFeedCopy = {
  eyebrow: string;
  title: string;
  filtersTitle: string;
  categoryLabel: string;
  partnerLabel: string;
  from: string;
  to: string;
  reset: string;
  apply: string;
  noResults: string;
  allCategories: string;
  allPartners: string;
  dateRangeLabel: (from: string, to: string) => string;
  /** Shown when no custom from/to — all upcoming events. */
  upcomingScopeLabel: string;
  viewTabsLabel: string;
  listView: string;
  mapView: string;
  subscriptionGateTitle: string;
  subscriptionGateBody: string;
  subscriptionGateCta: string;
  bookingComingTitle: string;
  bookingComingBody: string;
  paginationShowing: (from: number, to: number, total: number) => string;
  paginationPrevious: string;
  paginationNext: string;
};

const copyByLocale: Record<Locale, EventFeedCopy> = {
  de: {
    eyebrow: "Entdecken",
    title: "Events",
    filtersTitle: "FILTERN",
    categoryLabel: "Kategorie",
    partnerLabel: "Partner",
    from: "VON",
    to: "BIS",
    reset: "ZURÜCKSETZEN",
    apply: "Anwenden",
    noResults: "KEINE EVENTS ENTSPRECHEN DIESEN FILTERN.",
    allCategories: "Alle Kategorien",
    allPartners: "Alle Partner",
    dateRangeLabel: (from, to) => (from === to ? `Zeitraum: ${from}` : `Zeitraum: ${from} – ${to}`),
    upcomingScopeLabel: "Alle kommenden Events",
    viewTabsLabel: "Ansicht",
    listView: "Liste",
    mapView: "Karte",
    subscriptionGateTitle: "Mitgliedschaft erforderlich",
    subscriptionGateBody:
      "Aktiviere dein Abo, um Events freizuschalten. Bis dahin kannst du weiter stöbern.",
    subscriptionGateCta: "Zur Mitgliedschaft",
    bookingComingTitle: "Buchung kommt bald",
    bookingComingBody:
      "Du hast ein aktives Abo. Die Ticketbuchung folgt in einem nächsten Schritt — öffne ein Event für Details.",
    paginationShowing: (from, to, total) => `${from}–${to} von ${total}`,
    paginationPrevious: "Zurück",
    paginationNext: "Weiter",
  },
  en: {
    eyebrow: "Discover",
    title: "Events",
    filtersTitle: "FILTERS",
    categoryLabel: "Category",
    partnerLabel: "Partner",
    from: "FROM",
    to: "UNTIL",
    reset: "RESET",
    apply: "Apply",
    noResults: "NO EVENTS MATCH THESE FILTERS.",
    allCategories: "All categories",
    allPartners: "All partners",
    dateRangeLabel: (from, to) => (from === to ? `Range: ${from}` : `Range: ${from} – ${to}`),
    upcomingScopeLabel: "All upcoming events",
    viewTabsLabel: "View",
    listView: "List",
    mapView: "Map",
    subscriptionGateTitle: "Membership required",
    subscriptionGateBody:
      "Activate your subscription to unlock events. You can keep browsing in the meantime.",
    subscriptionGateCta: "Go to membership",
    bookingComingTitle: "Booking coming soon",
    bookingComingBody:
      "Your subscription is active. Ticket booking arrives in a later step — open an event for details.",
    paginationShowing: (from, to, total) => `Showing ${from}–${to} of ${total}`,
    paginationPrevious: "Previous",
    paginationNext: "Next",
  },
};

export function getEventFeedCopy(locale: Locale): EventFeedCopy {
  return copyByLocale[locale];
}
