import type { Page } from "@playwright/test";

import type { Locale } from "./base";
import { expect } from "./base";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type FreshUser = LoginCredentials & {
  firstName: string;
  lastName: string;
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

/** Password inputs only — exact labels avoid the "Passwort anzeigen" toggle. */
async function fillPasswordFields(page: Page, password: string): Promise<void> {
  await page.getByLabel(/^passwort$|^password$/i).fill(password);
  const confirm = page.getByLabel(/passwort bestätigen|confirm password/i);
  if ((await confirm.count()) > 0) {
    await confirm.fill(password);
  }
}

export async function loginWithCredentials(
  page: Page,
  locale: Locale,
  credentials: LoginCredentials,
): Promise<void> {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(/e-?mail/i).fill(credentials.email);
  await fillPasswordFields(page, credentials.password);
  await page.getByRole("button", { name: /anmelden|sign in|log in/i }).click();
}

/** Wait until post-login redirect leaves `/login` (auth/continue → role destination). */
export async function waitForPostLogin(page: Page, locale: Locale = "de"): Promise<void> {
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
  void locale;
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

export async function logout(page: Page, locale: Locale = "de"): Promise<void> {
  const logoutControl = page.getByRole("button", { name: /abmelden|log out/i }).first();
  await expect(logoutControl).toBeVisible({ timeout: 15_000 });
  await logoutControl.click();
  await page.waitForURL((url) => !url.pathname.includes("/onboarding"), { timeout: 15_000 });
  await expect(page).toHaveURL(new RegExp(`/${locale}(/)?$`));
}

/**
 * Creates a disposable USER via the signup form. Unique email per call for isolation.
 * After signup the app redirects incomplete USERs into onboarding.
 */
export async function signupFreshUser(
  page: Page,
  locale: Locale = "de",
  overrides: Partial<FreshUser> = {},
): Promise<FreshUser> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const user: FreshUser = {
    email: overrides.email ?? `e2e.${stamp}@unveiled.test`,
    password: overrides.password ?? "e2e-test-pass-123",
    firstName: overrides.firstName ?? "E2E",
    lastName: overrides.lastName ?? "Tester",
  };

  await page.goto(`/${locale}/signup`);
  await page.getByLabel(/vorname|first name/i).fill(user.firstName);
  await page.getByLabel(/nachname|last name/i).fill(user.lastName);
  await page.getByLabel(/e-?mail/i).fill(user.email);
  await fillPasswordFields(page, user.password);
  await page.getByRole("button", { name: /registrieren|sign up|create/i }).click();
  // Better Auth may briefly land on /auth/continue before the session cookie is readable
  // by SSR — avoid redirect-loop flakes by settling on the onboarding age step.
  try {
    await page.waitForURL(/\/(onboarding|auth\/continue)/, { timeout: 45_000 });
  } catch {
    // fall through to explicit navigation
  }
  if (!page.url().includes("/onboarding")) {
    await page.goto(`/${locale}/onboarding/age`, { waitUntil: "domcontentloaded" });
  }
  await expect(page).toHaveURL(/\/onboarding\//, { timeout: 20_000 });
  return user;
}
