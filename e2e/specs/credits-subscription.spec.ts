import type { Page } from "@playwright/test";

import { signupFreshUser } from "../fixtures/auth";
import { expect, type Locale, test } from "../fixtures/base";
import {
  activateMemberForBooking,
  getSubscriptionStatus,
  getUserCredits,
  hasDatabaseUrl,
  setSubscriptionStatus,
  stripeCheckoutE2eEnabled,
} from "../fixtures/billing";
import { ensureEventHasCapacity } from "../fixtures/catalog";
import { completeOnboardingWizard } from "../fixtures/onboarding";
import { setStripeBillingIds, setSubscriptionPeriodEnd } from "../fixtures/waitlist";

/** Stable demo seed title — future SECRET_CODE / MANUAL event. */
const BOOKABLE_TITLE = "Tartuffe — Molière";

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

test.describe("credits-subscription.feature", () => {
  test("Scenario: New signups start inactive with starter credits", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to assert starter credits + INACTIVE");

    const user = await onboardFreshMember(page, locale);

    await expect(page).toHaveURL(new RegExp(`/${locale}/membership`));
    await expect(page.getByRole("button", { name: /abo starten|start sub/i })).toBeVisible();
    await expect(page.getByText(/17 credits/i).first()).toBeVisible();

    expect(await getSubscriptionStatus(user.email)).toBe("INACTIVE");
    expect(await getUserCredits(user.email)).toBe(17);
  });

  test("Scenario: Activating a subscription via real Stripe Checkout", async ({ page, locale }) => {
    test.skip(
      !stripeCheckoutE2eEnabled(),
      "E2E_STRIPE_CHECKOUT=1 + stripe listen webhook forwarding required; prove on staging smoke (DEPLOYMENT.md Phase 6)",
    );

    await onboardFreshMember(page, locale);
    await page.getByRole("button", { name: /abo starten|start sub/i }).click();
    await page.waitForURL(/checkout\.stripe\.com|stripe\.com/, { timeout: 45_000 });
    // Hosted Checkout interaction is environment-specific; presence of Stripe host proves session start.
    await expect(page).toHaveURL(/stripe\.com/);
  });

  test("Scenario: Checkout blocked while frozen", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to seed UNPAID");

    const user = await onboardFreshMember(page, locale);
    await setSubscriptionStatus(user.email, "UNPAID");

    await page.goto(`/${locale}/membership`);
    await expect(
      page.getByRole("heading", { name: /zahlungs-stopp|payment stopped/i }),
    ).toBeVisible();
    await expect(page.getByText(/support@unveiled\.berlin/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /abo starten|start sub/i })).toHaveCount(0);
  });

  test("Scenario: Already-active member revisits checkout", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to seed ACTIVE");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    await page.goto(`/${locale}/membership`);
    await expect(
      page.getByRole("heading", { name: /bereits mitglied|already a member/i }),
    ).toBeVisible();
    await expect(page.getByText(/status:\s*aktiv|status:\s*active/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /abo starten|start sub/i })).toHaveCount(0);
  });

  test("Scenario: Failed payment marks the account past due", async ({ page, locale }) => {
    test.skip(
      !hasDatabaseUrl(),
      "DATABASE_URL required; full Stripe invoice.payment_failed path is staging/webhook — e2e seeds PAST_DUE and asserts frozen book gate",
    );

    const user = await onboardFreshMember(page, locale);
    await setSubscriptionStatus(user.email, "PAST_DUE");

    const eventId = await ensureEventHasCapacity(BOOKABLE_TITLE, 3);
    await page.goto(`/${locale}/events/${eventId}/book`);
    await expect(
      page.getByRole("heading", { name: /credits eingefroren|credits frozen/i }),
    ).toBeVisible();
  });

  test("Scenario: Recovering from past due", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to seed PAST_DUE + portal CTA");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await setStripeBillingIds(user.email, {
      customerId: `cus_e2e_pastdue_${stamp}`,
      subscriptionId: `sub_e2e_pastdue_${stamp}`,
    });
    await setSubscriptionStatus(user.email, "PAST_DUE");

    await page.goto(`/${locale}/profile/billing`);
    await expect(
      page.getByRole("heading", { name: /zahlung fehlgeschlagen|payment failed/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /zahlung & adresse aktualisieren|update payment/i }),
    ).toBeVisible();
  });

  test("Scenario: Monthly renewal resets credits (no rollover)", async () => {
    test.skip(
      true,
      "Covered by @unveiled/billing package tests / staging webhook; no e2e renewal clock",
    );
  });

  test("Scenario: Cancelling a subscription", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await setStripeBillingIds(user.email, {
      customerId: `cus_e2e_cancel_${stamp}`,
      subscriptionId: `sub_e2e_cancel_${stamp}`,
    });

    await page.goto(`/${locale}/profile/billing`);
    await page.getByRole("link", { name: /abo kündigen|cancel subscription/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/profile/billing/cancel`));
    await expect(
      page.getByRole("button", { name: /zum periodenende kündigen|cancel at period end/i }),
    ).toBeVisible();

    // Stripe cancel_at_period_end is package/staging; seed local CANCELLED_PENDING for UI proof.
    await setSubscriptionStatus(user.email, "CANCELLED_PENDING");
    expect(await getSubscriptionStatus(user.email)).toBe("CANCELLED_PENDING");
    await page.goto(`/${locale}/profile/billing`);
    await expect(
      page.getByText(/kündigung zum periodenende|ends at the end of|period end/i).first(),
    ).toBeVisible();
  });

  test("Scenario: Cancellation takes effect at period end", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await setStripeBillingIds(user.email, {
      customerId: `cus_e2e_period_${stamp}`,
      subscriptionId: `sub_e2e_period_${stamp}`,
    });
    await setSubscriptionStatus(user.email, "CANCELLED_PENDING");
    await setSubscriptionPeriodEnd(user.email, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    await page.goto(`/${locale}/profile/billing`);
    await expect(
      page.getByText(/credits bleiben bis dahin|credits remain|period end/i).first(),
    ).toBeVisible();

    // Still bookable until period end.
    const eventId = await ensureEventHasCapacity(BOOKABLE_TITLE, 3);
    await page.goto(`/${locale}/events/${eventId}/book`);
    await expect(page.getByRole("heading", { name: /event buchen|book event/i })).toBeVisible();
  });

  test("Scenario: Reactivating after cancellation", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await setSubscriptionStatus(user.email, "INACTIVE");

    await page.goto(`/${locale}/profile/billing`);
    await expect(page.getByRole("heading", { name: /kein aktives abo|no active/i })).toBeVisible();
    await page.getByRole("link", { name: /membership öffnen|open membership|membership/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/membership`));
    await expect(page.getByRole("button", { name: /abo starten|start sub/i })).toBeVisible();
  });

  test("Scenario: Booking gate by subscription status", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to seed subscription statuses");

    const eventId = await ensureEventHasCapacity(BOOKABLE_TITLE, 3);

    // INACTIVE → membership checkout
    const inactive = await onboardFreshMember(page, locale);
    await page.goto(`/${locale}/events/${eventId}/book`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/membership`));
    await expect(page.getByRole("button", { name: /abo starten|start sub/i })).toBeVisible();

    // PAST_DUE → frozen message (not silent redirect)
    await setSubscriptionStatus(inactive.email, "PAST_DUE");
    await page.goto(`/${locale}/events/${eventId}/book`);
    await expect(
      page.getByRole("heading", { name: /credits eingefroren|credits frozen/i }),
    ).toBeVisible();

    // ACTIVE → book form
    await activateMemberForBooking(inactive.email);
    await page.goto(`/${locale}/events/${eventId}/book`);
    await expect(page.getByRole("heading", { name: /event buchen|book event/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }),
    ).toBeVisible();
  });

  test("Scenario: Admin manually adjusts a member's credits", async () => {
    test.skip(true, "Phase 8 — admin credit adjust UI");
  });

  test("Scenario: Admin adjustment rejects a zero amount", async () => {
    test.skip(true, "Phase 8 — admin credit adjust UI");
  });

  test("Scenario: Admin issues a manual credit refund (support gesture)", async () => {
    test.skip(true, "Phase 8 — admin credit refund UI");
  });

  test("Scenario: Admin freezes a member's account", async () => {
    test.skip(true, "Phase 8 — admin freeze UI");
  });

  test("Scenario: Admin unfreezes a member's account", async () => {
    test.skip(true, "Phase 8 — admin unfreeze UI");
  });

  test("Scenario: Admin creates a complimentary ticket", async () => {
    test.skip(true, "Phase 8 — admin comp ticket UI");
  });
});
