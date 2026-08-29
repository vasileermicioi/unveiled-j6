import { FEATURED_PREFERRED_LANGUAGES } from "@unveiled/auth/constants";
import {
  EVENT_CATEGORIES,
  EVENT_TYPES,
  getEventCategoryLabel,
  getEventTypeLabel,
  listIso6391LanguageCodes,
} from "@unveiled/db";
import type { CatalogErrorCode } from "@unveiled/db/catalog/errors";

import type { Locale } from "./locale";
import { getPreferredLanguageOptions } from "./onboarding-content";

export const ADMIN_LIST_PAGE_SIZE = 25;
export const ADMIN_PARTNERS_PAGE_SIZE = ADMIN_LIST_PAGE_SIZE;

export type AdminCopy = {
  navDashboard: string;
  /** Shared PageSectionHeader eyebrow for AdminPageShell (stable across pages). */
  pageEyebrow: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  tabNavLabel: string;
  tabOverview: string;
  tabPartners: string;
  tabEvents: string;
  tabBookings: string;
  tabFeatured: string;
  tabFeaturedPartners: string;
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
  searchPlaceholder: string;
  searchSubmit: string;
  partnersSearchPlaceholder: string;
  eventsTitleFilter: string;
  eventsPartnerFilter: string;
  eventsLanguageFilter: string;
  eventsLanguageAll: string;
  eventsPublishedFilter: string;
  eventsPublishedAll: string;
  statusPublished: string;
  statusDraft: string;
  publishAction: string;
  unpublishAction: string;
  previewAction: string;
  previewPageTitle: string;
  previewBanner: string;
  previewAudienceGuest: string;
  previewAudienceMember: string;
  previewSurfaceDetail: string;
  previewSurfaceBrowse: string;
  previewSurfaceDiscover: string;
  previewBrowseNote: string;
  previewOnlyCta: string;
  previewDocumentTitle: (title: string) => string;
  resetFilters: string;
  tableLogo: string;
  tableName: string;
  tableEmail: string;
  tableAddress: string;
  tableCreated: string;
  tableActiveEvents: string;
  tableTitle: string;
  tablePartner: string;
  tableDate: string;
  tableCapacity: string;
  tableLanguages: string;
  tableSubtitles: string;
  tableActions: string;
  editAction: string;
  cloneAction: string;
  deleteAction: string;
  exportAction: string;
  exportCodesAction: string;
  salesExportTitle: string;
  salesExportSubtitle: string;
  salesExportFromLabel: string;
  salesExportToLabel: string;
  salesExportTitleFilter: string;
  salesExportPartnerFilter: string;
  salesExportSubmit: string;
  salesExportTicketsSold: string;
  salesExportEmpty: string;
  salesExportCsvDownload: string;
  salesExportPeriodError: string;
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
  usersPrefInterestsOther: string;
  usersPrefMoods: string;
  usersPrefLocation: string;
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
  featuredRemoveBody: string;
  featuredRemoveConfirm: string;
  featuredReorderHint: string;
  featuredSaveOrderAction: string;
  featuredSelectLabel: (title: string) => string;
  featuredRemoveBulkAction: string;
  featuredPartnersTitle: string;
  featuredPartnersSubtitle: string;
  featuredPartnersEmpty: string;
  featuredPartnersAddAction: string;
  featuredPartnersAddTitle: string;
  featuredPartnersAddSubtitle: string;
  featuredPartnersAddEmpty: string;
  featuredPartnersAddSubmit: string;
  featuredPartnersReorderHint: string;
  featuredPartnersSaveOrderAction: string;
  featuredPartnersSelectLabel: (name: string) => string;
  featuredPartnersRemoveAction: string;
  featuredPartnersRemoveBulkAction: string;
  featuredPartnersRemoveTitle: string;
  featuredPartnersRemoveBody: string;
  featuredPartnersRemoveConfirm: string;
  galleryTitle: string;
  gallerySubtitle: (eventTitle: string) => string;
  galleryCapacity: (count: number) => string;
  galleryEmpty: string;
  galleryAddAction: string;
  galleryAddTitle: string;
  galleryAddSubtitle: string;
  galleryAddSubmit: string;
  galleryAddRequired: string;
  galleryManageAction: string;
  galleryRemoveAction: string;
  galleryRemoveBulkAction: string;
  galleryRemoveTitle: string;
  galleryRemoveBody: string;
  galleryRemoveConfirm: string;
  galleryRemoveSelectLabel: string;
  galleryRemoveSelectHint: string;
  galleryRemoveSelectionRequired: string;
  galleryPhotoLabel: (index: number) => string;
  gallerySelectLabel: (index: number) => string;
  galleryReorderHint: string;
  gallerySaveOrderAction: string;
  imageCreditLabel: string;
  imageCreditHint: string;
  gallerySelectedFilesLabel: (count: number) => string;
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
  bookingsIndexTitle: string;
  bookingsIndexSubtitle: string;
  eventBookingsTitle: string;
  eventBookingsAction: string;
  cancelAllAction: string;
  cancelAllTitle: string;
  cancelAllLead: string;
  cancelAllCatalogWarning: string;
  cancelAllSinglePathNote: string;
  cancelAllUsedNote: string;
  cancelAllReasonLabel: string;
  cancelAllSubmit: string;
  cancelAllEmpty: string;
  bookingsEmpty: string;
  bookingsIndexEmpty: string;
  colConfirmed: string;
  colUsed: string;
  colCancelled: string;
  colWaitlist: string;
  colCreditsCharged: string;
  statusFilterLabel: string;
  okCancelAll: string;
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
  cloneEventTitle: string;
  cloneEventSubtitle: string;
  cloneSubmit: string;
  cloneDateTimeHint: string;
  cloneInventoryHint: string;
  cloneSourceLabel: string;
  cloneSourceImageAlt: string;
  deleteEventTitle: string;
  deleteEventBody: (title: string, date: string) => string;
  deleteConfirm: string;
  publishEventTitle: string;
  publishEventBody: (title: string, date: string) => string;
  unpublishEventTitle: string;
  unpublishEventBody: (title: string) => string;
  publishFeaturedEventTitle: string;
  publishFeaturedEventBody: (title: string) => string;
  unpublishFeaturedEventTitle: string;
  unpublishFeaturedEventBody: (title: string) => string;
  publishFeaturedPartnerTitle: string;
  publishFeaturedPartnerBody: (name: string) => string;
  unpublishFeaturedPartnerTitle: string;
  unpublishFeaturedPartnerBody: (name: string) => string;
  publishConfirm: string;
  unpublishConfirm: string;
  okPublish: string;
  okUnpublish: string;
  featuredCatalogDraftNote: string;
  cancel: string;
  save: string;
  create: string;
  wizardStepGeneral: string;
  wizardStepDateTickets: string;
  wizardStepImage: string;
  wizardStepProgress: (current: number, total: number) => string;
  wizardNext: string;
  wizardBack: string;
  draftRestored: string;
  discardDraft: string;
  nameLabel: string;
  emailLabel: string;
  addressLabel: string;
  streetLabel: string;
  houseNumberLabel: string;
  addressLine2Label: string;
  logoFileLabel: string;
  logoUploadHint: string;
  logoUploadHintEdit: string;
  logoRequiredError: string;
  imageRequiredError: string;
  imageUndecodableError: string;
  imageWebpUnsupportedError: string;
  imageIncompleteVariantsError: string;
  imageProcessingSubmitBlocked: string;
  imageVariantGalleryLabel: string;
  imageVariantOpenLabel: (sizeLabel: string) => string;
  imageVariantPreviousLabel: string;
  imageVariantNextLabel: string;
  imageVariantCloseHint: string;
  partnerLabel: string;
  titleLabel: string;
  titleLabelDe: string;
  titleLabelEn: string;
  descriptionLabel: string;
  descriptionLabelDe: string;
  descriptionLabelEn: string;
  descriptionMarkdownHint: string;
  zipCodeLabel: string;
  zipCodeHint: string;
  countryLabel: string;
  countryDisplay: string;
  cityLabel: string;
  cityDisplay: string;
  openingHoursLabel: string;
  openingHoursHint: string;
  openingHoursClosedLabel: string;
  openingHoursOpenLabel: string;
  openingHoursCloseLabel: string;
  openingHoursDayLabels: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
  };
  categoryLabel: string;
  eventTypeLabel: string;
  tagsLabel: string;
  tagsHint: string;
  eventDateLabel: string;
  eventTimeLabel: string;
  eventDateTimesLabel: string;
  addDateTimeLabel: string;
  removeDateTimeLabel: string;
  dateTimesTotalCreditsLabel: (total: number) => string;
  rangeBuilderLabel: string;
  rangeTimeSlotsLabel: string;
  addTimeSlotLabel: string;
  rangeRebuildHint: string;
  rangeAllDayHint: string;
  rangeStartAfterEnd: string;
  tooManyOccurrences: string;
  timingModeLabel: string;
  timingModeTimeSlot: string;
  timingModeAllDay: string;
  creditPriceLabel: string;
  capacityLabel: string;
  capacityAllocationLabel: string;
  capacityAllocationShared: string;
  capacityAllocationPerDate: string;
  capacityAllocationSharedHint: string;
  capacityAllocationPerDateHint: string;
  dateTimesTotalCapacityLabel: (total: number) => string;
  dateTimesTotalInventoryLabel: (total: number) => string;
  ticketTypeLabel: string;
  ticketTypeSecretCode: string;
  ticketTypeVoucher: string;
  ticketTypeVoucherPdf: string;
  secretCodeLabel: string;
  eventWebsiteUrlLabel: string;
  promoCodesFileLabel: string;
  promoCodesFileHint: string;
  promoCodesPasteLabel: string;
  promoCodesPasteHint: string;
  promoCodesPreviewCount: (count: number) => string;
  promoCodesPreviewMore: (count: number) => string;
  promoCodesPreviewEmpty: string;
  voucherPdfModeLabel: string;
  voucherPdfModeSplit: string;
  voucherPdfModeFiles: string;
  voucherPdfModeSplitHint: string;
  voucherPdfModeFilesHint: string;
  voucherPdfFileLabel: string;
  voucherPdfFileHint: string;
  voucherPdfFilesLabel: string;
  voucherPdfFilesHint: string;
  voucherPdfFilesPreviewCount: (count: number) => string;
  voucherPdfSkipLabel: string;
  voucherPdfSkipHint: string;
  voucherPdfSkipPlaceholder: string;
  voucherPdfSkipInvalid: string;
  voucherPdfPagesPerTicketLabel: string;
  voucherPdfPageCount: (count: number) => string;
  voucherPdfPreviewCount: (count: number) => string;
  voucherPdfZeroTickets: string;
  voucherPdfLoadError: string;
  voucherPdfUploadError: string;
  voucherPdfRequired: string;
  voucherPdfBusy: string;
  voucherInventorySummary: (available: number, allocated: number) => string;
  replaceUnusedInventoryLabel: string;
  replaceUnusedInventoryHint: string;
  barrierFreeLabel: string;
  bankDetailsLabel: string;
  bankDetailsHint: string;
  languageIndependentLabel: string;
  languageIndependentHint: string;
  hasSubtitlesLabel: string;
  hasSubtitlesHint: string;
  subtitleLanguageLabel: string;
  subtitleLanguagesSearchPlaceholder: string;
  subtitleLanguagesSearchHint: string;
  selectPlaceholder: string;
  optionYes: string;
  optionNo: string;
  languagesLabel: string;
  languagesSearchPlaceholder: string;
  languagesSearchHint: string;
  mapLocationLabel: string;
  imageSectionLabel: string;
  imageFileLabel: string;
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
    street: string;
    houseNumber: string;
    logo: string;
    image: string;
    imageCredit: string;
    partnerId: string;
    title: string;
    titleDe: string;
    titleEn: string;
    description: string;
    descriptionDe: string;
    descriptionEn: string;
    zipCode: string;
    category: string;
    eventType: string;
    eventDate: string;
    dateTimes: string;
    creditPrice: string;
    redemption: string;
    series: string;
    subtitleLanguage: string;
    openingHours: string;
    bankDetails: string;
  };
};

