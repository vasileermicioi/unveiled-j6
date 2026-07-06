import type { CatalogErrorCode } from "@unveiled/db";

import type { Locale } from "./locale";

export const ADMIN_PARTNERS_PAGE_SIZE = 25;

export type AdminCopy = {
  navDashboard: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  quickLinksTitle: string;
  partnersLink: string;
  eventsLink: string;
  seedDemo: string;
  seedSuccess: string;
  seedSkipped: string;
  partnersTitle: string;
  partnersSubtitle: string;
  newPartner: string;
  searchPlaceholder: string;
  searchSubmit: string;
  tableLogo: string;
  tableName: string;
  tableEmail: string;
  tableAddress: string;
  tableActions: string;
  editAction: string;
  deleteAction: string;
  emptyPartners: string;
  paginationShowing: (from: number, to: number, total: number) => string;
  paginationPrevious: string;
  paginationNext: string;
  newPartnerTitle: string;
  editPartnerTitle: string;
  deletePartnerTitle: string;
  deletePartnerBody: (name: string) => string;
  deleteConfirm: string;
  cancel: string;
  save: string;
  create: string;
  nameLabel: string;
  emailLabel: string;
  addressLabel: string;
  logoFileLabel: string;
  logoUrlLabel: string;
  logoUrlHint: string;
  genericError: string;
  fieldErrors: {
    name: string;
    contactEmail: string;
    address: string;
    logo: string;
  };
};

const copy: Record<Locale, AdminCopy> = {
  de: {
    navDashboard: "Admin",
    dashboardTitle: "Admin-Dashboard",
    dashboardSubtitle: "Partner verwalten und Demo-Daten laden.",
    quickLinksTitle: "Schnellzugriff",
    partnersLink: "Partner",
    eventsLink: "Events",
    seedDemo: "Demo-Daten laden",
    seedSuccess: "Demo-Daten wurden erstellt.",
    seedSkipped: "Demo-Daten wurden übersprungen — bereits vorhandene Einträge.",
    partnersTitle: "Partner",
    partnersSubtitle: "Venue-Datensätze für Events verwalten.",
    newPartner: "Neuer Partner",
    searchPlaceholder: "Name oder E-Mail suchen",
    searchSubmit: "Suchen",
    tableLogo: "Logo",
    tableName: "Name",
    tableEmail: "E-Mail",
    tableAddress: "Adresse",
    tableActions: "Aktionen",
    editAction: "Bearbeiten",
    deleteAction: "Löschen",
    emptyPartners: "Noch keine Partner vorhanden.",
    paginationShowing: (from, to, total) => `${from}–${to} von ${total}`,
    paginationPrevious: "Zurück",
    paginationNext: "Weiter",
    newPartnerTitle: "Partner anlegen",
    editPartnerTitle: "Partner bearbeiten",
    deletePartnerTitle: "Partner löschen",
    deletePartnerBody: (name) => `Partner „${name}" endgültig löschen?`,
    deleteConfirm: "Löschen",
    cancel: "Abbrechen",
    save: "Speichern",
    create: "Anlegen",
    nameLabel: "Name",
    emailLabel: "Kontakt-E-Mail",
    addressLabel: "Adresse",
    logoFileLabel: "Logo hochladen",
    logoUrlLabel: "Logo-URL",
    logoUrlHint: "Optional: Bilddatei oder URL — nicht beides gleichzeitig.",
    genericError: "Bitte Eingaben prüfen und erneut versuchen.",
    fieldErrors: {
      name: "Name ist erforderlich.",
      contactEmail: "Gültige E-Mail-Adresse erforderlich.",
      address: "Adresse ist erforderlich.",
      logo: "Logo-Upload und URL können nicht gleichzeitig gesetzt werden.",
    },
  },
  en: {
    navDashboard: "Admin",
    dashboardTitle: "Admin dashboard",
    dashboardSubtitle: "Manage partners and load demo data.",
    quickLinksTitle: "Quick links",
    partnersLink: "Partners",
    eventsLink: "Events",
    seedDemo: "Load demo data",
    seedSuccess: "Demo data created.",
    seedSkipped: "Demo seed skipped — data already exists.",
    partnersTitle: "Partners",
    partnersSubtitle: "Manage venue records for events.",
    newPartner: "New partner",
    searchPlaceholder: "Search name or email",
    searchSubmit: "Search",
    tableLogo: "Logo",
    tableName: "Name",
    tableEmail: "Email",
    tableAddress: "Address",
    tableActions: "Actions",
    editAction: "Edit",
    deleteAction: "Delete",
    emptyPartners: "No partners yet.",
    paginationShowing: (from, to, total) => `Showing ${from}–${to} of ${total}`,
    paginationPrevious: "Previous",
    paginationNext: "Next",
    newPartnerTitle: "Create partner",
    editPartnerTitle: "Edit partner",
    deletePartnerTitle: "Delete partner",
    deletePartnerBody: (name) => `Permanently delete partner “${name}”?`,
    deleteConfirm: "Delete",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    nameLabel: "Name",
    emailLabel: "Contact email",
    addressLabel: "Address",
    logoFileLabel: "Upload logo",
    logoUrlLabel: "Logo URL",
    logoUrlHint: "Optional: upload a file or paste a URL — not both at once.",
    genericError: "Please check your input and try again.",
    fieldErrors: {
      name: "Name is required.",
      contactEmail: "A valid email address is required.",
      address: "Address is required.",
      logo: "Logo upload and URL cannot both be provided.",
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
  PARTNER_HAS_EVENTS: "name",
  PARTNER_NOT_FOUND: "name",
};

export function mapCatalogErrorCode(
  locale: Locale,
  code: CatalogErrorCode,
  field?: string,
): string {
  const adminCopy = getAdminCopy(locale);

  if (code === "REQUIRED_FIELD" && field && field in adminCopy.fieldErrors) {
    return adminCopy.fieldErrors[field as keyof AdminCopy["fieldErrors"]] ?? adminCopy.genericError;
  }

  if (code === "INVALID_EMAIL") {
    return adminCopy.fieldErrors.contactEmail;
  }

  if (code === "CONFLICTING_IMAGE_SOURCES") {
    return adminCopy.fieldErrors.logo;
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
