import { localization as defaultLocalization } from "@better-auth-ui/core";

import type { Locale } from "./locale";

const germanAuthCopy = {
  alreadyHaveAnAccount: "Schon registriert?",
  confirmPassword: "Passwort bestätigen",
  confirmPasswordPlaceholder: "Passwort bestätigen",
  continueWith: "Weiter mit {{provider}}",
  email: "E-Mail",
  emailPlaceholder: "name@beispiel.de",
  fieldRequired: "Dieses Feld ist erforderlich",
  forgotPassword: "Passwort vergessen",
  forgotPasswordLink: "Passwort vergessen?",
  hidePassword: "Passwort verbergen",
  invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein",
  needToCreateAnAccount: "Noch kein Konto?",
  newPassword: "Neues Passwort",
  newPasswordPlaceholder: "Neues Passwort",
  or: "ODER",
  password: "Passwort",
  passwordPlaceholder: "Passwort",
  passwordResetEmailSent: "E-Mail zum Zurücksetzen gesendet",
  passwordResetSuccess: "Passwort erfolgreich zurückgesetzt",
  passwordsDoNotMatch: "Passwörter stimmen nicht überein",
  rememberYourPassword: "Passwort wieder eingefallen?",
  resetPassword: "Passwort zurücksetzen",
  sendResetLink: "Link senden",
  showPassword: "Passwort anzeigen",
  signIn: "Anmelden",
  signUp: "Registrieren",
  tooShort: "Mindestens {{min}} Zeichen",
} as const;

export function getAuthLocalization(locale: Locale) {
  if (locale === "en") {
    return defaultLocalization;
  }

  return {
    ...defaultLocalization,
    auth: {
      ...defaultLocalization.auth,
      ...germanAuthCopy,
    },
  };
}