const copy: Record<Locale, AdminCopy> = {
  de: {
    navDashboard: "Admin",
    pageEyebrow: "Verwaltung",
    dashboardTitle: "Admin-Dashboard",
    dashboardSubtitle: "Katalog-Kennzahlen.",
    tabNavLabel: "Admin-Bereiche",
    tabOverview: "Übersicht",
    tabPartners: "Partner",
    tabEvents: "Events",
    tabBookings: "Buchungen",
    tabFeatured: "Empfohlene Events",
    tabFeaturedPartners: "Empfohlene Partner",
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
    searchPlaceholder: "Titel oder Partner suchen",
    searchSubmit: "Suchen",
    partnersSearchPlaceholder: "Name",
    eventsTitleFilter: "Event-Titel",
    eventsPartnerFilter: "Partnername",
    eventsLanguageFilter: "Sprache",
    eventsLanguageAll: "Alle Sprachen",
    eventsPublishedFilter: "Status",
    eventsPublishedAll: "Alle",
    statusPublished: "Veröffentlicht",
    statusDraft: "Entwurf",
    publishAction: "Veröffentlichen",
    unpublishAction: "Veröffentlichung aufheben",
    previewAction: "Vorschau",
    previewPageTitle: "Vorschau",
    previewBanner: "Vorschau",
    previewAudienceGuest: "Gast",
    previewAudienceMember: "Mitglied",
    previewSurfaceDetail: "Detail",
    previewSurfaceBrowse: "Events entdecken",
    previewSurfaceDiscover: "Entdecken",
    previewBrowseNote: "Filter und Karte sind nicht Teil dieser Vorschau.",
    previewOnlyCta: "Nur Vorschau",
    previewDocumentTitle: (title) => `Vorschau: ${title}`,
    resetFilters: "Filter zurücksetzen",
    tableLogo: "Bild",
    tableName: "Name",
    tableEmail: "E-Mail",
    tableAddress: "Adresse",
    tableCreated: "Erstellt",
    tableActiveEvents: "Aktive Events",
    tableTitle: "Titel",
    tablePartner: "Partner",
    tableDate: "Datum",
    tableCapacity: "Kapazität",
    tableLanguages: "Sprachen",
    tableSubtitles: "Untertitel",
    tableActions: "Aktionen",
    editAction: "Bearbeiten",
    cloneAction: "Klonen",
    deleteAction: "Löschen",
    exportAction: "Export",
    exportCodesAction: "Codes",
    salesExportTitle: "Verkaufsexport",
    salesExportSubtitle:
      "Tickets verkauft pro Event für Buchungen, die im gewählten Zeitraum erstellt wurden.",
    salesExportFromLabel: "Von",
    salesExportToLabel: "Bis",
    salesExportTitleFilter: "Event-Titel",
    salesExportPartnerFilter: "Partnername",
    salesExportSubmit: "Anzeigen",
    salesExportTicketsSold: "Verkaufte Tickets",
    salesExportEmpty: "Keine Events vorhanden.",
    salesExportCsvDownload: "CSV herunterladen",
    salesExportPeriodError: "Bitte einen gültigen Zeitraum wählen (Von ≤ Bis, Format JJJJ-MM-TT).",
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
    usersPrefInterestsOther: "Sonstiges Interesse",
    usersPrefMoods: "Stimmungen",
    usersPrefLocation: "Standort",
    usersPrefTiming: "Tageszeit",
    usersPrefDays: "Wochentage",
    usersPrefLanguages: "Sprachen",
    usersPrefAgeGroup: "Altersgruppe",
    usersPrefRadius: "Reiseweite",
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
    featuredRemoveBody:
      "Ausgewählte Events aus der Featured-Liste entfernen? Die Events bleiben im Katalog unter Events erhalten.",
    featuredRemoveConfirm: "Aus Featured entfernen",
    featuredReorderHint:
      "Zum Sortieren ziehen, dann Reihenfolge speichern. Events auswählen, dann entfernen.",
    featuredSaveOrderAction: "Reihenfolge speichern",
    featuredSelectLabel: (title) => `„${title}" auswählen`,
    featuredRemoveBulkAction: "Auswahl entfernen",
    featuredPartnersTitle: "Empfohlene Partner",
    featuredPartnersSubtitle: "Kuratiere die Partnerorte-Liste für Discover.",
    featuredPartnersEmpty:
      "Noch keine empfohlenen Partner. Füge Katalog-Partner über die Suche hinzu.",
    featuredPartnersAddAction: "Partner hinzufügen",
    featuredPartnersAddTitle: "Empfohlenen Partner hinzufügen",
    featuredPartnersAddSubtitle: "Suche bestehende Katalog-Partner, die noch nicht empfohlen sind.",
    featuredPartnersAddEmpty: "Keine passenden Partner gefunden.",
    featuredPartnersAddSubmit: "Zur Featured-Liste",
    featuredPartnersReorderHint:
      "Zum Sortieren ziehen, dann Reihenfolge speichern. Partner auswählen, dann entfernen.",
    featuredPartnersSaveOrderAction: "Reihenfolge speichern",
    featuredPartnersSelectLabel: (name) => `„${name}" auswählen`,
    featuredPartnersRemoveAction: "Entfernen",
    featuredPartnersRemoveBulkAction: "Partner entfernen",
    featuredPartnersRemoveTitle: "Aus Featured entfernen",
    featuredPartnersRemoveBody:
      "Ausgewählte Partner aus der Featured-Liste entfernen? Die Partner bleiben im Katalog unter Partner erhalten.",
    featuredPartnersRemoveConfirm: "Aus Featured entfernen",
    galleryTitle: "Event-Galerie",
    gallerySubtitle: (eventTitle) => `Galerie-Fotos für „${eventTitle}"`,
    galleryCapacity: (count) => (count === 1 ? "1 Foto" : `${count} Fotos`),
    galleryEmpty: "Noch keine Galerie-Fotos. Lade mehrere Bilder auf einmal hoch.",
    galleryAddAction: "Fotos hinzufügen",
    galleryAddTitle: "Galerie-Fotos hinzufügen",
    galleryAddSubtitle: "Mehrere Dateien auswählen (Pica im Browser).",
    galleryAddSubmit: "Fotos speichern",
    galleryAddRequired: "Mindestens ein Bild mit fertigen Varianten ist erforderlich.",
    galleryManageAction: "Galerie-Fotos verwalten",
    galleryRemoveAction: "Entfernen",
    galleryRemoveBulkAction: "Fotos entfernen",
    galleryRemoveTitle: "Galerie-Fotos entfernen",
    galleryRemoveBody:
      "Ausgewählte Galerie-Fotos entfernen? Unreferenzierte Bilddateien werden gelöscht. Das Hero-Bild bleibt unverändert.",
    galleryRemoveConfirm: "Fotos entfernen",
    galleryRemoveSelectLabel: "Fotos auswählen",
    galleryRemoveSelectHint: "Mehrfachauswahl mit Strg/Cmd-Klick.",
    galleryRemoveSelectionRequired: "Wähle mindestens ein Foto zum Entfernen.",
    galleryPhotoLabel: (index) => `Foto ${index}`,
    gallerySelectLabel: (index) => `Foto ${index} auswählen`,
    galleryReorderHint:
      "Ziehen zum Sortieren, dann Reihenfolge speichern (speichert auch Bildnachweise). Auswählen, dann Fotos entfernen.",
    gallerySaveOrderAction: "Reihenfolge speichern",
    imageCreditLabel: "Bildnachweis",
    imageCreditHint: "z. B. Foto: Name",
    gallerySelectedFilesLabel: (count) => `${count} Dateien vorbereitet`,
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
    bookingsIndexTitle: "Buchungen nach Event",
    bookingsIndexSubtitle: "Bestätigte, genutzte und stornierte Buchungen pro Event.",
    eventBookingsTitle: "Buchungen",
    eventBookingsAction: "Buchungen",
    cancelAllAction: "Alle bestätigten Buchungen stornieren",
    cancelAllTitle: "Alle Buchungen stornieren",
    cancelAllLead:
      "Alle bestätigten Buchungen für dieses Event werden storniert. Berechnete Credits gehen an die Mitglieder zurück. Gutscheine kehren in den Pool zurück. Die Warteliste wird geschlossen und nicht befördert.",
    cancelAllCatalogWarning:
      "Das Event bleibt im Katalog und kann danach wieder gebucht werden, solange du es nicht löschst oder bearbeitest.",
    cancelAllSinglePathNote:
      "Eine einzelne Stornierung über „Stornieren“ erstattet keine Credits und kann die Warteliste befördern.",
    cancelAllUsedNote: "Bereits genutzte Tickets bleiben unverändert.",
    cancelAllReasonLabel: "Grund (erforderlich)",
    cancelAllSubmit: "Stornierung bestätigen",
    cancelAllEmpty: "Keine bestätigten Buchungen zum Stornieren.",
    bookingsEmpty: "Keine Buchungen für dieses Event.",
    bookingsIndexEmpty: "Keine Events mit Buchungen oder Warteliste.",
    colConfirmed: "Bestätigt",
    colUsed: "Genutzt",
    colCancelled: "Storniert",
    colWaitlist: "Warteliste",
    colCreditsCharged: "Credits",
    statusFilterLabel: "Status",
    okCancelAll: "Buchungen storniert. Credits und Gutscheine wurden zurückgegeben.",
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
    cloneEventTitle: "Event klonen",
    cloneEventSubtitle:
      "Metadaten und Bild werden übernommen. Neues Datum/Uhrzeit wählen; bei Voucher-Events neues Inventar hochladen.",
    cloneSubmit: "Klonen",
    cloneDateTimeHint:
      "Termine für das geklonte Event (Europe/Berlin). Liste bearbeiten, hinzufügen oder entfernen.",
    cloneInventoryHint:
      "Voucher-Inventar wird nicht kopiert. Bitte neues Inventar für den Klon bereitstellen.",
    cloneSourceLabel: "Quell-Event",
    cloneSourceImageAlt: "Bild des Quell-Events",
    deleteEventTitle: "Event löschen",
    deleteEventBody: (title, date) => `Event „${title}" (${date}) endgültig löschen?`,
    deleteConfirm: "Löschen",
    publishEventTitle: "Event veröffentlichen",
    publishEventBody: (title, date) =>
      `„${title}“ (${date}) veröffentlichen? Es erscheint danach auf Browse, wenn das Datum noch ansteht.`,
    unpublishEventTitle: "Veröffentlichung aufheben",
    unpublishEventBody: (title) =>
      `„${title}“ von Browse nehmen? Das Event bleibt im Katalog. Bestehende Buchungen bleiben.`,
    publishFeaturedEventTitle: "Empfohlenes Event veröffentlichen",
    publishFeaturedEventBody: (title) =>
      `„${title}“ auf Discover zeigen? Discover listet es nur, wenn auch das Katalog-Event veröffentlicht ist.`,
    unpublishFeaturedEventTitle: "Empfohlenes Event zurückziehen",
    unpublishFeaturedEventBody: (title) =>
      `„${title}“ von Discover nehmen? Die Featured-Mitgliedschaft und das Katalog-Event bleiben.`,
    publishFeaturedPartnerTitle: "Empfohlenen Partner veröffentlichen",
    publishFeaturedPartnerBody: (name) => `„${name}“ unter Partner venues auf Discover zeigen?`,
    unpublishFeaturedPartnerTitle: "Empfohlenen Partner zurückziehen",
    unpublishFeaturedPartnerBody: (name) =>
      `„${name}“ von Discover Partner venues nehmen? Der Partner bleibt im Katalog und auf der Featured-Liste.`,
    publishConfirm: "Veröffentlichen",
    unpublishConfirm: "Veröffentlichung aufheben",
    okPublish: "Veröffentlichung gespeichert.",
    okUnpublish: "Veröffentlichung aufgehoben.",
    featuredCatalogDraftNote:
      "Das Katalog-Event ist noch ein Entwurf. Discover zeigt die Karte erst, wenn beides veröffentlicht ist.",
    cancel: "Abbrechen",
    save: "Speichern",
    create: "Anlegen",
    wizardStepGeneral: "Allgemein",
    wizardStepDateTickets: "Datum & Tickets",
    wizardStepImage: "Bild",
    wizardStepProgress: (current, total) => `Schritt ${current} von ${total}`,
    wizardNext: "Weiter",
    wizardBack: "Zurück",
    draftRestored: "Nicht gespeicherter Entwurf wiederhergestellt",
    discardDraft: "Entwurf verwerfen",
    nameLabel: "Name",
    emailLabel: "Kontakt-E-Mail",
    addressLabel: "Adresse",
    streetLabel: "Straße",
    houseNumberLabel: "Hausnummer",
    addressLine2Label: "Adresszusatz (optional)",
    logoFileLabel: "Logo hochladen",
    logoUploadHint:
      "Erforderlich: beliebiges browser-lesbares Bild (inkl. SVG) — wird zu WebP-Varianten verarbeitet.",
    logoUploadHintEdit:
      "Neues Logo hochladen, um das aktuelle zu ersetzen — leer lassen, um es zu behalten. Logo kann nicht entfernt werden.",
    logoRequiredError: "Partner-Logo ist erforderlich. Bitte ein Bild hochladen.",
    imageRequiredError: "Event-Bild ist erforderlich. Bitte ein Bild hochladen und verarbeiten.",
    imageUndecodableError:
      "Diese Datei konnte nicht als Bild gelesen werden. Bitte eine andere Datei wählen.",
    imageWebpUnsupportedError:
      "WebP-Kodierung konnte in diesem Browser nicht geladen werden. Seite neu laden oder anderen Browser versuchen.",
    imageIncompleteVariantsError:
      "Bildvarianten sind unvollständig. Bitte die Datei erneut wählen und verarbeiten.",
    imageProcessingSubmitBlocked: "Bitte warten, bis die Bildverarbeitung abgeschlossen ist.",
    imageVariantGalleryLabel: "Größenvarianten",
    imageVariantOpenLabel: (sizeLabel) => `Variante ${sizeLabel} vergrößern`,
    imageVariantPreviousLabel: "Zurück",
    imageVariantNextLabel: "Weiter",
    imageVariantCloseHint: "Zum Schließen Esc drücken oder außerhalb klicken",
    partnerLabel: "Partner",
    titleLabel: "Titel",
    titleLabelDe: "Titel (DE)",
    titleLabelEn: "Titel (EN)",
    descriptionLabel: "Beschreibung",
    descriptionLabelDe: "Beschreibung (DE)",
    descriptionLabelEn: "Beschreibung (EN)",
    descriptionMarkdownHint:
      "Markdown wird unterstützt (Überschriften, Listen, Links, Hervorhebung).",
    zipCodeLabel: "PLZ",
    zipCodeHint: "Muss eine Berliner PLZ sein.",
    countryLabel: "Land",
    countryDisplay: "Deutschland",
    cityLabel: "Stadt",
    cityDisplay: "Berlin",
    openingHoursLabel: "Öffnungszeiten veröffentlichen",
    openingHoursHint:
      "Wenn aktiv, erscheinen die Zeiten auf der Event-Detailseite. Geschlossene Tage markieren oder Öffnungs- und Schlusszeit setzen.",
    openingHoursClosedLabel: "Geschlossen",
    openingHoursOpenLabel: "Öffnet",
    openingHoursCloseLabel: "Schließt",
    openingHoursDayLabels: {
      mon: "Montag",
      tue: "Dienstag",
      wed: "Mittwoch",
      thu: "Donnerstag",
      fri: "Freitag",
      sat: "Samstag",
      sun: "Sonntag",
    },
    categoryLabel: "Kategorie",
    eventTypeLabel: "Event-Typ",
    tagsLabel: "Tags",
    tagsHint: "Kommagetrennt",
    eventDateLabel: "Datum",
    eventTimeLabel: "Uhrzeit",
    eventDateTimesLabel: "Termine",
    addDateTimeLabel: "Termin hinzufügen",
    removeDateTimeLabel: "Entfernen",
    dateTimesTotalCreditsLabel: (total) => `Credits gesamt: ${total}`,
    dateTimesTotalCapacityLabel: (total) => `Kapazität gesamt: ${total}`,
    dateTimesTotalInventoryLabel: (total) => `Verfügbare Codes/Tickets: ${total}`,
    rangeBuilderLabel: "Aus Zeitraum erzeugen",
    rangeTimeSlotsLabel: "Zeitfenster",
    addTimeSlotLabel: "Zeitfenster hinzufügen",
    rangeRebuildHint:
      "Änderungen am Zeitraum oder an den Zeitfenstern erzeugen die Terminliste neu und verwerfen manuelles Hinzufügen/Entfernen.",
    rangeAllDayHint:
      "Ganztägige Termine nutzen Mitternacht. Credits vom ersten Slot gelten für jedes Datum.",
    rangeStartAfterEnd: "Das Enddatum muss am oder nach dem Startdatum liegen.",
    tooManyOccurrences:
      "Ein Zeitraum darf höchstens 52 Termine erzeugen. Zeitraum verkürzen oder ein Zeitfenster entfernen.",
    timingModeLabel: "Zeitmodus",
    timingModeTimeSlot: "Zeitfenster",
    timingModeAllDay: "Ganztägig",
    creditPriceLabel: "Credits",
    capacityLabel: "Kapazität",
    capacityAllocationLabel: "Kapazitätsverteilung",
    capacityAllocationShared: "Gemeinsam für alle Termine",
    capacityAllocationPerDate: "Pro Termin",
    capacityAllocationSharedHint: "Ein Kontingent für das gesamte Event.",
    capacityAllocationPerDateHint: "Jeder Termin startet mit dieser Kapazität; pro Zeile änderbar.",
    ticketTypeLabel: "Ticket-Typ",
    ticketTypeSecretCode: "Secret Code",
    ticketTypeVoucher: "Voucher (Promo)",
    ticketTypeVoucherPdf: "Voucher (PDF)",
    secretCodeLabel: "Secret Code",
    eventWebsiteUrlLabel: "Event-Website",
    promoCodesFileLabel: "Promo-Codes (TXT/CSV)",
    promoCodesFileHint: "Eine Code pro nicht-leerer Zeile. Kommas gehören zum Code.",
    promoCodesPasteLabel: "Oder Codes einfügen",
    promoCodesPasteHint: "Eine Code pro Zeile. Vorschau vor dem Speichern.",
    promoCodesPreviewCount: (count) => `${count} Codes bereit zum Speichern`,
    promoCodesPreviewMore: (count) => `… und ${count} weitere`,
    promoCodesPreviewEmpty: "Noch keine Codes — Datei wählen oder einfügen.",
    voucherPdfModeLabel: "PDF-Import",
    voucherPdfModeSplit: "Eine Datei aufteilen",
    voucherPdfModeFiles: "Mehrere Dateien (ein Ticket pro Datei)",
    voucherPdfModeSplitHint:
      "Ein Master-PDF wird clientseitig in Einzeltickets geschnitten und nach R2 hochgeladen.",
    voucherPdfModeFilesHint: "Jede ausgewählte PDF-Datei wird als eigenes Ticket gespeichert.",
    voucherPdfFileLabel: "Master-PDF",
    voucherPdfFileHint:
      "Ein PDF wird clientseitig in Einzeltickets geschnitten und nach R2 hochgeladen.",
    voucherPdfFilesLabel: "Ticket-PDFs",
    voucherPdfFilesHint: "Mehrere PDFs auswählen — jede Datei ist ein Ticket.",
    voucherPdfFilesPreviewCount: (count) => `${count} Tickets aus Dateien`,
    voucherPdfSkipLabel: "Seiten überspringen",
    voucherPdfSkipHint: "Kommagetrennt und mit Bereichen, z. B. 1-3,7,9-10.",
    voucherPdfSkipPlaceholder: "z. B. 1-3,7,9-10",
    voucherPdfSkipInvalid: "Ungültige Seitenangabe. Nutze z. B. 1-3,7,9-10.",
    voucherPdfPagesPerTicketLabel: "Seiten pro Ticket",
    voucherPdfPageCount: (count) => `${count} Seiten im PDF`,
    voucherPdfPreviewCount: (count) => `${count} Tickets aus der Aufteilung`,
    voucherPdfZeroTickets: "Mit dieser Aufteilung entstehen keine Tickets.",
    voucherPdfLoadError: "PDF konnte nicht geladen werden.",
    voucherPdfUploadError: "PDF-Upload fehlgeschlagen.",
    voucherPdfRequired: "Bitte ein PDF auswählen.",
    voucherPdfBusy: "PDF wird vorbereitet…",
    voucherInventorySummary: (available, allocated) =>
      `Inventar: ${available} verfügbar, ${allocated} zugewiesen`,
    replaceUnusedInventoryLabel: "Ungenutztes Inventar ersetzen",
    replaceUnusedInventoryHint:
      "Löscht nur AVAILABLE-Einträge und speichert die neue Liste. Zugewiesene bleiben.",
    barrierFreeLabel: "Barrierefrei",
    bankDetailsLabel: "Bankverbindung (optional)",
    bankDetailsHint: "Für künftige Buchhaltung (IBAN, Kontoinhaber usw.).",
    languageIndependentLabel: "Sprachunabhängig",
    languageIndependentHint:
      "Für Events ohne gesprochene Sprache (z. B. Kunstausstellungen, Installationen).",
    hasSubtitlesLabel: "Untertitel",
    hasSubtitlesHint:
      "Unabhängig von gesprochenen Sprachen. Eine oder mehrere Sprachen aus der vollständigen Liste wählen.",
    subtitleLanguageLabel: "Untertitelsprachen",
    subtitleLanguagesSearchPlaceholder: "Untertitelsprachen suchen",
    subtitleLanguagesSearchHint:
      "Nur häufige Sprachen sind angezeigt. Nutze die Suche, um weitere zu finden und auszuwählen.",
    selectPlaceholder: "Auswählen…",
    optionYes: "Ja",
    optionNo: "Nein",
    languagesLabel: "Sprachen",
    languagesSearchPlaceholder: "Sprachen suchen",
    languagesSearchHint:
      "Nur häufige Sprachen sind angezeigt. Nutze die Suche, um weitere zu finden und auszuwählen.",
    mapLocationLabel: "Karten-Vorschau",
    imageSectionLabel: "Event-Bild",
    imageFileLabel: "Event-Bild hochladen",
    imageUploadHint:
      "Erforderlich: beliebiges browser-lesbares Bild (inkl. SVG) — wird zu WebP-Varianten verarbeitet.",
    imageUploadHintEdit:
      "Optional: neues Bild per Datei ersetzen — leer lassen, um das aktuelle zu behalten.",
    imageProcessingInProgress: "Bild wird verarbeitet…",
    imageProcessingError:
      "Bild konnte nicht verarbeitet werden. Bitte eine gültige Datei wählen und erneut versuchen.",
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
      street: "Straße ist erforderlich.",
      houseNumber: "Hausnummer ist erforderlich.",
      logo: "Partner-Logo ist erforderlich. Bitte ein Bild hochladen.",
      image: "Event-Bild ist erforderlich. Bitte ein Bild hochladen.",
      imageCredit: "Bildnachweis darf höchstens 200 Zeichen haben.",
      partnerId: "Partner ist erforderlich.",
      title: "Titel ist erforderlich.",
      titleDe: "Deutscher Titel ist erforderlich.",
      titleEn: "Englischer Titel ist erforderlich.",
      description: "Beschreibung ist erforderlich.",
      descriptionDe: "Deutsche Beschreibung ist erforderlich.",
      descriptionEn: "Englische Beschreibung ist erforderlich.",
      zipCode: "Gültige Berliner PLZ ist erforderlich.",
      category: "Kategorie ist erforderlich.",
      eventType: "Event-Typ ist erforderlich.",
      eventDate: "Datum ist erforderlich.",
      dateTimes: "Mindestens ein Termin ist erforderlich.",
      creditPrice: "Credits müssen eine ganze Zahl ≥ 0 sein.",
      redemption: "Redemption-Konfiguration unvollständig.",
      series: "Mindestens ein gültiger Slot erforderlich.",
      subtitleLanguage:
        "Mindestens eine Untertitelsprache ist erforderlich und muss ein gültiger ISO-639-1-Sprachcode sein.",
      openingHours:
        "Öffnungszeiten ungültig. Jeden Tag als geschlossen markieren oder Öffnungszeit vor Schlusszeit setzen.",
      bankDetails: "Bankverbindung darf höchstens 2000 Zeichen haben.",
    },
  },
  en: {
    navDashboard: "Admin",
    pageEyebrow: "Admin",
    dashboardTitle: "Admin dashboard",
    dashboardSubtitle: "Catalog metrics.",
    tabNavLabel: "Admin sections",
    tabOverview: "Overview",
    tabPartners: "Partners",
    tabEvents: "Events",
    tabBookings: "Bookings",
    tabFeatured: "Featured events",
    tabFeaturedPartners: "Featured partners",
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
    searchPlaceholder: "Search title or partner",
    searchSubmit: "Search",
    partnersSearchPlaceholder: "Name",
    eventsTitleFilter: "Event title",
    eventsPartnerFilter: "Partner name",
    eventsLanguageFilter: "Language",
    eventsLanguageAll: "All languages",
    eventsPublishedFilter: "Status",
    eventsPublishedAll: "All",
    statusPublished: "Published",
    statusDraft: "Draft",
    publishAction: "Publish",
    unpublishAction: "Unpublish",
    previewAction: "Preview",
    previewPageTitle: "Preview",
    previewBanner: "Preview",
    previewAudienceGuest: "Guest",
    previewAudienceMember: "Member",
    previewSurfaceDetail: "Detail",
    previewSurfaceBrowse: "Browse events",
    previewSurfaceDiscover: "Discover",
    previewBrowseNote: "Filters and map are not part of this preview.",
    previewOnlyCta: "Preview only",
    previewDocumentTitle: (title) => `Preview: ${title}`,
    resetFilters: "Reset filters",
    tableLogo: "Image",
    tableName: "Name",
    tableEmail: "Email",
    tableAddress: "Address",
    tableCreated: "Created",
    tableActiveEvents: "Active events",
    tableTitle: "Title",
    tablePartner: "Partner",
    tableDate: "Date",
    tableCapacity: "Capacity",
    tableLanguages: "Languages",
    tableSubtitles: "Subtitles",
    tableActions: "Actions",
    editAction: "Edit",
    cloneAction: "Clone",
    deleteAction: "Delete",
    exportAction: "Export",
    exportCodesAction: "Codes",
    salesExportTitle: "Sales export",
    salesExportSubtitle: "Tickets sold per event for bookings created in the selected period.",
    salesExportFromLabel: "From",
    salesExportToLabel: "To",
    salesExportTitleFilter: "Event title",
    salesExportPartnerFilter: "Partner name",
    salesExportSubmit: "Show",
    salesExportTicketsSold: "Tickets sold",
    salesExportEmpty: "No events yet.",
    salesExportCsvDownload: "Download CSV",
    salesExportPeriodError: "Choose a valid period (From ≤ To, YYYY-MM-DD).",
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
    usersPrefInterestsOther: "Other interest",
    usersPrefMoods: "Moods",
    usersPrefLocation: "Location",
    usersPrefTiming: "Timing",
    usersPrefDays: "Days",
    usersPrefLanguages: "Languages",
    usersPrefAgeGroup: "Age group",
    usersPrefRadius: "Travel distance",
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
    featuredRemoveBody:
      "Remove the selected events from the featured list? The events stay in the catalog under Events.",
    featuredRemoveConfirm: "Remove from featured",
    featuredReorderHint: "Drag to reorder, then save order. Select events, then remove.",
    featuredSaveOrderAction: "Save order",
    featuredSelectLabel: (title) => `Select “${title}”`,
    featuredRemoveBulkAction: "Remove selected",
    featuredPartnersTitle: "Featured partners",
    featuredPartnersSubtitle: "Curate the Partner venues list shown on Discover.",
    featuredPartnersEmpty: "No featured partners yet. Add catalog partners via search.",
    featuredPartnersAddAction: "Add partner",
    featuredPartnersAddTitle: "Add featured partner",
    featuredPartnersAddSubtitle: "Search existing catalog partners that are not already featured.",
    featuredPartnersAddEmpty: "No matching partners found.",
    featuredPartnersAddSubmit: "Add to featured",
    featuredPartnersReorderHint: "Drag to reorder, then save order. Select partners, then remove.",
    featuredPartnersSaveOrderAction: "Save order",
    featuredPartnersSelectLabel: (name) => `Select “${name}”`,
    featuredPartnersRemoveAction: "Remove",
    featuredPartnersRemoveBulkAction: "Remove partners",
    featuredPartnersRemoveTitle: "Remove from featured",
    featuredPartnersRemoveBody:
      "Remove the selected partners from the featured list? The partners stay in the catalog under Partners.",
    featuredPartnersRemoveConfirm: "Remove from featured",
    galleryTitle: "Event gallery",
    gallerySubtitle: (eventTitle) => `Gallery photos for “${eventTitle}”`,
    galleryCapacity: (count) => (count === 1 ? "1 photo" : `${count} photos`),
    galleryEmpty: "No gallery photos yet. Upload multiple images at once.",
    galleryAddAction: "Add photos",
    galleryAddTitle: "Add gallery photos",
    galleryAddSubtitle: "Select multiple files (Pica in the browser).",
    galleryAddSubmit: "Save photos",
    galleryAddRequired: "At least one image with ready variants is required.",
    galleryManageAction: "Manage gallery photos",
    galleryRemoveAction: "Remove",
    galleryRemoveBulkAction: "Remove photos",
    galleryRemoveTitle: "Remove gallery photos",
    galleryRemoveBody:
      "Remove the selected gallery photos? Unreferenced image files will be deleted. The hero image is unchanged.",
    galleryRemoveConfirm: "Remove photos",
    galleryRemoveSelectLabel: "Select photos",
    galleryRemoveSelectHint: "Multi-select with Ctrl/Cmd-click.",
    galleryRemoveSelectionRequired: "Select at least one photo to remove.",
    galleryPhotoLabel: (index) => `Photo ${index}`,
    gallerySelectLabel: (index) => `Select photo ${index}`,
    galleryReorderHint:
      "Drag to reorder, then save order (also saves image credits). Select photos, then remove.",
    gallerySaveOrderAction: "Save order",
    imageCreditLabel: "Image credit",
    imageCreditHint: "e.g. Photo: Name",
    gallerySelectedFilesLabel: (count) => `${count} files ready`,
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
    bookingsIndexTitle: "Bookings by event",
    bookingsIndexSubtitle: "Confirmed, used, and cancelled bookings per event.",
    eventBookingsTitle: "Bookings",
    eventBookingsAction: "Bookings",
    cancelAllAction: "Cancel all confirmed bookings",
    cancelAllTitle: "Cancel all bookings",
    cancelAllLead:
      "All confirmed bookings for this event will be cancelled. Charged credits return to members. Vouchers return to the pool. The waitlist is closed and will not be promoted.",
    cancelAllCatalogWarning:
      "The event stays in the catalog and can be booked again unless you delete or edit it.",
    cancelAllSinglePathNote:
      "Cancelling a single booking does not refund credits and may promote the waitlist.",
    cancelAllUsedNote: "Already used tickets are left unchanged.",
    cancelAllReasonLabel: "Reason (required)",
    cancelAllSubmit: "Confirm cancellation",
    cancelAllEmpty: "No confirmed bookings to cancel.",
    bookingsEmpty: "No bookings for this event.",
    bookingsIndexEmpty: "No events with bookings or waitlist.",
    colConfirmed: "Confirmed",
    colUsed: "Used",
    colCancelled: "Cancelled",
    colWaitlist: "Waitlist",
    colCreditsCharged: "Credits",
    statusFilterLabel: "Status",
    okCancelAll: "Bookings cancelled. Credits and vouchers were returned.",
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
    cloneEventTitle: "Clone event",
    cloneEventSubtitle:
      "Metadata and image are copied. Set a new date/time; for voucher events upload new inventory.",
    cloneSubmit: "Clone",
    cloneDateTimeHint:
      "Date and times for the cloned event (Europe/Berlin). Edit, add, or remove rows in the list.",
    cloneInventoryHint: "Voucher inventory is not copied. Provide new inventory for the clone.",
    cloneSourceLabel: "Source event",
    cloneSourceImageAlt: "Source event image",
    deleteEventTitle: "Delete event",
    deleteEventBody: (title, date) => `Permanently delete event “${title}” (${date})?`,
    deleteConfirm: "Delete",
    publishEventTitle: "Publish event",
    publishEventBody: (title, date) =>
      `Publish “${title}” (${date})? It will appear on Browse when the date is still upcoming.`,
    unpublishEventTitle: "Unpublish event",
    unpublishEventBody: (title) =>
      `Unpublish “${title}” from Browse? The event stays in the catalog. Existing bookings stay.`,
    publishFeaturedEventTitle: "Publish featured event",
    publishFeaturedEventBody: (title) =>
      `Show “${title}” on Discover? Discover lists it only when the catalog event is also published.`,
    unpublishFeaturedEventTitle: "Unpublish featured event",
    unpublishFeaturedEventBody: (title) =>
      `Remove “${title}” from Discover? Featured membership and the catalog event stay.`,
    publishFeaturedPartnerTitle: "Publish featured partner",
    publishFeaturedPartnerBody: (name) => `Show “${name}” under Partner venues on Discover?`,
    unpublishFeaturedPartnerTitle: "Unpublish featured partner",
    unpublishFeaturedPartnerBody: (name) =>
      `Remove “${name}” from Discover Partner venues? The partner stays in the catalog and on the featured list.`,
    publishConfirm: "Publish",
    unpublishConfirm: "Unpublish",
    okPublish: "Publish status saved.",
    okUnpublish: "Unpublished.",
    featuredCatalogDraftNote:
      "The catalog event is still a draft. Discover shows the card only when both are published.",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    wizardStepGeneral: "General",
    wizardStepDateTickets: "Date & tickets",
    wizardStepImage: "Image",
    wizardStepProgress: (current, total) => `Step ${current} of ${total}`,
    wizardNext: "Next",
    wizardBack: "Back",
    draftRestored: "Unsaved draft restored",
    discardDraft: "Discard draft",
    nameLabel: "Name",
    emailLabel: "Contact email",
    addressLabel: "Address",
    streetLabel: "Street",
    houseNumberLabel: "House number",
    addressLine2Label: "Address line 2 (optional)",
    logoFileLabel: "Upload logo",
    logoUploadHint:
      "Required: any browser-decodable image (including SVG) — processed into WebP variants.",
    logoUploadHintEdit:
      "Upload a new logo to replace the current one — leave empty to keep it. The logo cannot be removed.",
    logoRequiredError: "Partner logo is required. Please upload an image.",
    imageRequiredError: "Event image is required. Please upload and process an image.",
    imageUndecodableError:
      "This file could not be read as an image. Please choose a different file.",
    imageWebpUnsupportedError:
      "WebP encoding failed to load in this browser. Reload the page or try another browser.",
    imageIncompleteVariantsError:
      "Image variants are incomplete. Please re-select the file and process again.",
    imageProcessingSubmitBlocked: "Please wait until image processing finishes.",
    imageVariantGalleryLabel: "Size variants",
    imageVariantOpenLabel: (sizeLabel) => `Enlarge ${sizeLabel} variant`,
    imageVariantPreviousLabel: "Prev",
    imageVariantNextLabel: "Next",
    imageVariantCloseHint: "Press Escape or click outside to close",
    partnerLabel: "Partner",
    titleLabel: "Title",
    titleLabelDe: "Title (DE)",
    titleLabelEn: "Title (EN)",
    descriptionLabel: "Description",
    descriptionLabelDe: "Description (DE)",
    descriptionLabelEn: "Description (EN)",
    descriptionMarkdownHint: "Markdown is supported (headings, lists, links, emphasis).",
    zipCodeLabel: "Zip code",
    zipCodeHint: "Must be a Berlin zip code.",
    countryLabel: "Country",
    countryDisplay: "Germany",
    cityLabel: "City",
    cityDisplay: "Berlin",
    openingHoursLabel: "Publish opening hours",
    openingHoursHint:
      "When enabled, hours appear on the event detail page. Mark days closed or set open and close times.",
    openingHoursClosedLabel: "Closed",
    openingHoursOpenLabel: "Opens",
    openingHoursCloseLabel: "Closes",
    openingHoursDayLabels: {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    },
    categoryLabel: "Category",
    eventTypeLabel: "Event type",
    tagsLabel: "Tags",
    tagsHint: "Comma-separated",
    eventDateLabel: "Date",
    eventTimeLabel: "Time",
    eventDateTimesLabel: "Date & times",
    addDateTimeLabel: "Add datetime",
    removeDateTimeLabel: "Remove",
    dateTimesTotalCreditsLabel: (total) => `Total credits: ${total}`,
    dateTimesTotalCapacityLabel: (total) => `Total capacity: ${total}`,
    dateTimesTotalInventoryLabel: (total) => `Available codes/tickets: ${total}`,
    rangeBuilderLabel: "Generate from date range",
    rangeTimeSlotsLabel: "Time slots",
    addTimeSlotLabel: "Add time slot",
    rangeRebuildHint:
      "Changing the range or time slots rebuilds the datetime list and discards manual add/remove.",
    rangeAllDayHint: "All-day dates use midnight. Credits from the first slot apply to each date.",
    rangeStartAfterEnd: "End date must be on or after start date.",
    tooManyOccurrences:
      "A range can create at most 52 datetimes. Narrow the dates or remove a time slot.",
    timingModeLabel: "Timing mode",
    timingModeTimeSlot: "Time slot",
    timingModeAllDay: "All day",
    creditPriceLabel: "Credits",
    capacityLabel: "Capacity",
    capacityAllocationLabel: "Capacity allocation",
    capacityAllocationShared: "Shared across all dates",
    capacityAllocationPerDate: "Per date",
    capacityAllocationSharedHint: "One ticket pool for the whole event.",
    capacityAllocationPerDateHint:
      "Each date starts with this capacity; you can change it per row.",
    ticketTypeLabel: "Ticket type",
    ticketTypeSecretCode: "Secret code",
    ticketTypeVoucher: "Voucher (promo)",
    ticketTypeVoucherPdf: "Voucher (PDF)",
    secretCodeLabel: "Secret code",
    eventWebsiteUrlLabel: "Event website",
    promoCodesFileLabel: "Promo codes (TXT/CSV)",
    promoCodesFileHint: "One code per non-empty line. Commas are part of the code.",
    promoCodesPasteLabel: "Or paste codes",
    promoCodesPasteHint: "One code per line. Preview before save.",
    promoCodesPreviewCount: (count) => `${count} codes ready to save`,
    promoCodesPreviewMore: (count) => `… and ${count} more`,
    promoCodesPreviewEmpty: "No codes yet — choose a file or paste.",
    voucherPdfModeLabel: "PDF import",
    voucherPdfModeSplit: "Split one file",
    voucherPdfModeFiles: "Multiple files (one ticket each)",
    voucherPdfModeSplitHint:
      "One master PDF is sliced into per-ticket files in the browser, then uploaded to R2.",
    voucherPdfModeFilesHint: "Each selected PDF file is stored as its own ticket.",
    voucherPdfFileLabel: "Master PDF",
    voucherPdfFileHint:
      "One PDF is sliced into per-ticket files in the browser, then uploaded to R2.",
    voucherPdfFilesLabel: "Ticket PDFs",
    voucherPdfFilesHint: "Select multiple PDFs — each file is one ticket.",
    voucherPdfFilesPreviewCount: (count) => `${count} tickets from files`,
    voucherPdfSkipLabel: "Pages to skip",
    voucherPdfSkipHint: "Comma-separated pages and ranges, e.g. 1-3,7,9-10.",
    voucherPdfSkipPlaceholder: "e.g. 1-3,7,9-10",
    voucherPdfSkipInvalid: "Invalid pages to skip. Use e.g. 1-3,7,9-10.",
    voucherPdfPagesPerTicketLabel: "Pages per ticket",
    voucherPdfPageCount: (count) => `${count} pages in PDF`,
    voucherPdfPreviewCount: (count) => `${count} tickets from this split`,
    voucherPdfZeroTickets: "This split produces zero tickets.",
    voucherPdfLoadError: "Could not load the PDF.",
    voucherPdfUploadError: "PDF upload failed.",
    voucherPdfRequired: "Please choose a PDF.",
    voucherPdfBusy: "Preparing PDF…",
    voucherInventorySummary: (available, allocated) =>
      `Inventory: ${available} available, ${allocated} allocated`,
    replaceUnusedInventoryLabel: "Replace unused inventory",
    replaceUnusedInventoryHint:
      "Deletes only AVAILABLE rows, then saves the new list. Allocated rows stay.",
    barrierFreeLabel: "Barrier-free",
    bankDetailsLabel: "Bank details (optional)",
    bankDetailsHint: "For future accounting (IBAN, account holder, etc.).",
    languageIndependentLabel: "Language-independent",
    languageIndependentHint:
      "For events with no spoken-language requirement (e.g. art exhibitions, installations).",
    hasSubtitlesLabel: "Subtitles",
    hasSubtitlesHint:
      "Independent of spoken languages. Choose one or more languages from the full list.",
    subtitleLanguageLabel: "Subtitle languages",
    subtitleLanguagesSearchPlaceholder: "Search subtitle languages",
    subtitleLanguagesSearchHint:
      "Only common languages are shown. Use search to find and select others.",
    selectPlaceholder: "Select…",
    optionYes: "Yes",
    optionNo: "No",
    languagesLabel: "Languages",
    languagesSearchPlaceholder: "Search languages",
    languagesSearchHint: "Only common languages are shown. Use search to find and select others.",
    mapLocationLabel: "Map preview",
    imageSectionLabel: "Event image",
    imageFileLabel: "Upload event image",
    imageUploadHint:
      "Required: any browser-decodable image (including SVG) — processed into WebP variants.",
    imageUploadHintEdit: "Optional: replace the current image via file — leave empty to keep it.",
    imageProcessingInProgress: "Processing image…",
    imageProcessingError: "Could not process the image. Choose a valid file and try again.",
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
      street: "Street is required.",
      houseNumber: "House number is required.",
      logo: "Partner logo is required. Please upload an image.",
      image: "Event image is required. Please upload an image.",
      imageCredit: "Image credit must be 200 characters or fewer.",
      partnerId: "Partner is required.",
      title: "Title is required.",
      titleDe: "German title is required.",
      titleEn: "English title is required.",
      description: "Description is required.",
      descriptionDe: "German description is required.",
      descriptionEn: "English description is required.",
      zipCode: "A valid Berlin zip code is required.",
      category: "Category is required.",
      eventType: "Event type is required.",
      eventDate: "Date is required.",
      dateTimes: "At least one datetime is required.",
      creditPrice: "Credits must be a whole number ≥ 0.",
      redemption: "Redemption configuration is incomplete.",
      series: "At least one valid slot is required.",
      subtitleLanguage:
        "At least one subtitle language is required and must be a valid ISO 639-1 language code.",
      openingHours:
        "Opening hours are invalid. Mark each day closed or set open time before close time.",
      bankDetails: "Bank details must be 2000 characters or fewer.",
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
  CONFLICTING_IMAGE_SOURCES: "image",
  MISSING_EVENT_IMAGE: "image",
  IMAGE_NOT_FOUND: "image",
  IMAGE_CREDIT_TOO_LONG: "imageCredit",
  INVALID_REDEMPTION_CONFIG: "redemption",
  EMPTY_VOUCHER_INVENTORY: "redemption",
  DUPLICATE_VOUCHER_CODE: "redemption",
  DUPLICATE_SERIES_SLOTS: "series",
  EMPTY_SERIES_SLOTS: "series",
  EMPTY_DATE_TIMES: "dateTimes",
  NEGATIVE_CREDIT_PRICE: "creditPrice",
  DUPLICATE_OCCURRENCE_INSTANTS: "dateTimes",
  INVALID_SUBTITLE_LANGUAGE: "subtitleLanguage",
  INVALID_EVENT_CATEGORY: "category",
  INVALID_EVENT_TYPE: "eventType",
  INVALID_OPENING_HOURS: "openingHours",
  BANK_DETAILS_TOO_LONG: "bankDetails",
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
      ? "Bild-Varianten müssen im Browser aus der hochgeladenen Datei erzeugt werden."
      : "Image variants must be generated in the browser from the uploaded file.";
  }

  if (code === "MISSING_EVENT_IMAGE" || code === "IMAGE_NOT_FOUND") {
    return adminCopy.fieldErrors.image;
  }

  if (code === "IMAGE_CREDIT_TOO_LONG") {
    return adminCopy.fieldErrors.imageCredit;
  }

  if (
    code === "INVALID_REDEMPTION_CONFIG" ||
    code === "EMPTY_VOUCHER_INVENTORY" ||
    code === "DUPLICATE_VOUCHER_CODE"
  ) {
    if (code === "EMPTY_VOUCHER_INVENTORY") {
      return locale === "de"
        ? "Voucher-Inventar fehlt. Codes oder PDF-Tickets hochladen."
        : "Voucher inventory is missing. Upload codes or PDF tickets.";
    }
    if (code === "DUPLICATE_VOUCHER_CODE") {
      return locale === "de"
        ? "Doppelter Promo-Code oder PDF-Schlüssel im Upload."
        : "Duplicate promo code or PDF key in the upload.";
    }
    return adminCopy.fieldErrors.redemption;
  }

  if (code === "DUPLICATE_SERIES_SLOTS" || code === "EMPTY_SERIES_SLOTS") {
    return adminCopy.fieldErrors.series;
  }

  if (code === "EMPTY_DATE_TIMES") {
    return adminCopy.fieldErrors.dateTimes;
  }

  if (code === "TOO_MANY_OCCURRENCES") {
    return adminCopy.tooManyOccurrences;
  }

  if (code === "NEGATIVE_CREDIT_PRICE") {
    return adminCopy.fieldErrors.creditPrice;
  }

  if (code === "NEGATIVE_CAPACITY" || code === "OCCURRENCE_CAPACITY_LENGTH_MISMATCH") {
    return locale === "de"
      ? "Kapazität muss eine ganze Zahl ≥ 0 sein, mit einem Eintrag pro Termin."
      : "Capacity must be a whole number ≥ 0, with one value per datetime.";
  }

  if (code === "CAPACITY_INVENTORY_MISMATCH") {
    return locale === "de"
      ? "Kapazität und Inventar stimmen nicht überein."
      : "Capacity and inventory do not match.";
  }

  if (code === "DUPLICATE_OCCURRENCE_INSTANTS") {
    return locale === "de"
      ? "Zwei Termine dürfen nicht dieselbe Uhrzeit haben."
      : "Two datetimes cannot share the same instant.";
  }

  if (code === "INVALID_SUBTITLE_LANGUAGE") {
    return adminCopy.fieldErrors.subtitleLanguage;
  }

  if (code === "EVENT_NOT_FOUND") {
    return locale === "de" ? "Event nicht gefunden." : "Event not found.";
  }

  if (code === "ALREADY_FEATURED") {
    return locale === "de" ? "Bereits in der Featured-Liste." : "Already on the featured list.";
  }

  if (code === "GALLERY_DUPLICATE_IMAGE") {
    return locale === "de"
      ? "Ein Galerie-Bild ist doppelt oder bereits vorhanden."
      : "A gallery image is duplicated or already on the event.";
  }

  if (code === "GALLERY_REORDER_INVALID") {
    return locale === "de"
      ? "Die Galerie-Reihenfolge ist ungültig. Bitte lade die Seite neu und versuche es erneut."
      : "That gallery order is invalid. Reload the page and try again.";
  }

  if (code === "FEATURED_EVENTS_REORDER_INVALID") {
    return locale === "de"
      ? "Die Featured-Event-Reihenfolge ist ungültig. Bitte lade die Seite neu und versuche es erneut."
      : "That featured events order is invalid. Reload the page and try again.";
  }

  if (code === "FEATURED_PARTNERS_REORDER_INVALID") {
    return locale === "de"
      ? "Die Featured-Partner-Reihenfolge ist ungültig. Bitte lade die Seite neu und versuche es erneut."
      : "That featured partners order is invalid. Reload the page and try again.";
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
  // Featured-first ordering for searchable spoken-languages checkbox multi-select.
  return getPreferredLanguageOptions(locale).map((option) => ({
    id: option.code,
    label: option.label,
  }));
}

