import type { Page } from "@playwright/test";

import { signupFreshUser } from "../fixtures/auth";
import { expect, type Locale, test } from "../fixtures/base";
import {
  activateMemberForBooking,
  getUserCredits,
  hasDatabaseUrl,
  setSubscriptionStatus,
} from "../fixtures/billing";
import { completeOnboardingWizard } from "../fixtures/onboarding";
import { setStripeBillingIds } from "../fixtures/waitlist";

async function onboardFreshMember(page: Page, locale: Locale) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        await page.context().clearCookies();
      }
      const user = await signupFreshUser(page, locale);
      await completeOnboardingWizard(page, locale);
      return user;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function uniqueStripeIds(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    customerId: `cus_e2e_${prefix}_${stamp}`,
    subscriptionId: `sub_e2e_${prefix}_${stamp}`,
  };
}

test.describe("profile.feature", () => {
  test("Scenario: View and edit identity", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await page.goto(`/${locale}/profile`);
    await expect(page.getByRole("heading", { name: /dein konto|your account/i })).toBeVisible();

    await page.getByLabel(/vorname|first name/i).fill("E2EUpdated");
    await page.getByLabel(/nachname|last name/i).fill(user.lastName);
    await page.getByLabel(/e-?mail/i).fill(user.email);
    await page.getByRole("button", { name: /^speichern$|^save$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/profile\\?saved=identity`));
    await expect(page.getByText(/profil aktualisiert|profile updated/i)).toBeVisible();
    await expect(page.getByLabel(/vorname|first name/i)).toHaveValue("E2EUpdated");
  });

  test("Scenario: Change password", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    await onboardFreshMember(page, locale);
    await page.goto(`/${locale}/profile`);
    await page.getByRole("link", { name: /passwort ändern|change password/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/profile/security`));
    await expect(page.getByRole("heading", { name: /sicherheit|security/i })).toBeVisible();
    // Full Neon Auth password mutation is provider-owned; entry point is Phase 7 scope.
    await expect(page.getByText(/neon auth|better auth|passwort|password/i).first()).toBeVisible();
  });

  test("Scenario: View billing information", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await setStripeBillingIds(user.email, uniqueStripeIds("view"));

    await page.goto(`/${locale}/profile/billing`);
    await expect(page.getByRole("heading", { name: /^abrechnung$|^billing$/i })).toBeVisible();
    await expect(page.getByText(/basic_berlin|basic berlin/i).first()).toBeVisible();
    await expect(page.getByText(/aktiv|active/i).first()).toBeVisible();
    await expect(
      page.getByText(/karte|card|zahlungsmethode|payment method/i).first(),
    ).toBeVisible();
  });

  test("Scenario: Update billing information", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await setStripeBillingIds(user.email, uniqueStripeIds("portal"));

    await page.goto(`/${locale}/profile/billing`);
    await expect(
      page.getByRole("button", { name: /zahlung & adresse aktualisieren|update payment/i }),
    ).toBeVisible();
    // Deep Stripe Customer Portal hosted UI: opt-in / staging (see e2e/README.md).
    // Fake cus_* ids make portal session creation fail — assert CTA + error path.
    await page
      .getByRole("button", { name: /zahlung & adresse aktualisieren|update payment/i })
      .click();
    await expect(
      page.getByText(/stripe-portal|portal|fehlgeschlagen|could not|error/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario: Cancel subscription", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await setStripeBillingIds(user.email, uniqueStripeIds("cancel"));

    await page.goto(`/${locale}/profile/billing`);
    await page.getByRole("link", { name: /abo kündigen|cancel subscription/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/profile/billing/cancel`));
    await expect(page.getByRole("heading", { name: /abo kündigen|cancel/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /zum periodenende kündigen|cancel at period end/i }),
    ).toBeVisible();

    // Live Stripe cancel is package/staging; seed CANCELLED_PENDING for post-cancel UI.
    await setSubscriptionStatus(user.email, "CANCELLED_PENDING");
    await page.goto(`/${locale}/profile/billing`);
    await expect(
      page
        .getByText(/kündigung zum periodenende|ends at the end of the period|period end/i)
        .first(),
    ).toBeVisible();
  });

  test("Scenario: Access account deletion and data export", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    await onboardFreshMember(page, locale);
    await page.goto(`/${locale}/profile`);
    await expect(page.getByRole("link", { name: /daten exportieren|export data/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /konto löschen|delete account/i })).toBeVisible();

    await page.getByRole("link", { name: /daten exportieren|export data/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/profile/data-export`));
    await expect(
      page.getByRole("heading", { name: /daten exportieren|export your data/i }),
    ).toBeVisible();

    await page.goto(`/${locale}/profile`);
    await page.getByRole("link", { name: /konto löschen|delete account/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/profile/delete-account`));
    await expect(
      page.getByRole("heading", { name: /konto löschen|delete account/i }),
    ).toBeVisible();
  });

  test('Scenario: Edit cultural preferences ("Vibes")', async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    await onboardFreshMember(page, locale);
    await page.goto(`/${locale}/profile/preferences`);
    await expect(
      page.getByRole("heading", { name: /vibes|präferenzen|preferences/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /präferenzen speichern|save preferences/i }).click();
    await expect(page.getByText(/präferenzen gespeichert|preferences saved/i)).toBeVisible();
  });

  test("Scenario: View credit wallet", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 12);
    await page.goto(`/${locale}/profile`);
    await expect(page.getByRole("heading", { name: /credit-wallet|credit wallet/i })).toBeVisible();
    await expect(page.getByRole("main").getByText(/12 credits/i)).toBeVisible();
    expect(await getUserCredits(user.email)).toBe(12);
  });

  test("Scenario: Refill credits", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    await onboardFreshMember(page, locale);
    await page.goto(`/${locale}/profile`);
    await page.getByRole("link", { name: /credits aufladen|refill credits/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/membership`));
  });
});
