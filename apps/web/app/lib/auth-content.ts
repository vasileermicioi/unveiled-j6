import type { Locale } from "./locale";

export type AuthPageKey = "login" | "signup" | "forgotPassword" | "resetPassword";

type AuthPageCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

const pageCopy: Record<Locale, Record<AuthPageKey, AuthPageCopy>> = {
  de: {
    login: {
      eyebrow: "Willkommen zurück",
      title: "Anmelden",
      description: "Melde dich mit E-Mail und Passwort oder Google an.",
    },
    signup: {
      eyebrow: "Loslegen",
      title: "Registrieren",
      description: "Erstelle dein Unveiled-Konto und sichere dir 17 Start-Credits.",
    },
    forgotPassword: {
      eyebrow: "Konto",
      title: "Passwort vergessen",
      description: "Wir senden dir einen Link zum Zurücksetzen deines Passworts.",
    },
    resetPassword: {
      eyebrow: "Konto",
      title: "Passwort zurücksetzen",
      description: "Wähle ein neues Passwort für dein Konto.",
    },
  },
  en: {
    login: {
      eyebrow: "Welcome back",
      title: "Sign in",
      description: "Sign in with email and password or continue with Google.",
    },
    signup: {
      eyebrow: "Get started",
      title: "Sign up",
      description: "Create your Unveiled account and start with 17 credits.",
    },
    forgotPassword: {
      eyebrow: "Account",
      title: "Forgot password",
      description: "We will email you a link to reset your password.",
    },
    resetPassword: {
      eyebrow: "Account",
      title: "Reset password",
      description: "Choose a new password for your account.",
    },
  },
};

export function getAuthPageCopy(locale: Locale, page: AuthPageKey): AuthPageCopy {
  return pageCopy[locale][page];
}
