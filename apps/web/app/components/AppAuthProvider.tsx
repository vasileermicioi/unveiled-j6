import { AuthProvider } from "@better-auth-ui/heroui";
import { ToastProvider } from "@heroui/react";
import type { ReactNode } from "react";

import { authClient } from "../lib/auth-client";
import { createAuthProviderConfig } from "../lib/auth-ui-config";
import type { Locale } from "../lib/locale";

type AppAuthProviderProps = {
  locale: Locale;
  children: ReactNode;
  authRedirectTo?: string;
};

export function AppAuthProvider({ locale, children, authRedirectTo }: AppAuthProviderProps) {
  const config = {
    ...createAuthProviderConfig(locale),
    ...(authRedirectTo ? { redirectTo: authRedirectTo } : {}),
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
