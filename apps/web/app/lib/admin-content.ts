import { AGE_GROUPS, EVENT_TYPES, INTERESTS, PREFERRED_LANGUAGES } from "@unveiled/auth/constants";
import type { CatalogErrorCode } from "@unveiled/db/catalog/errors";

import type { Locale } from "./locale";
import {
  getAgeGroupLabel,
  getInterestLabel,
  getPreferredLanguageLabel,
} from "./onboarding-content";

export const ADMIN_LIST_PAGE_SIZE = 25;
export const ADMIN_PARTNERS_PAGE_SIZE = ADMIN_LIST_PAGE_SIZE;

export type AdminCopy = {
  navDashboard: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  tabNavLabel: string;
  tabOverview: string;
  tabPartners: string;
  tabEvents: string;
  kpiPartners: string;
  kpiEvents: string;
  kpiUpcoming: string;
  kpiRemainingCapacity: string;
  kpiEventsHint: (upcoming: number) => string;
  kpiUpcomingHint: (total: number) => string;
  kpiRemainingHint: string;
  quickLinksTitle: string;
  partnersLink: string;
  eventsLink: string;
  seedDemo: string;
  seedSuccess: string;
  seedSkipped: string;
  partnersTitle: string;
  partnersSubtitle: string;
  newPartner: string;
  eventsTitle: string;
  eventsSubtitle: string;
  newEvent: string;
  newEventSeries: string;
  searchPlaceholder: string;
  searchSubmit: string;
  tableLogo: string;
  tableName: string;
  tableEmail: string;
  tableAddress: string;
  tableTitle: string;
  tablePartner: string;
  tableDate: string;
  tableCapacity: string;
  tableActions: string;
  editAction: string;
  deleteAction: string;
  exportCodesAction: string;
  emptyPartners: string;
  emptyEvents: string;
  paginationShowing: (from: number, to: number, total: number) => string;
  paginationPrevious: string;
  paginationNext: string;
  newPartnerTitle: string;
  editPartnerTitle: string;
  deletePartnerTitle: string;
  deletePartnerBody: (name: string) => string;
  newEventTitle: string;
  editEventTitle: string;
  newEventSeriesTitle: string;
  deleteEventTitle: string;
  deleteEventBody: (title: string, date: string) => string;
  deleteConfirm: string;
  cancel: string;
  save: string;
  create: string;
  previewSeries: string;
  confirmSeries: (count: number) => string;
  seriesPreviewTitle: string;
  nameLabel: string;
  emailLabel: string;
  addressLabel: string;
  logoFileLabel: string;
  logoUploadHint: string;
  logoUploadHintEdit: string;
  partnerLabel: string;
  titleLabel: string;
  descriptionLabel: string;
  neighborhoodLabel: string;
  categoryLabel: string;
  eventTypeLabel: string;
  tagsLabel: string;
  tagsHint: string;
  eventDateLabel: string;
  eventTimeLabel: string;
  timingModeLabel: string;
  timingModeTimeSlot: string;
  timingModeAllDay: string;
  creditPriceLabel: string;
  capacityLabel: string;
  ticketTypeLabel: string;
  ticketTypeSecretCode: string;
  ticketTypeVoucher: string;
  secretCodeModeLabel: string;
  secretCodeModeManual: string;
  secretCodeModeShared: string;
  secretCodeModeUnique: string;
  secretCodeLabel: string;
  promoCodeLabel: string;
  eventWebsiteUrlLabel: string;
  barrierFreeLabel: string;
  selectPlaceholder: string;
  optionYes: string;
  optionNo: string;
  languagesLabel: string;
  targetAgeGroupsLabel: string;
  mapLocationLabel: string;
  imageFileLabel: string;
  imageUploadHint: string;
  imageUploadHintEdit: string;
  chooseImageButton: string;
  imageSelectedLabel: (fileName: string) => string;
  imageStorageError: string;
  imagePlaceholderLabel: string;
  slotModeManual: string;
  slotModeBuilder: string;
  manualSlotsLabel: string;
  builderStartLabel: string;
  builderEndLabel: string;
  builderWeekdaysLabel: string;
  builderTimesLabel: string;
  builderTimesHint: string;
  builderTimeSlotLabel: (slot: number) => string;
  builderExcludedLabel: string;
  builderExcludedHint: string;
  weekdayLabels: string[];
  genericError: string;
  fieldErrors: {
    name: string;
    contactEmail: string;
    address: string;
    logo: string;
    image: string;
    partnerId: string;
    title: string;
    description: string;
    neighborhood: string;
    category: string;
    eventType: string;
    eventDate: string;
    redemption: string;
    series: string;
  };
};

