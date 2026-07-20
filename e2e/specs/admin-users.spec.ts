import type { Page } from "@playwright/test";
import { DEMO_DISCOVERY_TITLES } from "@unveiled/db/seed-titles";

import { selectOptionByLabel, settleAdminSession } from "../fixtures/admin";
import {
  hasAdminCredentials,
  loginAdminForMembershipHq,
  openMemberDetailByEmail,
  openMembershipHq,
  searchMembers,
} from "../fixtures/admin-users";
import { signupFreshUser } from "../fixtures/auth";
import { expect, type Locale, test } from "../fixtures/base";
import {
  activateMemberForBooking,
  getSubscriptionStatus,
  getUserCredits,
  hasDatabaseUrl,
} from "../fixtures/billing";
import { ensureEventHasCapacity } from "../fixtures/catalog";
import { completeOnboardingWizard } from "../fixtures/onboarding";

/** Stable demo seed — SECRET_CODE / MANUAL, creditPrice 2, future date. */
const BOOKABLE_TITLE = DEMO_DISCOVERY_TITLES.theaterFuture;

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

test.describe("admin-users.feature", () => {
  test.beforeEach(async ({ page, locale }, testInfo) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required for Membership HQ e2e");
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required for Membership HQ e2e");
    if (testInfo.tags.includes("@skip-no-ui")) {
      return;
    }
    void page;
    void locale;
  });

  test("Scenario: List all members", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMembershipHq(page, locale);

    await expect(page.getByRole("table", { name: /mitglieder|users/i })).toBeVisible();
    await searchMembers(page, user.email);
    await expect(page.getByRole("row").filter({ hasText: user.email })).toBeVisible();
  });

  test("Scenario: Search members", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMembershipHq(page, locale);
    await searchMembers(page, user.email);

    const row = page.getByRole("row").filter({ hasText: user.email });
    await expect(row).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: user.email })).toHaveCount(1);
  });

  test("Scenario: View a member's collapsed summary", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 12);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMembershipHq(page, locale);
    await searchMembers(page, user.email);

    const row = page.getByRole("row").filter({ hasText: user.email });
    await expect(row).toBeVisible();
    await expect(row.getByText("USER")).toBeVisible();
    await expect(row.getByText("ACTIVE")).toBeVisible();
    await expect(row.getByText("12")).toBeVisible();
  });

  test('Scenario: Expand a member\'s detail / "intel" panel', async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMemberDetailByEmail(page, locale, user.email);

    await expect(page.getByRole("heading", { name: /präferenzen|preferences/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /verlauf|history/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /verhalten|behavior/i })).toBeVisible();
    await expect(page.getByText(user.email)).toBeVisible();
  });

  test("Scenario: Adjust a member's credits from their detail panel", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 10);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    const userId = await openMemberDetailByEmail(page, locale, user.email);

    await page.getByRole("link", { name: /credits anpassen|adjust credits/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/${userId}/adjust-credits`));

    await page.getByRole("textbox", { name: /betrag|amount/i }).fill("3");
    await page.getByRole("textbox", { name: /begründung|reason/i }).fill("E2E admin adjust");
    await page.getByRole("button", { name: /credits anpassen|adjust credits/i }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/${userId}`));
    await expect(page.getByText(/credits wurden angepasst|credits were adjusted/i)).toBeVisible();
    expect(await getUserCredits(user.email)).toBe(13);
  });

  test("Scenario: Freeze or unfreeze a member from their detail panel", async ({
    page,
    locale,
  }) => {
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    const userId = await openMemberDetailByEmail(page, locale, user.email);

    await page
      .getByRole("link", { name: /einfrieren\s*\/\s*auftauen|freeze\s*\/\s*unfreeze/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/${userId}/freeze`));
    await page.getByRole("button", { name: /^einfrieren$|^freeze$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/${userId}`));
    expect(await getSubscriptionStatus(user.email)).toBe("UNPAID");

    await page
      .getByRole("link", { name: /einfrieren\s*\/\s*auftauen|freeze\s*\/\s*unfreeze/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/${userId}/freeze`));
    await page.getByRole("button", { name: /^auftauen$|^unfreeze$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/${userId}`));
    expect(await getSubscriptionStatus(user.email)).toBe("ACTIVE");
  });

  test("Scenario: Issue a complimentary ticket to a member", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await page.context().clearCookies();

    await ensureEventHasCapacity(BOOKABLE_TITLE, 3);

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    const userId = await openMemberDetailByEmail(page, locale, user.email);

    const creditsBefore = await getUserCredits(user.email);

    await page.getByRole("link", { name: /comp-ticket|comp ticket/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/${userId}/comp-ticket`));

    await selectOptionByLabel(page, /event\*/i, new RegExp(BOOKABLE_TITLE));
    await page.getByRole("button", { name: /comp-ticket ausstellen|issue comp ticket/i }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/${userId}`), {
      timeout: 60_000,
    });
    await expect(
      page.getByText(/comp-ticket wurde erstellt|comp ticket was created/i),
    ).toBeVisible();
    expect(await getUserCredits(user.email)).toBe(creditsBefore);

    await expect(page.getByText(BOOKABLE_TITLE)).toBeVisible({ timeout: 10_000 });
  });
});
