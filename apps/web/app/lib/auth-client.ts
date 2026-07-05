import { createAuthClient } from "better-auth/react";

function resolveBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // SSR fallback only — never reference process.env in code that ships to the browser.
  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: resolveBaseUrl(),
});

export async function signOut(): Promise<void> {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        if (typeof window !== "undefined") {
          const locale = window.location.pathname.split("/").filter(Boolean)[0];
          const target = locale === "de" || locale === "en" ? `/${locale}` : "/de";
          window.location.replace(target);
        }
      },
    },
  });
}