const copy: Record<Locale, AdminCopy> = {
  de: {
    navDashboard: "Admin",
    dashboardTitle: "Admin-Dashboard",
    dashboardSubtitle: "Katalog-Kennzahlen und Demo-Daten.",
    tabNavLabel: "Admin-Bereiche",
    tabOverview: "Übersicht",
    tabPartners: "Partner",
    tabEvents: "Events",
    kpiPartners: "Partner",
    kpiEvents: "Events gesamt",
    kpiUpcoming: "Kommende Events",
    kpiRemainingCapacity: "Verbleibende Plätze",
    kpiEventsHint: (upcoming) => `${upcoming} kommend`,
    kpiUpcomingHint: (total) => `von ${total} gesamt`,
    kpiRemainingHint: "Offene Kapazität",
    quickLinksTitle: "Schnellzugriff",
    partnersLink: "Partner",
    eventsLink: "Events",
    seedDemo: "Demo-Daten laden",
    seedSuccess: "Demo-Daten wurden erstellt.",
    seedSkipped: "Demo-Daten wurden übersprungen — bereits vorhandene Einträge.",
    partnersTitle: "Partner",
    partnersSubtitle: "Venue-Datensätze für Events verwalten.",
    newPartner: "Neuer Partner",
    eventsTitle: "Events",
    eventsSubtitle: "Katalog-Events erstellen und verwalten.",
    newEvent: "Neues Event",
    newEventSeries: "Event-Serie",
    searchPlaceholder: "Titel oder Partner suchen",
    searchSubmit: "Suchen",
    tableLogo: "Bild",
    tableName: "Name",
    tableEmail: "E-Mail",
    tableAddress: "Adresse",
    tableTitle: "Titel",
    tablePartner: "Partner",
    tableDate: "Datum",
    tableCapacity: "Kapazität",
    tableActions: "Aktionen",
    editAction: "Bearbeiten",
    deleteAction: "Löschen",
    exportCodesAction: "Codes",
    emptyPartners: "Noch keine Partner vorhanden.",
    emptyEvents: "Noch keine Events vorhanden.",
    paginationShowing: (from, to, total) => `${from}–${to} von ${total}`,
    paginationPrevious: "Zurück",
    paginationNext: "Weiter",
    newPartnerTitle: "Partner anlegen",
    editPartnerTitle: "Partner bearbeiten",
    deletePartnerTitle: "Partner löschen",
    deletePartnerBody: (name) => `Partner „${name}" endgültig löschen?`,
    newEventTitle: "Event anlegen",
    editEventTitle: "Event bearbeiten",
    newEventSeriesTitle: "Event-Serie anlegen",
    deleteEventTitle: "Event löschen",
    deleteEventBody: (title, date) => `Event „${title}" (${date}) endgültig löschen?`,
    deleteConfirm: "Löschen",
    cancel: "Abbrechen",
    save: "Speichern",
    create: "Anlegen",
    previewSeries: "Slots anzeigen",
    confirmSeries: (count) => `${count} Events anlegen`,
    seriesPreviewTitle: "Vorschau der Slots",
    nameLabel: "Name",
    emailLabel: "Kontakt-E-Mail",
    addressLabel: "Adresse",
    logoFileLabel: "Logo hochladen",
    logoUploadHint: "Optional: JPEG, PNG oder WebP — min. 800×420 px, max. 8 MB.",
    logoUploadHintEdit:
      "Optional: neues Logo hochladen, um das aktuelle zu ersetzen — leer lassen, um es zu behalten.",
    partnerLabel: "Partner",
    titleLabel: "Titel",
    descriptionLabel: "Beschreibung",
    neighborhoodLabel: "Kiez",
    categoryLabel: "Kategorie",
    eventTypeLabel: "Event-Typ",
    tagsLabel: "Tags",
    tagsHint: "Kommagetrennt",
    eventDateLabel: "Datum",
    eventTimeLabel: "Uhrzeit",
    timingModeLabel: "Zeitmodus",
    timingModeTimeSlot: "Zeitfenster",
    timingModeAllDay: "Ganztägig",
    creditPriceLabel: "Credits",
    capacityLabel: "Kapazität",
    ticketTypeLabel: "Ticket-Typ",
    ticketTypeSecretCode: "Secret Code",
    ticketTypeVoucher: "Voucher",
    secretCodeModeLabel: "Code-Modus",
    secretCodeModeManual: "Manuell",
    secretCodeModeShared: "Geteilt (generiert)",
    secretCodeModeUnique: "Pro Buchung",
    secretCodeLabel: "Secret Code",
    promoCodeLabel: "Promo-Code",
    eventWebsiteUrlLabel: "Event-Website",
    barrierFreeLabel: "Barrierefrei",
    selectPlaceholder: "Auswählen…",
    optionYes: "Ja",
    optionNo: "Nein",
    languagesLabel: "Sprachen",
    targetAgeGroupsLabel: "Altersgruppen",
    mapLocationLabel: "Standort auf der Karte",
    imageFileLabel: "Event-Bild hochladen",
    imageUploadHint: "JPEG, PNG oder WebP — min. 800×420 px, max. 8 MB.",
    imageUploadHintEdit:
      "Optional: neues Bild hochladen, um das aktuelle zu ersetzen — leer lassen, um es zu behalten.",
    chooseImageButton: "Bild auswählen",
    imageSelectedLabel: (fileName) => `Ausgewählt: ${fileName}`,
    imageStorageError: "Bildspeicher ist nicht konfiguriert. Bitte Admin kontaktieren.",
    imagePlaceholderLabel: "Kein Bild",
    slotModeManual: "Manuelle Slots",
    slotModeBuilder: "Datumsbereich",
    manualSlotsLabel: "Datum/Uhrzeit pro Slot",
    builderStartLabel: "Startdatum",
    builderEndLabel: "Enddatum",
    builderWeekdaysLabel: "Wochentage",
    builderTimesLabel: "Uhrzeiten",
    builderTimesHint:
      "Bis zu drei Startzeiten pro ausgewähltem Wochentag. Leere Felder überspringen.",
    builderTimeSlotLabel: (slot) => `Uhrzeit ${slot}`,
    builderExcludedLabel: "Ausgeschlossene Daten",
    builderExcludedHint: "Kommagetrennt, YYYY-MM-DD",
    weekdayLabels: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    genericError: "Bitte Eingaben prüfen und erneut versuchen.",
    fieldErrors: {
      name: "Name ist erforderlich.",
      contactEmail: "Gültige E-Mail-Adresse erforderlich.",
      address: "Adresse ist erforderlich.",
      logo: "Logo-Upload und URL können nicht gleichzeitig gesetzt werden.",
      image: "Event-Bild ist erforderlich.",
      partnerId: "Partner ist erforderlich.",
      title: "Titel ist erforderlich.",
      description: "Beschreibung ist erforderlich.",
      neighborhood: "Kiez ist erforderlich.",
      category: "Kategorie ist erforderlich.",
      eventType: "Event-Typ ist erforderlich.",
      eventDate: "Datum ist erforderlich.",
      redemption: "Redemption-Konfiguration unvollständig.",
      series: "Mindestens ein gültiger Slot erforderlich.",
    },
  },
  en: {
    navDashboard: "Admin",
    dashboardTitle: "Admin dashboard",
    dashboardSubtitle: "Catalog metrics and demo data.",
    tabNavLabel: "Admin sections",
    tabOverview: "Overview",
    tabPartners: "Partners",
    tabEvents: "Events",
    kpiPartners: "Partners",
    kpiEvents: "Total events",
    kpiUpcoming: "Upcoming events",
    kpiRemainingCapacity: "Remaining seats",
    kpiEventsHint: (upcoming) => `${upcoming} upcoming`,
    kpiUpcomingHint: (total) => `of ${total} total`,
    kpiRemainingHint: "Open capacity",
    quickLinksTitle: "Quick links",
    partnersLink: "Partners",
    eventsLink: "Events",
    seedDemo: "Load demo data",
    seedSuccess: "Demo data created.",
    seedSkipped: "Demo seed skipped — data already exists.",
    partnersTitle: "Partners",
    partnersSubtitle: "Manage venue records for events.",
    newPartner: "New partner",
    eventsTitle: "Events",
    eventsSubtitle: "Create and manage catalog events.",
    newEvent: "New event",
    newEventSeries: "Event series",
    searchPlaceholder: "Search title or partner",
    searchSubmit: "Search",
    tableLogo: "Image",
    tableName: "Name",
    tableEmail: "Email",
    tableAddress: "Address",
    tableTitle: "Title",
    tablePartner: "Partner",
    tableDate: "Date",
    tableCapacity: "Capacity",
    tableActions: "Actions",
    editAction: "Edit",
    deleteAction: "Delete",
    exportCodesAction: "Codes",
    emptyPartners: "No partners yet.",
    emptyEvents: "No events yet.",
    paginationShowing: (from, to, total) => `Showing ${from}–${to} of ${total}`,
    paginationPrevious: "Previous",
    paginationNext: "Next",
    newPartnerTitle: "Create partner",
    editPartnerTitle: "Edit partner",
    deletePartnerTitle: "Delete partner",
    deletePartnerBody: (name) => `Permanently delete partner “${name}”?`,
    newEventTitle: "Create event",
    editEventTitle: "Edit event",
    newEventSeriesTitle: "Create event series",
    deleteEventTitle: "Delete event",
    deleteEventBody: (title, date) => `Permanently delete event “${title}” (${date})?`,
    deleteConfirm: "Delete",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    previewSeries: "Preview slots",
    confirmSeries: (count) => `Create ${count} events`,
    seriesPreviewTitle: "Slot preview",
    nameLabel: "Name",
    emailLabel: "Contact email",
    addressLabel: "Address",
    logoFileLabel: "Upload logo",
    logoUploadHint: "Optional: JPEG, PNG, or WebP — min 800×420 px, max 8 MB.",
    logoUploadHintEdit:
      "Optional: upload a new logo to replace the current one — leave empty to keep it.",
    partnerLabel: "Partner",
    titleLabel: "Title",
    descriptionLabel: "Description",
    neighborhoodLabel: "Neighborhood",
    categoryLabel: "Category",
    eventTypeLabel: "Event type",
    tagsLabel: "Tags",
    tagsHint: "Comma-separated",
    eventDateLabel: "Date",
    eventTimeLabel: "Time",
    timingModeLabel: "Timing mode",
    timingModeTimeSlot: "Time slot",
    timingModeAllDay: "All day",
    creditPriceLabel: "Credits",
    capacityLabel: "Capacity",
    ticketTypeLabel: "Ticket type",
    ticketTypeSecretCode: "Secret code",
    ticketTypeVoucher: "Voucher",
    secretCodeModeLabel: "Code mode",
    secretCodeModeManual: "Manual",
    secretCodeModeShared: "Shared generated",
    secretCodeModeUnique: "Unique per booking",
    secretCodeLabel: "Secret code",
    promoCodeLabel: "Promo code",
    eventWebsiteUrlLabel: "Event website",
    barrierFreeLabel: "Barrier-free",
    selectPlaceholder: "Select…",
    optionYes: "Yes",
    optionNo: "No",
    languagesLabel: "Languages",
    targetAgeGroupsLabel: "Age groups",
    mapLocationLabel: "Map location",
    imageFileLabel: "Upload event image",
    imageUploadHint: "JPEG, PNG, or WebP — min 800×420 px, max 8 MB.",
    imageUploadHintEdit:
      "Optional: upload a new file to replace the current image — leave empty to keep it.",
    chooseImageButton: "Choose image",
    imageSelectedLabel: (fileName) => `Selected: ${fileName}`,
    imageStorageError: "Image storage is not configured. Contact support.",
    imagePlaceholderLabel: "No image",
    slotModeManual: "Manual slots",
    slotModeBuilder: "Date range",
    manualSlotsLabel: "Date/time per slot",
    builderStartLabel: "Start date",
    builderEndLabel: "End date",
    builderWeekdaysLabel: "Weekdays",
    builderTimesLabel: "Times",
    builderTimesHint: "Up to three start times per selected weekday. Leave unused rows empty.",
    builderTimeSlotLabel: (slot) => `Time ${slot}`,
    builderExcludedLabel: "Excluded dates",
    builderExcludedHint: "Comma-separated, YYYY-MM-DD",
    weekdayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    genericError: "Please check your input and try again.",
    fieldErrors: {
      name: "Name is required.",
      contactEmail: "A valid email address is required.",
      address: "Address is required.",
      logo: "Logo upload and URL cannot both be provided.",
      image: "Event image is required.",
      partnerId: "Partner is required.",
      title: "Title is required.",
      description: "Description is required.",
      neighborhood: "Neighborhood is required.",
      category: "Category is required.",
      eventType: "Event type is required.",
      eventDate: "Date is required.",
      redemption: "Redemption configuration is incomplete.",
      series: "At least one valid slot is required.",
    },
  },
};

