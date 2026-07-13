import type { Page } from "@playwright/test";

import { signupFreshUser } from "../fixtures/auth";
import { expect, type Locale, test } from "../fixtures/base";
import { activateMemberForBooking, hasDatabaseUrl, setCreditBalance } from "../fixtures/billing";
import { completeOnboardingWizard } from "../fixtures/onboarding";
import {
  bumpEventCapacityViaAdmin,
  forceEventSoldOut,
  getSoldOutWaitlistEventId,
  hasAdminCredentials,
  SOLD_OUT_WAITLIST_TITLE,
} from "../fixtures/waitlist";

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

async function soldOutWaitlistPath(locale: Locale): Promise<{ eventId: string; path: string }> {
  const eventId = await getSoldOutWaitlistEventId();
  await forceEventSoldOut(eventId);
  return { eventId, path: `/${locale}/events/${eventId}/waitlist` };
}

test.describe("waitlist.feature", () => {
  test("Scenario: Join the waitlist", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required for sold-out seed + activation");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const { path } = await soldOutWaitlistPath(locale);
    await page.goto(path);
    await expect(page.getByRole("heading", { name: /warteliste|waitlist/i })).toBeVisible();
    await page.getByRole("button", { name: /warteliste beitreten|join waitlist/i }).click();

    await expect(
      page.getByRole("heading", { name: /du bist auf der warteliste|you are on the waitlist/i }),
    ).toBeVisible();
    await expect(page.getByText(/status:\s*waiting/i)).toBeVisible();
    await expect(page.getByText(SOLD_OUT_WAITLIST_TITLE).first()).toBeVisible();
  });

  test("Scenario: Joining the waitlist requires authentication", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to resolve sold-out event");

    const { path } = await soldOutWaitlistPath(locale);
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
  });

  test("Scenario: Duplicate waitlist join is prevented", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const { path } = await soldOutWaitlistPath(locale);
    await page.goto(path);
    await page.getByRole("button", { name: /warteliste beitreten|join waitlist/i }).click();
    await expect(
      page.getByRole("heading", { name: /du bist auf der warteliste|you are on the waitlist/i }),
    ).toBeVisible();

    // GET shows existing WAITING status (no second form) — created=false copy.
    await page.goto(path);
    await expect(
      page.getByText(/bereits auf der warteliste|already on the waitlist/i),
    ).toBeVisible();
    await expect(page.getByText(/status:\s*waiting/i)).toBeVisible();
  });

  test("Scenario: I can cancel my own waitlist entry", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const { path } = await soldOutWaitlistPath(locale);
    await page.goto(path);
    await page.getByRole("button", { name: /warteliste beitreten|join waitlist/i }).click();
    await page
      .getByRole("link", { name: /wartelisten-eintrag stornieren|cancel waitlist entry/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /warteliste stornieren|cancel waitlist/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /stornieren bestätigen|confirm cancel/i }).click();
    await expect(
      page.getByRole("heading", { name: /eintrag storniert|entry cancelled/i }),
    ).toBeVisible();
  });

  test("Scenario: Automatic promotion when capacity frees up", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required to bump capacity via admin edit");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const { eventId, path } = await soldOutWaitlistPath(locale);
    await page.goto(path);
    await page.getByRole("button", { name: /warteliste beitreten|join waitlist/i }).click();
    await expect(page.getByText(/status:\s*waiting/i)).toBeVisible();

    await bumpEventCapacityViaAdmin(page, locale, eventId, 1);

    // Re-login as member (admin logout lands on guest home).
    await page.goto(`/${locale}/login`);
    await page.getByLabel(/e-?mail/i).fill(user.email);
    await page.getByLabel(/^passwort$|^password$/i).fill(user.password);
    await page.getByRole("button", { name: /anmelden|sign in|log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });

    await page.goto(`/${locale}/bookings`);
    await expect(page.getByText(SOLD_OUT_WAITLIST_TITLE).first()).toBeVisible({ timeout: 20_000 });
  });

  test("Scenario: Promotion is skipped if I'm no longer eligible", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required to bump capacity via admin edit");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const { eventId, path } = await soldOutWaitlistPath(locale);
    await page.goto(path);
    await page.getByRole("button", { name: /warteliste beitreten|join waitlist/i }).click();
    await expect(page.getByText(/status:\s*waiting/i)).toBeVisible();

    await setCreditBalance(user.email, 0);
    await bumpEventCapacityViaAdmin(page, locale, eventId, 1);

    await page.goto(`/${locale}/login`);
    await page.getByLabel(/e-?mail/i).fill(user.email);
    await page.getByLabel(/^passwort$|^password$/i).fill(user.password);
    await page.getByRole("button", { name: /anmelden|sign in|log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });

    await page.goto(`/${locale}/bookings`);
    await expect(page.getByText(SOLD_OUT_WAITLIST_TITLE)).toHaveCount(0);

    await page.goto(path);
    // Still WAITING — join again shows existing status.
    await page.getByRole("button", { name: /warteliste beitreten|join waitlist/i }).click();
    await expect(
      page.getByText(/bereits auf der warteliste|already on the waitlist|status:\s*waiting/i),
    ).toBeVisible();
  });

  test("Scenario: Promotion respects queue order and partial capacity", async () => {
    test.skip(
      true,
      "Multi-user queue + partial capacity covered by packages/db waitlist.integration.test; e2e harness limitation",
    );
  });

  test("Scenario: Admin can manually trigger promotion for a specific entry", async () => {
    test.skip(true, "Phase 8 — admin waitlist promote UI");
  });

  test("Scenario: Admin visibility", async () => {
    test.skip(true, "Phase 8 — admin waitlist HQ UI");
  });

  test("Scenario: User visibility is scoped to their own entries", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const { path } = await soldOutWaitlistPath(locale);
    await page.goto(path);
    await page.getByRole("button", { name: /warteliste beitreten|join waitlist/i }).click();
    await expect(page.getByText(/status:\s*waiting/i)).toBeVisible();
    // Member surfaces only own entry status/cancel — no admin-wide waitlist table.
    await expect(
      page.getByRole("link", { name: /wartelisten-eintrag stornieren|cancel waitlist entry/i }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });
});