/**
 * Full ISO 639-1 language list for subtitle-language checkbox multi-select.
 * Featured Berlin-common codes first; remaining codes A–Z by locale display label
 * (not limited to the spoken-event allowlist). Collapses remaining same-label pairs.
 */
export function getEventSubtitleLanguageOptions(locale: Locale): AdminSelectOption[] {
  const intlLocale = locale === "de" ? "de" : "en";
  const display = new Intl.DisplayNames([intlLocale], { type: "language" });
  const seenLabels = new Set<string>();
  const options: AdminSelectOption[] = [];
  for (const code of listIso6391LanguageCodes()) {
    const label = display.of(code.toLowerCase()) ?? code;
    const labelKey = label.toLocaleLowerCase(intlLocale);
    if (seenLabels.has(labelKey)) {
      continue;
    }
    seenLabels.add(labelKey);
    options.push({ id: code, label });
  }
  const featuredSet = new Set<string>(FEATURED_PREFERRED_LANGUAGES);
  const featured = FEATURED_PREFERRED_LANGUAGES.flatMap((code) => {
    const option = options.find((entry) => entry.id === code);
    return option ? [option] : [];
  });
  const rest = options
    .filter((option) => !featuredSet.has(option.id))
    .sort((a, b) => a.label.localeCompare(b.label, intlLocale, { sensitivity: "base" }));
  return [...featured, ...rest];
}

export function getEventCategoryOptions(locale: Locale): AdminSelectOption[] {
  return EVENT_CATEGORIES.map((id) => ({
    id,
    label: getEventCategoryLabel(locale, id),
  }));
}

export function getEventTypeOptions(locale: Locale): AdminSelectOption[] {
  return EVENT_TYPES.map((id) => ({
    id,
    label: getEventTypeLabel(locale, id),
  }));
}

/** Display label for a language code in admin tables (spoken or subtitle). */
export function formatAdminLanguageCode(locale: Locale, code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return "—";
  }
  const fromPreferred = getPreferredLanguageOptions(locale).find(
    (option) => option.code.toUpperCase() === normalized,
  );
  if (fromPreferred) {
    return fromPreferred.label;
  }
  try {
    return (
      new Intl.DisplayNames([locale === "de" ? "de" : "en"], { type: "language" }).of(
        normalized.toLowerCase(),
      ) ?? normalized
    );
  } catch {
    return normalized;
  }
}
