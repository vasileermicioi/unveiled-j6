import type { Page } from "@playwright/test";
import {
  getAdminCredentials,
  loginAsAdmin,
  loginWithCredentials,
  logout,
  signupFreshUser,
  waitForPostLogin,
} from "../fixtures/auth";
import { expect, test } from "../fixtures/base";
import { completeOnboardingWizard } from "../fixtures/onboarding";

async function fillSignupPasswords(page: Page, password: string): Promise<void> {
  await page.getByLabel(/^passwort$|^password$/i).fill(password);
  const confirm = page.getByLabel(/passwort bestätigen|confirm password/i);
  if ((await confirm.count()) > 0) {
    await confirm.fill(password);
  }
}

/** Native HTML5 required / Better Auth fieldRequired copy. */
async function expectFieldValidation(page: Page): Promise<void> {
  await expect(
    page.getByText(/erforderlich|required|fill out this field|dieses feld/i).first(),
  ).toBeVisible({ timeout: 10_000 });
}

test.describe("auth.feature", () => {
  test("Scenario: Sign up as a new member", async ({ page, locale }) => {
    const user = await signupFreshUser(page, locale);
    expect(user.email).toContain("@unveiled.test");
    await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/`));
  });

  test("Scenario Outline: Signup validation — email = not-an-email", async ({ page, locale }) => {
    await page.goto(`/${locale}/signup`);
    await page.getByLabel(/vorname|first name/i).fill("E2E");
    await page.getByLabel(/nachname|last name/i).fill("Tester");
    await page.getByLabel(/e-?mail/i).fill("not-an-email");
    await fillSignupPasswords(page, "validpass1");
    await page.getByRole("button", { name: /registrieren|sign up|create/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/signup`));
    await expect(
      page.getByText(/gültige e-mail|valid e-?mail|invalid|ungültig/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Scenario Outline: Signup validation — password = 12345", async ({ page, locale }) => {
    await page.goto(`/${locale}/signup`);
    await page.getByLabel(/vorname|first name/i).fill("E2E");
    await page.getByLabel(/nachname|last name/i).fill("Tester");
    await page.getByLabel(/e-?mail/i).fill(`short.pw.${Date.now()}@unveiled.test`);
    await fillSignupPasswords(page, "12345");
    await page.getByRole("button", { name: /registrieren|sign up|create/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/signup`));
    await expect(
      page.getByText(/mindestens 6|at least 6|6 zeichen|6 characters/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Scenario Outline: Signup validation — firstName = (empty)", async ({ page, locale }) => {
    await page.goto(`/${locale}/signup`);
    await page.getByLabel(/nachname|last name/i).fill("Tester");
    await page.getByLabel(/e-?mail/i).fill(`empty.first.${Date.now()}@unveiled.test`);
    await fillSignupPasswords(page, "validpass1");
    await page.getByRole("button", { name: /registrieren|sign up|create/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/signup`));
    await expectFieldValidation(page);
  });

  test("Scenario Outline: Signup validation — lastName = (empty)", async ({ page, locale }) => {
    await page.goto(`/${locale}/signup`);
    await page.getByLabel(/vorname|first name/i).fill("E2E");
    await page.getByLabel(/e-?mail/i).fill(`empty.last.${Date.now()}@unveiled.test`);
    await fillSignupPasswords(page, "validpass1");
    await page.getByRole("button", { name: /registrieren|sign up|create/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/signup`));
    await expectFieldValidation(page);
  });

  test("Scenario: Log in with valid credentials", async ({ page, locale }) => {
    const user = await signupFreshUser(page, locale);
    await logout(page, locale);
    await loginWithCredentials(page, locale, user);
    await waitForPostLogin(page, locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/`), { timeout: 30_000 });
  });

  test("Scenario Outline: Post-login routing — PARTNER / onboardingComplete = true → partner-portal", async ({
    page,
  }) => {
    test.skip(
      true,
      "PARTNER accounts are admin-provisioned only; no demo PARTNER credentials in seed — provision for CI later",
    );
    await page.goto("/de");
  });

  test("Scenario Outline: Post-login routing — ADMIN / onboardingComplete = true → app (admin view)", async ({
    page,
    locale,
  }) => {
    const admin = getAdminCredentials();
    await page.goto(`/${locale}/login`);
    await page.getByLabel(/e-?mail/i).fill(admin.email);
    await page.getByLabel(/^passwort$|^password$/i).fill(admin.password);
    await page.getByRole("button", { name: /anmelden|sign in|log in/i }).click();
    await page.waitForTimeout(4_000);

    if (page.url().includes("/login")) {
      await page.goto(`/${locale}/signup`, { waitUntil: "domcontentloaded" });
      await page.getByLabel(/vorname|first name/i).fill("E2E");
      await page.getByLabel(/nachname|last name/i).fill("Admin");
      await page.getByLabel(/e-?mail/i).fill(admin.email);
      await fillSignupPasswords(page, admin.password);
      await page.getByRole("button", { name: /registrieren|sign up|create/i }).click();
      await page.waitForURL(/\/(onboarding|admin|membership|events)/, { timeout: 30_000 });
      await logout(page, locale).catch(() => undefined);
      await loginAsAdmin(page, locale);
      await waitForPostLogin(page, locale);
    }

    if (page.url().includes("/onboarding")) {
      await logout(page, locale);
      await loginAsAdmin(page, locale);
      await waitForPostLogin(page, locale);
    }
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin`), { timeout: 30_000 });
  });

  test("Scenario Outline: Post-login routing — USER / onboardingComplete = false → onboarding", async ({
    page,
    locale,
  }) => {
    await signupFreshUser(page, locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/`));
  });

  test("Scenario Outline: Post-login routing — USER / onboardingComplete = true → app", async ({
    page,
    locale,
  }) => {
    const user = await signupFreshUser(page, locale);
    await completeOnboardingWizard(page, locale);
    await logout(page, locale);
    await loginWithCredentials(page, locale, user);
    await waitForPostLogin(page, locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/(events|membership)`), { timeout: 30_000 });
  });

  test("Scenario: Log in with invalid credentials", async ({ page, locale }) => {
    await page.goto(`/${locale}/login`);
    await page.getByLabel(/e-?mail/i).fill("nobody@unveiled.test");
    await page.getByLabel(/^passwort$|^password$/i).fill("wrong-password-xyz");
    await page.getByRole("button", { name: /anmelden|sign in|log in/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
    await expect(
      page.getByText(/ungültig|invalid|incorrect|fehlgeschlagen|failed|error/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario: Log in without a password", async ({ page, locale }) => {
    await page.goto(`/${locale}/login`);
    await page.getByLabel(/e-?mail/i).fill("someone@unveiled.test");
    await page.getByRole("button", { name: /anmelden|sign in|log in/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
    await expectFieldValidation(page);
  });

  test("Scenario: Request a password reset", async ({ page, locale }) => {
    await page.goto(`/${locale}/forgot-password`);
    const send = page.getByRole("button", { name: /link senden|send reset link/i });
    await expect(send).toBeVisible({ timeout: 15_000 });
    await page.getByLabel(/e-?mail/i).fill("reset.me@unveiled.test");
    const responsePromise = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        /request-password-reset|forget-password|forgot-password/i.test(r.url()),
      { timeout: 15_000 },
    );
    await send.click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    // UI may toast then redirect to login — either success copy or login landing is acceptable.
    await expect(page).toHaveURL(new RegExp(`/${locale}/(forgot-password|login)`), {
      timeout: 15_000,
    });
  });

  test("Scenario: Request a password reset with no email", async ({ page, locale }) => {
    await page.goto(`/${locale}/forgot-password`);
    const send = page.getByRole("button", { name: /link senden|send reset link/i });
    await expect(send).toBeVisible({ timeout: 15_000 });
    await send.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/forgot-password`));
    await expectFieldValidation(page);
  });

  test("Scenario: Log out", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await expect(page.getByRole("button", { name: /abmelden|log out/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await logout(page, locale);
    await expect(page.getByRole("link", { name: /anmelden|log ?in/i }).first()).toBeVisible();
    await page.goto(`/${locale}/onboarding/age`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
  });

  test("Scenario: Route protection for authenticated-only areas", async ({ page, locale }) => {
    await page.goto(`/${locale}/events`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?returnTo=`));

    await page.goto(`/${locale}/saved`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?returnTo=`));

    await page.goto(`/${locale}/bookings`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?returnTo=`));

    await page.goto(`/${locale}/profile`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?returnTo=`));

    await page.goto(`/${locale}/partner`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?returnTo=`));

    await page.goto(`/${locale}/admin`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?returnTo=`));
  });

  test("Scenario: Route protection by role", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await page.goto(`/${locale}/admin`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/${locale}/?$`));
    await page.goto(`/${locale}/partner`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/${locale}/?$`));
  });

  test("Scenario: Sign up or log in with Google", async () => {
    test.skip(true, "Google OAuth — requires Neon test provider; verify manually on staging");
  });

  test("Scenario: Social login never creates a PARTNER or ADMIN account", async () => {
    test.skip(true, "Google OAuth — requires Neon test provider; verify manually on staging");
  });

  test("Scenario: Request a data export", async () => {
    test.skip(true, "Phase 9 — GDPR data export not built");
  });

  test("Scenario: Request account deletion", async () => {
    test.skip(true, "Phase 9 — self-service account deletion not built");
  });

  test("Scenario: Account deletion is distinct from subscription cancellation", async () => {
    test.skip(true, "Phase 9 — GDPR deletion vs subscription cancellation not built");
  });

  test("Scenario: Admin can process account deletion on a member's behalf", async () => {
    test.skip(true, "Phase 9 — admin-processed deletion not built");
  });
});
