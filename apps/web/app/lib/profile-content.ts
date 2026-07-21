import type { Locale } from "./locale";

export type ProfileCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  tabNavLabel: string;
  walletTitle: string;
  walletBalance: (credits: number) => string;
  refillCta: string;
  identityTitle: string;
  firstNameLabel: string;
  lastNameLabel: string;
  emailLabel: string;
  saveIdentity: string;
  preferencesLink: string;
  billingLink: string;
  passwordLink: string;
  dataExportLink: string;
  deleteAccountLink: string;
  preferencesTitle: string;
  preferencesSubtitle: string;
  savePreferences: string;
  securityTitle: string;
  securitySubtitle: string;
  backToProfile: string;
  validationError: string;
  successIdentity: string;
  successPreferences: string;
};

const copy: Record<Locale, ProfileCopy> = {
  de: {
    eyebrow: "Konto",
    title: "Dein Konto",
    subtitle: "Identität, Credits und Vibes verwalten.",
    tabNavLabel: "Kontobereiche",
    walletTitle: "Credit-Wallet",
    walletBalance: (credits) => `${credits} Credits`,
    refillCta: "Credits aufladen",
    identityTitle: "Persönliche Daten",
    firstNameLabel: "Vorname",
    lastNameLabel: "Nachname",
    emailLabel: "E-Mail",
    saveIdentity: "Speichern",
    preferencesLink: "Vibes / Präferenzen",
    billingLink: "Abrechnung",
    passwordLink: "Passwort ändern",
    dataExportLink: "Daten exportieren",
    deleteAccountLink: "Konto löschen",
    preferencesTitle: "Deine Vibes",
    preferencesSubtitle: "Interessen, Orte und Timing aktualisieren.",
    savePreferences: "Präferenzen speichern",
    securityTitle: "Sicherheit",
    securitySubtitle: "Passwort über Neon Auth / Better Auth ändern.",
    backToProfile: "Zurück zum Konto",
    validationError: "Bitte prüfe deine Angaben und versuche es erneut.",
    successIdentity: "Profil aktualisiert.",
    successPreferences: "Präferenzen gespeichert.",
  },
  en: {
    eyebrow: "Account",
    title: "Your account",
    subtitle: "Manage identity, credits, and vibes.",
    tabNavLabel: "Account sections",
    walletTitle: "Credit wallet",
    walletBalance: (credits) => `${credits} credits`,
    refillCta: "Refill credits",
    identityTitle: "Personal details",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    emailLabel: "Email",
    saveIdentity: "Save",
    preferencesLink: "Vibes / Preferences",
    billingLink: "Billing",
    passwordLink: "Change password",
    dataExportLink: "Export data",
    deleteAccountLink: "Delete account",
    preferencesTitle: "Your vibes",
    preferencesSubtitle: "Update interests, places, and timing.",
    savePreferences: "Save preferences",
    securityTitle: "Security",
    securitySubtitle: "Change your password via Neon Auth / Better Auth.",
    backToProfile: "Back to account",
    validationError: "Please check your details and try again.",
    successIdentity: "Profile updated.",
    successPreferences: "Preferences saved.",
  },
};

export function getProfileCopy(locale: Locale): ProfileCopy {
  return copy[locale];
}
