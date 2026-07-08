import type { Page } from "@playwright/test";

import type { Locale } from "./base";

export type LoginCredentials = {
  email: string;
  password: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in root .env or export it before running E2E tests. See e2e/README.md.`,
    );
  }
  return value;
}

export function getUserCredentials(): LoginCredentials {
  return {
    email: requireEnv("E2E_USER_EMAIL"),
    password: requireEnv("E2E_USER_PASSWORD"),
  };
}

export function getAdminCredentials(): LoginCredentials {
  return {
    email: requireEnv("E2E_ADMIN_EMAIL"),
    password: requireEnv("E2E_ADMIN_PASSWORD"),
  };
}

export async function loginWithCredentials(
  page: Page,
  locale: Locale,
  credentials: LoginCredentials,
): Promise<void> {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(/e-?mail/i).fill(credentials.email);
  await page.getByLabel(/passwort|password/i).fill(credentials.password);
  await page.getByRole("button", { name: /anmelden|sign in|log in/i }).click();
}

export async function loginAsUser(
  page: Page,
  locale: Locale = "de",
  credentials: LoginCredentials = getUserCredentials(),
): Promise<void> {
  await loginWithCredentials(page, locale, credentials);
}

export async function loginAsAdmin(
  page: Page,
  locale: Locale = "de",
  credentials: LoginCredentials = getAdminCredentials(),
): Promise<void> {
  await loginWithCredentials(page, locale, credentials);
}
