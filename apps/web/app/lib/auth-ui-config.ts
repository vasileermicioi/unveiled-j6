import type { AdditionalField } from "@better-auth-ui/core";
import type { SocialProvider } from "better-auth/social-providers";
import { getAuthLocalization } from "./auth-localization";
import type { Locale } from "./locale";

function requiredFieldMessage(locale: Locale): string {
  return locale === "de" ? "Dieses Feld ist erforderlich" : "This field is required";
}

function buildSignupNameFields(locale: Locale): AdditionalField[] {
  const requiredMessage = requiredFieldMessage(locale);

  return [
    {
      name: "firstName",
      type: "string",
      label: locale === "de" ? "Vorname" : "First name",
      placeholder: locale === "de" ? "Vorname" : "First name",
      required: true,
      signUp: "above",
      profile: false,
      validate: (value) => {
        if (!value || (typeof value === "string" && !value.trim())) {
          throw new Error(requiredMessage);
        }
      },
    },
    {
      name: "lastName",
      type: "string",
      label: locale === "de" ? "Nachname" : "Last name",
      placeholder: locale === "de" ? "Nachname" : "Last name",
      required: true,
      signUp: "above",
      profile: false,
      validate: (value) => {
        if (!value || (typeof value === "string" && !value.trim())) {
          throw new Error(requiredMessage);
        }
      },
    },
  ];
}

export function createAuthProviderConfig(locale: Locale) {
  return {
    basePaths: {
      // AuthProvider.baseURL is already `origin/${locale}`. Forgot-password
      // emails use getViewURL(baseURL, basePaths.auth, resetPassword) — a locale
      // here would produce `/en/en/reset-password`. In-app links are `/login`
      // etc. and get the locale from resolveAuthNavigatePath.
      auth: "",
      settings: `/${locale}/profile`,
      organization: `/${locale}/organization`,
    },
    viewPaths: {
      auth: {
        signIn: "login",
        signUp: "signup",
        forgotPassword: "forgot-password",
        resetPassword: "reset-password",
        resetLinkSent: "reset-link-sent",
        signOut: "sign-out",
        verifyEmail: "verify-email",
      },
      settings: {
        account: "account",
        security: "security",
      },
    },
    // Locale-relative: AuthProvider baseURL is `origin/${locale}` (see AppAuthProvider).
    redirectTo: "/auth/continue",
    socialProviders: ["google"] as SocialProvider[],
    emailAndPassword: {
      enabled: true,
      forgotPassword: true,
      name: false,
      minPasswordLength: 6,
      maxPasswordLength: 128,
    },
    additionalFields: buildSignupNameFields(locale),
    localization: getAuthLocalization(locale),
  };
}