export function getAdminCopy(locale: Locale): AdminCopy {
  return copy[locale];
}

const catalogErrorMessages: Partial<Record<CatalogErrorCode, keyof AdminCopy["fieldErrors"]>> = {
  INVALID_EMAIL: "contactEmail",
  REQUIRED_FIELD: "name",
  CONFLICTING_IMAGE_SOURCES: "logo",
  MISSING_EVENT_IMAGE: "image",
  INVALID_REDEMPTION_CONFIG: "redemption",
  DUPLICATE_SERIES_SLOTS: "series",
  EMPTY_SERIES_SLOTS: "series",
  EVENT_NOT_FOUND: "title",
  PARTNER_HAS_EVENTS: "name",
  PARTNER_NOT_FOUND: "partnerId",
};

export function mapCatalogErrorCode(
  locale: Locale,
  code: CatalogErrorCode,
  field?: string,
): string {
  const adminCopy = getAdminCopy(locale);

  if (code === "REQUIRED_FIELD" && field) {
    if (field in adminCopy.fieldErrors) {
      return adminCopy.fieldErrors[field as keyof AdminCopy["fieldErrors"]];
    }
  }

  if (code === "INVALID_EMAIL") {
    return adminCopy.fieldErrors.contactEmail;
  }

  if (code === "CONFLICTING_IMAGE_SOURCES") {
    return adminCopy.fieldErrors.logo;
  }

  if (code === "MISSING_EVENT_IMAGE") {
    return adminCopy.fieldErrors.image;
  }

  if (code === "INVALID_REDEMPTION_CONFIG") {
    return adminCopy.fieldErrors.redemption;
  }

  if (code === "DUPLICATE_SERIES_SLOTS" || code === "EMPTY_SERIES_SLOTS") {
    return adminCopy.fieldErrors.series;
  }

  if (code === "EVENT_NOT_FOUND") {
    return locale === "de" ? "Event nicht gefunden." : "Event not found.";
  }

  if (code === "PARTNER_HAS_EVENTS") {
    return locale === "de"
      ? "Partner kann nicht gelöscht werden, solange Events existieren."
      : "Cannot delete a partner that still has events.";
  }

  if (code === "PARTNER_NOT_FOUND") {
    return locale === "de" ? "Partner nicht gefunden." : "Partner not found.";
  }

  const mappedField = catalogErrorMessages[code];
  if (mappedField) {
    return adminCopy.fieldErrors[mappedField] ?? adminCopy.genericError;
  }

  return adminCopy.genericError;
}

