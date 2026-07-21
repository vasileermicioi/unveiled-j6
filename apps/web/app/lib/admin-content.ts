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
  tabFeatured: string;
  tabUsers: string;
  tabWaitlist: string;
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
  emptyUsers: string;
  usersTitle: string;
  usersSubtitle: string;
  usersDetailTitle: string;
  usersSearchPlaceholder: string;
  usersRoleLabel: string;
  usersRoleAll: string;
  usersRoleUser: string;
  usersRoleAdmin: string;
  usersRolePartner: string;
  usersColRole: string;
  usersColSubscription: string;
  usersColCredits: string;
  usersColBookings: string;
  usersColEventOpens: string;
  usersViewAction: string;
  usersSectionSummary: string;
  usersSectionPreferences: string;
  usersSectionHistory: string;
  usersSectionBehavior: string;
  usersEmptyPreferences: string;
  usersEmptyBehavior: string;
  usersPrefInterests: string;
  usersPrefMoods: string;
  usersPrefDistricts: string;
  usersPrefTiming: string;
  usersPrefDays: string;
  usersPrefLanguages: string;
  usersPrefAgeGroup: string;
  usersPrefRadius: string;
  usersPrefAccessibility: string;
  usersHistoryBookings: string;
  usersHistoryWaitlist: string;
  usersHistorySaved: string;
  usersHistorySessions: string;
  usersBehaviorEventOpens: string;
  usersBehaviorFilterApplies: string;
  usersBehaviorSaves: string;
  usersBehaviorUnsaves: string;
  usersBehaviorLastView: string;
  usersBehaviorLastSeen: string;
  usersBehaviorLastBooked: string;
  usersBehaviorLastWaitlisted: string;
  usersBehaviorRecentEvents: string;
  usersAdjustCredits: string;
  usersFreeze: string;
  usersCompTicket: string;
  usersRefund: string;
  usersDeleteAccount: string;
  usersNoValue: string;
  usersSectionBookings: string;
  usersEmptyBookings: string;
  usersCancelBooking: string;
  adjustCreditsTitle: string;
  adjustCreditsBody: string;
  adjustCreditsAmountLabel: string;
  adjustCreditsReasonLabel: string;
  adjustCreditsSubmit: string;
  adjustCreditsSuccess: string;
  freezeTitle: string;
  freezeBody: (name: string) => string;
  unfreezeTitle: string;
  unfreezeBody: (name: string) => string;
  freezeSubmit: string;
  unfreezeSubmit: string;
  freezeUnavailable: string;
  freezeSuccess: string;
  unfreezeSuccess: string;
  refundTitle: string;
  refundBody: string;
  refundAmountLabel: string;
  refundReasonLabel: string;
  refundSubmit: string;
  refundSuccess: string;
  compTicketTitle: string;
  compTicketBody: string;
  compTicketEventLabel: string;
  compTicketTicketsLabel: string;
  compTicketSubmit: string;
  compTicketSuccess: string;
  compTicketNoEvents: string;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredEmpty: string;
  featuredAddAction: string;
  featuredAddTitle: string;
  featuredAddSubtitle: string;
  featuredAddEmpty: string;
  featuredAddSubmit: string;
  featuredRemoveAction: string;
  featuredRemoveTitle: string;
  featuredRemoveBody: (title: string, date: string) => string;
  featuredRemoveConfirm: string;
  waitlistTitle: string;
  waitlistSubtitle: string;
  waitlistEmpty: string;
  waitlistEventIdLabel: string;
  waitlistStatusLabel: string;
  waitlistStatusAll: string;
  waitlistStatusWaiting: string;
  waitlistStatusPromoted: string;
  waitlistStatusCancelled: string;
  waitlistColUser: string;
  waitlistColEvent: string;
  waitlistColStatus: string;
  waitlistColQty: string;
  waitlistColSkipped: string;
  waitlistColCreated: string;
  waitlistPromoteAction: string;
  waitlistPromoteTitle: string;
  waitlistPromoteBody: string;
  waitlistPromoteSubmit: string;
  waitlistPromoteSuccess: string;
  cancelBookingTitle: string;
  cancelBookingBody: (eventTitle: string) => string;
  cancelBookingReasonLabel: string;
  cancelBookingSubmit: string;
  cancelBookingSuccess: string;
  cancelBookingNotConfirmed: string;
  deleteAccountTitle: string;
  deleteAccountBody: (name: string) => string;
  deleteAccountSubmit: string;
  deleteAccountSuccess: string;
  adminOpsErrors: {
    USER_NOT_FOUND: string;
    ZERO_AMOUNT: string;
    INSUFFICIENT_CREDITS: string;
    INVALID_AMOUNT: string;
    INVALID_DESCRIPTION: string;
    BOOKING_NOT_FOUND: string;
    NOT_CONFIRMED: string;
    INVALID_REASON: string;
    EVENT_NOT_FOUND: string;
    SUBSCRIPTION_NOT_FOUND: string;
    INVALID_STATUS: string;
    SOLD_OUT: string;
    INELIGIBLE_SUBSCRIPTION: string;
    PAST_DUE: string;
    INVALID_TICKET_COUNT: string;
    WAITLIST_NOT_FOUND: string;
    WAITLIST_NOT_WAITING: string;
    WAITLIST_FORBIDDEN: string;
    WAITLIST_INVALID_QTY: string;
  };
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
  seriesConfirmImageHint: string;
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
  imageSectionLabel: string;
  imageFileLabel: string;
  imageUrlLabel: string;
  imageUrlPlaceholder: string;
  imageUrlHint: string;
  imageUrlProcessButton: string;
  imageUrlFetchError: string;
  imageUploadHint: string;
  imageUploadHintEdit: string;
  imageProcessingInProgress: string;
  imageProcessingError: string;
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
    dashboardSubtitle: "Katalog-Kennzahlen.",
    tabNavLabel: "Admin-Bereiche",
    tabOverview: "Übersicht",
    tabPartners: "Partner",
    tabEvents: "Events",
    tabFeatured: "Empfohlen",
    tabUsers: "Mitglieder",
    tabWaitlist: "Warteliste",
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
    emptyUsers: "Keine Mitglieder gefunden.",
    usersTitle: "Mitglieder",
    usersSubtitle: "Membership HQ — Mitglieder suchen und prüfen.",
    usersDetailTitle: "Mitglied",
    usersSearchPlaceholder: "Name oder E-Mail suchen",
    usersRoleLabel: "Rolle",
    usersRoleAll: "Alle Rollen",
    usersRoleUser: "USER",
    usersRoleAdmin: "ADMIN",
    usersRolePartner: "PARTNER",
    usersColRole: "Rolle",
    usersColSubscription: "Abo-Status",
    usersColCredits: "Credits",
    usersColBookings: "Buchungen",
    usersColEventOpens: "Event-Öffnungen",
    usersViewAction: "Öffnen",
    usersSectionSummary: "Übersicht",
    usersSectionPreferences: "Präferenzen",
    usersSectionHistory: "Verlauf",
    usersSectionBehavior: "Verhalten",
    usersEmptyPreferences: "Keine Präferenzen hinterlegt.",
    usersEmptyBehavior: "Keine Verhaltensdaten vorhanden.",
    usersPrefInterests: "Interessen",
    usersPrefMoods: "Stimmungen",
    usersPrefDistricts: "Bezirke",
    usersPrefTiming: "Tageszeit",
    usersPrefDays: "Wochentage",
    usersPrefLanguages: "Sprachen",
    usersPrefAgeGroup: "Altersgruppe",
    usersPrefRadius: "Radius",
    usersPrefAccessibility: "Barrierefreiheit",
    usersHistoryBookings: "Buchungen",
    usersHistoryWaitlist: "Warteliste",
    usersHistorySaved: "Gespeichert",
    usersHistorySessions: "Sitzungen",
    usersBehaviorEventOpens: "Event-Öffnungen",
    usersBehaviorFilterApplies: "Filter angewendet",
    usersBehaviorSaves: "Speichern",
    usersBehaviorUnsaves: "Entfernen",
    usersBehaviorLastView: "Zuletzt angesehen",
    usersBehaviorLastSeen: "Zuletzt aktiv",
    usersBehaviorLastBooked: "Zuletzt gebucht",
    usersBehaviorLastWaitlisted: "Zuletzt Warteliste",
    usersBehaviorRecentEvents: "Kürzlich angesehen",
    usersAdjustCredits: "Credits anpassen",
    usersFreeze: "Einfrieren / Auftauen",
    usersCompTicket: "Comp-Ticket",
    usersRefund: "Manuelle Erstattung",
    usersDeleteAccount: "Konto löschen",
    usersNoValue: "—",
    usersSectionBookings: "Bestätigte Buchungen",
    usersEmptyBookings: "Keine bestätigten Buchungen.",
    usersCancelBooking: "Stornieren",
    adjustCreditsTitle: "Credits anpassen",
    adjustCreditsBody: "Gutschrift oder Abzug (negative Zahl). Begründung erforderlich.",
    adjustCreditsAmountLabel: "Betrag (ganze Zahl)",
    adjustCreditsReasonLabel: "Begründung",
    adjustCreditsSubmit: "Credits anpassen",
    adjustCreditsSuccess: "Credits wurden angepasst.",
    freezeTitle: "Mitglied einfrieren",
    freezeBody: (name) =>
      `„${name}" einfrieren? Status wechselt von ACTIVE zu UNPAID (unabhängig von Stripe).`,
    unfreezeTitle: "Mitglied auftauen",
    unfreezeBody: (name) =>
      `„${name}" auftauen? Status wechselt von UNPAID zu ACTIVE (kein Stripe-Aufruf).`,
    freezeSubmit: "Einfrieren",
    unfreezeSubmit: "Auftauen",
    freezeUnavailable:
      "Einfrieren/Auftauen ist nur bei ACTIVE bzw. UNPAID möglich. Aktueller Status erlaubt die Aktion nicht.",
    freezeSuccess: "Mitglied wurde eingefroren.",
    unfreezeSuccess: "Mitglied wurde aufgetaut.",
    refundTitle: "Manuelle Erstattung",
    refundBody: "Positive Credits gutschreiben (REFUND-Ledger). Unabhängig von Buchungsstornos.",
    refundAmountLabel: "Betrag (positiv)",
    refundReasonLabel: "Begründung",
    refundSubmit: "Erstattung ausführen",
    refundSuccess: "Erstattung wurde verbucht.",
    compTicketTitle: "Comp-Ticket",
    compTicketBody:
      "Kostenlose bestätigte Buchung über den normalen Booking-Pfad (ohne Credit-Abbuchung).",
    compTicketEventLabel: "Event",
    compTicketTicketsLabel: "Tickets",
    compTicketSubmit: "Comp-Ticket ausstellen",
    compTicketSuccess: "Comp-Ticket wurde erstellt.",
    compTicketNoEvents: "Keine bevorstehenden Events für die Auswahl.",
    featuredTitle: "Empfohlene Events",
    featuredSubtitle: "Kuratiere die Featured-Liste für Discover.",
    featuredEmpty: "Noch keine empfohlenen Events. Füge Katalog-Events über die Suche hinzu.",
    featuredAddAction: "Event hinzufügen",
    featuredAddTitle: "Empfohlenes Event hinzufügen",
    featuredAddSubtitle: "Suche bestehende Katalog-Events, die noch nicht empfohlen sind.",
    featuredAddEmpty: "Keine passenden Events gefunden.",
    featuredAddSubmit: "Zur Featured-Liste",
    featuredRemoveAction: "Entfernen",
    featuredRemoveTitle: "Aus Featured entfernen",
    featuredRemoveBody: (title, date) =>
      `„${title}" (${date}) aus der Featured-Liste entfernen? Das Event bleibt im Katalog unter Events erhalten.`,
    featuredRemoveConfirm: "Aus Featured entfernen",
    waitlistTitle: "Warteliste",
    waitlistSubtitle: "Einträge filtern und manuell befördern.",
    waitlistEmpty: "Keine Wartelisteneinträge.",
    waitlistEventIdLabel: "Event-ID",
    waitlistStatusLabel: "Status",
    waitlistStatusAll: "Alle Status",
    waitlistStatusWaiting: "WAITING",
    waitlistStatusPromoted: "PROMOTED",
    waitlistStatusCancelled: "CANCELLED",
    waitlistColUser: "Nutzer-ID",
    waitlistColEvent: "Event-ID",
    waitlistColStatus: "Status",
    waitlistColQty: "Tickets",
    waitlistColSkipped: "Übersprungen",
    waitlistColCreated: "Erstellt",
    waitlistPromoteAction: "Befördern",
    waitlistPromoteTitle: "Warteliste befördern",
    waitlistPromoteBody:
      "Diesen Eintrag manuell befördern? Die Aktion kann die normale Warteschlangenreihenfolge überspringen.",
    waitlistPromoteSubmit: "Befördern",
    waitlistPromoteSuccess: "Eintrag wurde befördert.",
    cancelBookingTitle: "Buchung stornieren",
    cancelBookingBody: (eventTitle) =>
      `Buchung für „${eventTitle}" stornieren? Kapazität wird freigegeben und die Warteliste verarbeitet. Credits werden nicht erstattet.`,
    cancelBookingReasonLabel: "Begründung",
    cancelBookingSubmit: "Buchung stornieren",
    cancelBookingSuccess: "Buchung wurde storniert.",
    cancelBookingNotConfirmed: "Nur bestätigte Buchungen können storniert werden.",
    deleteAccountTitle: "Konto löschen",
    deleteAccountBody: (name) =>
      `Konto von „${name}" endgültig löschen? Name, E-Mail und Präferenzen werden anonymisiert. Buchungs- und Credit-Historie bleiben anonymisiert erhalten. Die Anmeldung wird deaktiviert. Ein aktives Abo wird mitgekündigt. Diese Aktion kann nicht rückgängig gemacht werden.`,
    deleteAccountSubmit: "Konto endgültig löschen",
    deleteAccountSuccess: "Mitgliedskonto wurde anonymisiert.",
    adminOpsErrors: {
      USER_NOT_FOUND: "Mitglied nicht gefunden.",
      ZERO_AMOUNT: "Betrag darf nicht null sein.",
      INSUFFICIENT_CREDITS: "Nicht genügend Credits.",
      INVALID_AMOUNT: "Ungültiger Betrag.",
      INVALID_DESCRIPTION: "Begründung ist erforderlich.",
      BOOKING_NOT_FOUND: "Buchung nicht gefunden.",
      NOT_CONFIRMED: "Nur bestätigte Buchungen können storniert werden.",
      INVALID_REASON: "Begründung ist erforderlich.",
      EVENT_NOT_FOUND: "Event nicht gefunden.",
      SUBSCRIPTION_NOT_FOUND: "Kein Abo für dieses Mitglied.",
      INVALID_STATUS: "Abo-Status erlaubt diese Aktion nicht.",
      SOLD_OUT: "Event ist ausverkauft.",
      INELIGIBLE_SUBSCRIPTION: "Mitglied ist nicht buchungsberechtigt.",
      PAST_DUE: "Mitglied hat überfälliges Abo.",
      INVALID_TICKET_COUNT: "Ungültige Ticketanzahl.",
      WAITLIST_NOT_FOUND: "Wartelisteneintrag nicht gefunden.",
      WAITLIST_NOT_WAITING: "Eintrag ist nicht im Status WAITING.",
      WAITLIST_FORBIDDEN: "Aktion für diesen Eintrag nicht erlaubt.",
      WAITLIST_INVALID_QTY: "Ungültige Ticketanzahl auf dem Eintrag.",
    },
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
    seriesConfirmImageHint:
      "Bitte das Event-Bild erneut auswählen — Dateien bleiben nach der Vorschau nicht erhalten.",
    nameLabel: "Name",
    emailLabel: "Kontakt-E-Mail",
    addressLabel: "Adresse",
    logoFileLabel: "Logo hochladen",
    logoUploadHint:
      "Optional: JPEG, PNG oder WebP — min. 800×420 px, max. 8 MB. Datei-Upload erfordert JavaScript.",
    logoUploadHintEdit:
      "Optional: neues Logo hochladen, um das aktuelle zu ersetzen — leer lassen, um es zu behalten. Datei-Upload erfordert JavaScript.",
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
    imageSectionLabel: "Event-Bild",
    imageFileLabel: "Event-Bild hochladen",
    imageUrlLabel: "Bild-URL",
    imageUrlPlaceholder: "https://…",
    imageUrlHint:
      "Statt Datei: öffentliche Bild-URL einfügen und „URL verarbeiten“ wählen. Nicht beides gleichzeitig. Erfordert JavaScript.",
    imageUrlProcessButton: "URL verarbeiten",
    imageUrlFetchError:
      "Bild-URL konnte nicht geladen werden. Bitte eine erreichbare JPEG/PNG/WebP-URL prüfen.",
    imageUploadHint:
      "JPEG, PNG oder WebP — min. 800×420 px, max. 8 MB. Datei oder URL. Bild-Upload erfordert JavaScript.",
    imageUploadHintEdit:
      "Optional: neues Bild per Datei oder URL ersetzen — leer lassen, um das aktuelle zu behalten. Erfordert JavaScript.",
    imageProcessingInProgress: "Bild wird verarbeitet…",
    imageProcessingError:
      "Bild konnte nicht verarbeitet werden. Bitte eine gültige Datei oder URL wählen (min. 800×420) und erneut versuchen.",
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
      image:
        "Event-Bild ist erforderlich. Bitte Datei oder URL mit JavaScript verarbeiten (Varianten).",
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
    dashboardSubtitle: "Catalog metrics.",
    tabNavLabel: "Admin sections",
    tabOverview: "Overview",
    tabPartners: "Partners",
    tabEvents: "Events",
    tabFeatured: "Featured",
    tabUsers: "Users",
    tabWaitlist: "Waitlist",
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
    emptyUsers: "No members found.",
    usersTitle: "Users",
    usersSubtitle: "Membership HQ — search and inspect members.",
    usersDetailTitle: "Member",
    usersSearchPlaceholder: "Search name or email",
    usersRoleLabel: "Role",
    usersRoleAll: "All roles",
    usersRoleUser: "USER",
    usersRoleAdmin: "ADMIN",
    usersRolePartner: "PARTNER",
    usersColRole: "Role",
    usersColSubscription: "Subscription",
    usersColCredits: "Credits",
    usersColBookings: "Bookings",
    usersColEventOpens: "Event opens",
    usersViewAction: "Open",
    usersSectionSummary: "Summary",
    usersSectionPreferences: "Preferences",
    usersSectionHistory: "History",
    usersSectionBehavior: "Behavior",
    usersEmptyPreferences: "No preferences on file.",
    usersEmptyBehavior: "No behavior analytics available.",
    usersPrefInterests: "Interests",
    usersPrefMoods: "Moods",
    usersPrefDistricts: "Districts",
    usersPrefTiming: "Timing",
    usersPrefDays: "Days",
    usersPrefLanguages: "Languages",
    usersPrefAgeGroup: "Age group",
    usersPrefRadius: "Radius",
    usersPrefAccessibility: "Accessibility",
    usersHistoryBookings: "Bookings",
    usersHistoryWaitlist: "Waitlist",
    usersHistorySaved: "Saved events",
    usersHistorySessions: "Sessions",
    usersBehaviorEventOpens: "Event opens",
    usersBehaviorFilterApplies: "Filter applies",
    usersBehaviorSaves: "Saves",
    usersBehaviorUnsaves: "Unsaves",
    usersBehaviorLastView: "Last view",
    usersBehaviorLastSeen: "Last seen",
    usersBehaviorLastBooked: "Last booked event",
    usersBehaviorLastWaitlisted: "Last waitlisted event",
    usersBehaviorRecentEvents: "Recently viewed",
    usersAdjustCredits: "Adjust credits",
    usersFreeze: "Freeze / unfreeze",
    usersCompTicket: "Comp ticket",
    usersRefund: "Manual refund",
    usersDeleteAccount: "Delete account",
    usersNoValue: "—",
    usersSectionBookings: "Confirmed bookings",
    usersEmptyBookings: "No confirmed bookings.",
    usersCancelBooking: "Cancel",
    adjustCreditsTitle: "Adjust credits",
    adjustCreditsBody: "Credit or debit (negative number). A reason is required.",
    adjustCreditsAmountLabel: "Amount (integer)",
    adjustCreditsReasonLabel: "Reason",
    adjustCreditsSubmit: "Adjust credits",
    adjustCreditsSuccess: "Credits were adjusted.",
    freezeTitle: "Freeze member",
    freezeBody: (name) =>
      `Freeze “${name}”? Status changes from ACTIVE to UNPAID (independent of Stripe).`,
    unfreezeTitle: "Unfreeze member",
    unfreezeBody: (name) =>
      `Unfreeze “${name}”? Status changes from UNPAID to ACTIVE (no Stripe call).`,
    freezeSubmit: "Freeze",
    unfreezeSubmit: "Unfreeze",
    freezeUnavailable:
      "Freeze/unfreeze is only available for ACTIVE or UNPAID. The current status does not allow this action.",
    freezeSuccess: "Member was frozen.",
    unfreezeSuccess: "Member was unfrozen.",
    refundTitle: "Manual refund",
    refundBody: "Add positive credits (REFUND ledger). Decoupled from booking cancellation.",
    refundAmountLabel: "Amount (positive)",
    refundReasonLabel: "Reason",
    refundSubmit: "Issue refund",
    refundSuccess: "Refund was recorded.",
    compTicketTitle: "Comp ticket",
    compTicketBody:
      "Complimentary confirmed booking via the shared booking path (no credit charge).",
    compTicketEventLabel: "Event",
    compTicketTicketsLabel: "Tickets",
    compTicketSubmit: "Issue comp ticket",
    compTicketSuccess: "Comp ticket was created.",
    compTicketNoEvents: "No upcoming events available to select.",
    featuredTitle: "Featured events",
    featuredSubtitle: "Curate the featured list shown on Discover.",
    featuredEmpty: "No featured events yet. Add catalog events via search.",
    featuredAddAction: "Add event",
    featuredAddTitle: "Add featured event",
    featuredAddSubtitle: "Search existing catalog events that are not already featured.",
    featuredAddEmpty: "No matching events found.",
    featuredAddSubmit: "Add to featured",
    featuredRemoveAction: "Remove",
    featuredRemoveTitle: "Remove from featured",
    featuredRemoveBody: (title, date) =>
      `Remove “${title}” (${date}) from the featured list? The event stays in the catalog under Events.`,
    featuredRemoveConfirm: "Remove from featured",
    waitlistTitle: "Waitlist",
    waitlistSubtitle: "Filter entries and promote manually.",
    waitlistEmpty: "No waitlist entries.",
    waitlistEventIdLabel: "Event ID",
    waitlistStatusLabel: "Status",
    waitlistStatusAll: "All statuses",
    waitlistStatusWaiting: "WAITING",
    waitlistStatusPromoted: "PROMOTED",
    waitlistStatusCancelled: "CANCELLED",
    waitlistColUser: "User ID",
    waitlistColEvent: "Event ID",
    waitlistColStatus: "Status",
    waitlistColQty: "Tickets",
    waitlistColSkipped: "Skipped",
    waitlistColCreated: "Created",
    waitlistPromoteAction: "Promote",
    waitlistPromoteTitle: "Promote waitlist entry",
    waitlistPromoteBody: "Manually promote this entry? This may skip normal queue order.",
    waitlistPromoteSubmit: "Promote",
    waitlistPromoteSuccess: "Entry was promoted.",
    cancelBookingTitle: "Cancel booking",
    cancelBookingBody: (eventTitle) =>
      `Cancel booking for “${eventTitle}”? Capacity is restored and the waitlist is processed. Credits are not refunded.`,
    cancelBookingReasonLabel: "Reason",
    cancelBookingSubmit: "Cancel booking",
    cancelBookingSuccess: "Booking was cancelled.",
    cancelBookingNotConfirmed: "Only confirmed bookings can be cancelled.",
    deleteAccountTitle: "Delete account",
    deleteAccountBody: (name) =>
      `Permanently delete “${name}”? Name, email, and preferences will be anonymized. Booking and credit history are retained in anonymized form. Login will be disabled. Any active subscription is cancelled. This cannot be undone.`,
    deleteAccountSubmit: "Permanently delete account",
    deleteAccountSuccess: "Member account was anonymized.",
    adminOpsErrors: {
      USER_NOT_FOUND: "Member not found.",
      ZERO_AMOUNT: "Amount must be non-zero.",
      INSUFFICIENT_CREDITS: "Insufficient credits.",
      INVALID_AMOUNT: "Invalid amount.",
      INVALID_DESCRIPTION: "A reason is required.",
      BOOKING_NOT_FOUND: "Booking not found.",
      NOT_CONFIRMED: "Only confirmed bookings can be cancelled.",
      INVALID_REASON: "A reason is required.",
      EVENT_NOT_FOUND: "Event not found.",
      SUBSCRIPTION_NOT_FOUND: "No subscription for this member.",
      INVALID_STATUS: "Subscription status does not allow this action.",
      SOLD_OUT: "Event is sold out.",
      INELIGIBLE_SUBSCRIPTION: "Member is not eligible to book.",
      PAST_DUE: "Member has a past-due subscription.",
      INVALID_TICKET_COUNT: "Invalid ticket count.",
      WAITLIST_NOT_FOUND: "Waitlist entry not found.",
      WAITLIST_NOT_WAITING: "Entry is not in WAITING status.",
      WAITLIST_FORBIDDEN: "Action not allowed for this entry.",
      WAITLIST_INVALID_QTY: "Invalid ticket quantity on the entry.",
    },
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
    seriesConfirmImageHint:
      "Please select the event image again — file uploads do not survive the preview step.",
    nameLabel: "Name",
    emailLabel: "Contact email",
    addressLabel: "Address",
    logoFileLabel: "Upload logo",
    logoUploadHint:
      "Optional: JPEG, PNG, or WebP — min 800×420 px, max 8 MB. File upload requires JavaScript.",
    logoUploadHintEdit:
      "Optional: upload a new logo to replace the current one — leave empty to keep it. File upload requires JavaScript.",
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
    imageSectionLabel: "Event image",
    imageFileLabel: "Upload event image",
    imageUrlLabel: "Image URL",
    imageUrlPlaceholder: "https://…",
    imageUrlHint:
      "Instead of a file: paste a public image URL and choose “Process URL”. Do not provide both. Requires JavaScript.",
    imageUrlProcessButton: "Process URL",
    imageUrlFetchError:
      "Could not fetch the image URL. Check that it is a reachable JPEG, PNG, or WebP URL.",
    imageUploadHint:
      "JPEG, PNG, or WebP — min 800×420 px, max 8 MB. File or URL. Image upload requires JavaScript.",
    imageUploadHintEdit:
      "Optional: replace the current image via file or URL — leave empty to keep it. Requires JavaScript.",
    imageProcessingInProgress: "Processing image…",
    imageProcessingError:
      "Could not process the image. Choose a valid file or URL (min 800×420) and try again.",
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
      image: "Event image is required. Process a file or URL with JavaScript (variants).",
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
  CLIENT_IMAGE_REQUIRED: "image",
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
    return locale === "de"
      ? "Bild-Upload (inkl. Varianten) und URL können nicht gleichzeitig gesetzt werden."
      : "Image upload (including variants) and URL cannot both be provided.";
  }

  if (code === "CLIENT_IMAGE_REQUIRED") {
    return locale === "de"
      ? "Bild-Varianten müssen im Browser erzeugt werden (Datei oder „URL verarbeiten“)."
      : "Image variants must be generated in the browser (file or “Process URL”).";
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

  if (code === "ALREADY_FEATURED") {
    return locale === "de"
      ? "Dieses Event ist bereits in der Featured-Liste."
      : "This event is already featured.";
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
