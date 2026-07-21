import type { GdprErrorCode } from "@unveiled/db";

import type { Locale } from "./locale";

export type GdprMemberCopy = {
  eyebrow: string;
  exportTitle: string;
  exportSubtitle: string;
  exportDownload: string;
  exportBack: string;
  deleteTitle: string;
  deleteSubtitle: string;
  deleteWarning: string;
  deleteConfirm: string;
  deleteKeep: string;
  deleteBack: string;
  errorUserNotFound: string;
  errorAlreadyDeleted: string;
  errorAuthDisableFailed: string;
  errorCancelFailed: string;
  errorGeneric: string;
};

const memberCopy: Record<Locale, GdprMemberCopy> = {
  de: {
    eyebrow: "Konto",
    exportTitle: "Daten exportieren",
    exportSubtitle:
      "Lade eine Zusammenfassung deines Profils, deiner Buchungen und deines Credit-Ledgers herunter.",
    exportDownload: "JSON herunterladen",
    exportBack: "Zurück zum Konto",
    deleteTitle: "Konto löschen",
    deleteSubtitle: "Diese Aktion kann nicht rückgängig gemacht werden.",
    deleteWarning:
      "Dein Name, deine E-Mail und Präferenzen werden anonymisiert. Buchungs- und Credit-Historie bleiben aus rechtlichen Gründen in anonymisierter Form erhalten. Du wirst abgemeldet und kannst dich mit den bisherigen Zugangsdaten nicht mehr anmelden. Ein aktives Abo wird mitgelöscht.",
    deleteConfirm: "Konto endgültig löschen",
    deleteKeep: "Konto behalten",
    deleteBack: "Zurück zum Konto",
    errorUserNotFound: "Konto nicht gefunden.",
    errorAlreadyDeleted: "Dieses Konto wurde bereits gelöscht.",
    errorAuthDisableFailed:
      "Das Konto wurde lokal geschlossen, aber die Anmeldung konnte nicht vollständig deaktiviert werden. Bitte kontaktiere support@unveiled.berlin, falls du dich noch anmelden kannst.",
    errorCancelFailed:
      "Das Konto wurde anonymisiert, aber die Abo-Kündigung ist fehlgeschlagen. Bitte kontaktiere support@unveiled.berlin.",
    errorGeneric: "Konto löschen ist fehlgeschlagen. Bitte versuche es erneut.",
  },
  en: {
    eyebrow: "Account",
    exportTitle: "Export your data",
    exportSubtitle: "Download a summary of your profile, bookings, and credit ledger.",
    exportDownload: "Download JSON",
    exportBack: "Back to account",
    deleteTitle: "Delete account",
    deleteSubtitle: "This action cannot be undone.",
    deleteWarning:
      "Your name, email, and preferences will be anonymized. Booking and credit history are retained in anonymized form for legal retention. You will be signed out and will no longer be able to sign in with your previous credentials. Any active subscription is cancelled as part of deletion.",
    deleteConfirm: "Permanently delete account",
    deleteKeep: "Keep my account",
    deleteBack: "Back to account",
    errorUserNotFound: "Account not found.",
    errorAlreadyDeleted: "This account has already been deleted.",
    errorAuthDisableFailed:
      "The account was closed locally, but login could not be fully disabled. Contact support@unveiled.berlin if you can still sign in.",
    errorCancelFailed:
      "The account was anonymized, but subscription cancellation failed. Contact support@unveiled.berlin.",
    errorGeneric: "Account deletion failed. Please try again.",
  },
};

export function getGdprMemberCopy(locale: Locale): GdprMemberCopy {
  return memberCopy[locale];
}

export function mapGdprErrorMessage(code: GdprErrorCode, locale: Locale): string {
  const copy = getGdprMemberCopy(locale);
  switch (code) {
    case "USER_NOT_FOUND":
      return copy.errorUserNotFound;
    case "ALREADY_DELETED":
      return copy.errorAlreadyDeleted;
    case "AUTH_DISABLE_FAILED":
      return copy.errorAuthDisableFailed;
    case "CANCEL_FAILED":
      return copy.errorCancelFailed;
    default:
      return copy.errorGeneric;
  }
}
