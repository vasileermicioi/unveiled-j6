import type { Locale } from "./locale";

export type AuthPageKey = "login" | "signup" | "forgotPassword" | "resetPassword";

type AuthPageCopy = {
  title: string;
  description: string;
};

const pageCopy: Record<Locale, Record<AuthPageKey, AuthPageCopy>> = {
  de: {
    login: {
      title: "Anmelden",
      description: "Melde dich mit E-Mail und Passwort oder Google an.",
    },
    signup: {
      title: "Registrieren",
      description: "Erstelle dein Unveiled-Konto und sichere dir 17 Start-Credits.",
    },
    forgotPassword: {
      title: "Passwort vergessen",
      description: "Wir senden dir einen Link zum Zurücksetzen deines Passworts.",
    },
    resetPassword: {
      title: "Passwort zurücksetzen",
      description: "Wähle ein neues Passwort für dein Konto.",
    },
  },
  en: {
    login: {
      title: "Sign in",
      description: "Sign in with email and password or continue with Google.",
    },
    signup: {
      title: "Sign up",
      description: "Create your Unveiled account and start with 17 credits.",
    },
    forgotPassword: {
      title: "Forgot password",
      description: "We will email you a link to reset your password.",
    },
    resetPassword: {
      title: "Reset password",
      description: "Choose a new password for your account.",
    },
  },
};

export function getAuthPageCopy(locale: Locale, page: AuthPageKey): AuthPageCopy {
  return pageCopy[locale][page];
}
