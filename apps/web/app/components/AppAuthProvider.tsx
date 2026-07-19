import { AuthProvider } from "@better-auth-ui/heroui";
import { ToastProvider } from "@heroui/react";
import type { ReactNode } from "react";
import { authClient } from "../lib/auth-client";
import {
  buildAuthUiContinuePath,
  normalizeAuthRedirectTarget,
  resolveAuthNavigatePath,
} from "../lib/auth-redirect";
import { createAuthProviderConfig } from "../lib/auth-ui-config";
import type { Locale } from "../lib/locale";
import { parseReturnTo } from "../lib/post-auth-redirect";

type AppAuthProviderProps = {
  locale: Locale;
  children: ReactNode;
  authRedirectTo?: string;
};

function resolveAuthUiBaseUrl(locale: Locale): string {
  return `${window.location.origin}/${locale}`;
}

/**
 * Locale-relative `/auth/continue?...` for AuthProvider.
 * HeroUI OAuth builds callbackURL as `baseURL + redirectTo` (baseURL already includes `/${locale}`).
 */
function resolveAuthRedirectTo(locale: Locale, authRedirectTo?: string): string {
  const queryRedirect =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("redirectTo") ?? undefined)
      : undefined;
  // App login links use `returnTo=` (destination); better-auth-ui also reads `redirectTo=`.
  const returnToQuery =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("returnTo") ?? undefined)
      : undefined;
  const safeReturnTo = parseReturnTo(returnToQuery ?? undefined, locale);

  return (
    normalizeAuthRedirectTarget(authRedirectTo, locale) ??
    normalizeAuthRedirectTarget(queryRedirect ?? undefined, locale) ??
    (safeReturnTo ? buildAuthUiContinuePath(safeReturnTo) : buildAuthUiContinuePath())
  );
}

function sanitizeAuthRedirectQueryInPlace(locale: Locale): void {
  const url = new URL(window.location.href);
  const redirectTo = url.searchParams.get("redirectTo");
  const normalized = normalizeAuthRedirectTarget(redirectTo ?? undefined, locale);

  if (!redirectTo || !normalized || normalized === redirectTo) {
    return;
  }

  url.searchParams.set("redirectTo", normalized);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function AppAuthProvider({ locale, children, authRedirectTo }: AppAuthProviderProps) {
  sanitizeAuthRedirectQueryInPlace(locale);

  const config = {
    ...createAuthProviderConfig(locale),
    baseURL: resolveAuthUiBaseUrl(locale),
    redirectTo: resolveAuthRedirectTo(locale, authRedirectTo),
  };

  return (
    <>
      <AuthProvider
        authClient={authClient}
        navigate={({ to, replace }) => {
          const target = resolveAuthNavigatePath(to, locale);
          if (replace) {
            window.location.replace(target);
            return;
          }
          window.location.href = target;
        }}
        {...config}
      >
        {children}
      </AuthProvider>
      <ToastProvider placement="top" />
    </>
  );
}
