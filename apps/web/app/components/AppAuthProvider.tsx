import { AuthProvider } from "@better-auth-ui/heroui";
import { ToastProvider } from "@heroui/react";
import type { ReactNode } from "react";
import { authClient } from "../lib/auth-client";
import { buildDefaultAuthContinuePath, normalizeAuthRedirectTarget } from "../lib/auth-redirect";
import { createAuthProviderConfig } from "../lib/auth-ui-config";
import type { Locale } from "../lib/locale";

type AppAuthProviderProps = {
  locale: Locale;
  children: ReactNode;
  authRedirectTo?: string;
};

function resolveAuthUiBaseUrl(locale: Locale): string {
  return `${window.location.origin}/${locale}`;
}

function resolveAuthRedirectTo(locale: Locale, authRedirectTo?: string): string {
  const defaultRedirect = buildDefaultAuthContinuePath(locale);
  const queryRedirect =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("redirectTo") ?? undefined)
      : undefined;

  return (
    normalizeAuthRedirectTarget(authRedirectTo, locale) ??
    normalizeAuthRedirectTarget(queryRedirect ?? undefined, locale) ??
    defaultRedirect
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
          if (replace) {
            window.location.replace(to);
            return;
          }
          window.location.href = to;
        }}
        {...config}
      >
        {children}
      </AuthProvider>
      <ToastProvider placement="top" />
    </>
  );
}