export type AdminSelectOption = {
  id: string;
  label: string;
};

export function getEventLanguageOptions(locale: Locale): AdminSelectOption[] {
  return PREFERRED_LANGUAGES.map((id) => ({
    id,
    label: getPreferredLanguageLabel(locale, id),
  }));
}

export function getEventAgeGroupOptions(locale: Locale): AdminSelectOption[] {
  return AGE_GROUPS.map((id) => ({
    id,
    label: getAgeGroupLabel(locale, id),
  }));
}

export function getEventCategoryOptions(locale: Locale): AdminSelectOption[] {
  return INTERESTS.map((id) => ({
    id,
    label: getInterestLabel(locale, id),
  }));
}

const eventTypeLabels: Record<Locale, Record<(typeof EVENT_TYPES)[number], string>> = {
  de: {
    Performance: "Performance",
    Concert: "Konzert",
    Tour: "Tour",
    Talk: "Talk",
    Workshop: "Workshop",
    Screening: "Vorführung",
    Reading: "Lesung",
    Other: "Sonstiges",
  },
  en: {
    Performance: "Performance",
    Concert: "Concert",
    Tour: "Tour",
    Talk: "Talk",
    Workshop: "Workshop",
    Screening: "Screening",
    Reading: "Reading",
    Other: "Other",
  },
};

export function getEventTypeOptions(locale: Locale): AdminSelectOption[] {
  return EVENT_TYPES.map((id) => ({
    id,
    label: eventTypeLabels[locale][id],
  }));
}
