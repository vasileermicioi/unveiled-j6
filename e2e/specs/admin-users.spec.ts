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
    // Location intel: zip from onboarding (10115); travel distance omitted when unset (legacy remnant only)
    await expect(page.getByText(/standort|location/i).first()).toBeVisible();
    await expect(page.getByText(/10115/)).toBeVisible();
    await expect(page.getByText(/10\s*km/i)).toHaveCount(0);
    await expect(page.getByText(/bezirke|districts/i)).toHaveCount(0);
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

  test("Scenario: Member rows show combined name and email", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMembershipHq(page, locale);
    await searchMembers(page, user.email);

    const table = page.getByRole("table", { name: /mitglieder|users/i });
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /mitglied|member/i })).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: user.email });
    await expect(row).toBeVisible();
    await expect(row.getByRole("link").first()).toBeVisible();
    await expect(row.getByText(user.email)).toBeVisible();
  });

  test("Scenario: Created column shows registration date", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMembershipHq(page, locale);
    await searchMembers(page, user.email);

    const table = page.getByRole("table", { name: /mitglieder|users/i });
    await expect(table.getByRole("columnheader", { name: /erstellt|created/i })).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: user.email });
    await expect(row).toBeVisible();
    await expect(row.getByText(/2026/)).toBeVisible();
  });

  test("Scenario: Sort members via header links", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMembershipHq(page, locale);
    await searchMembers(page, user.email);

    const table = page.getByRole("table", { name: /mitglieder|users/i });
    const createdHeader = table.getByRole("link", { name: /erstellt|created/i });
    await expect(createdHeader).toBeVisible();
    await createdHeader.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/sort=created/);
    await expect(page).toHaveURL(/dir=desc/);
    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(user.email)}`));

    const createdHeaderToggled = table.getByRole("link", { name: /erstellt|created/i });
    await createdHeaderToggled.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/sort=created/);
    await expect(page).toHaveURL(/dir=asc/);
    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(user.email)}`));
  });

  test("Scenario: Filter members by subscription", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 12);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMembershipHq(page, locale);

    await page
      .getByRole("searchbox", { name: /name oder e-mail|search name or email/i })
      .fill(user.email);
    await selectOptionByLabel(page, /^(abo|subscription)$/i, /ACTIVE/);
    await page.getByRole("button", { name: /suchen|search/i }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/subscription=ACTIVE/);
    const row = page.getByRole("row").filter({ hasText: user.email });
    await expect(row).toBeVisible();
    await expect(row.getByText("ACTIVE")).toBeVisible();
  });

  test("Scenario: Filter members by numeric range", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 12);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);

    // Numeric ranges are URL query params (no form controls); the table proves them.
    await page.goto(
      `/${locale}/admin/users?q=${encodeURIComponent(user.email)}&creditsMin=10&creditsMax=15&bookingsMin=0&bookingsMax=10&eventOpensMin=0&eventOpensMax=10`,
    );
    await expect(page.getByRole("table", { name: /mitglieder|users/i })).toBeVisible();

    await expect(page).toHaveURL(/creditsMin=10/);
    await expect(page).toHaveURL(/creditsMax=15/);
    await expect(page).toHaveURL(/bookingsMin=0/);
    await expect(page).toHaveURL(/eventOpensMin=0/);
    const row = page.getByRole("row").filter({ hasText: user.email });
    await expect(row).toBeVisible();
    await expect(row.getByText("12")).toBeVisible();
  });

  test("Scenario: Filter members by created date range", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);

    // Created range is URL query params (no form controls); the table proves it.
    await page.goto(
      `/${locale}/admin/users?q=${encodeURIComponent(user.email)}&createdFrom=2026-01-01&createdTo=2027-12-31`,
    );
    await expect(page.getByRole("table", { name: /mitglieder|users/i })).toBeVisible();

    await expect(page).toHaveURL(/createdFrom=2026-01-01/);
    await expect(page).toHaveURL(/createdTo=2027-12-31/);
    await expect(page.getByRole("row").filter({ hasText: user.email })).toBeVisible();

    await page.goto(
      `/${locale}/admin/users?q=${encodeURIComponent(user.email)}&createdFrom=2020-01-01&createdTo=2020-01-31`,
    );
    await expect(page.getByRole("table", { name: /mitglieder|users/i })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: user.email })).toHaveCount(0);
  });

  test("Scenario: Sort and filter compose through pagination", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 12);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMembershipHq(page, locale);

    await page
      .getByRole("searchbox", { name: /name oder e-mail|search name or email/i })
      .fill(user.email);
    await selectOptionByLabel(page, /^(abo|subscription)$/i, /ACTIVE/);
    await page.getByRole("button", { name: /suchen|search/i }).click();
    await page.waitForLoadState("networkidle");

    const table = page.getByRole("table", { name: /mitglieder|users/i });
    await table.getByRole("link", { name: /erstellt|created/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/subscription=ACTIVE/);
    await expect(page).toHaveURL(/sort=created/);

    const filteredUrl = page.url();
    await page.goto(`${filteredUrl}${filteredUrl.includes("?") ? "&" : "?"}page=2`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/subscription=ACTIVE/);
    await expect(page).toHaveURL(/sort=created/);
    await expect(page.getByLabel(/^(abo|subscription)$/i)).not.toBeHidden();
  });

  test("Scenario: Reset filters", async ({ page, locale }) => {
    const user = await onboardFreshMember(page, locale);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMembershipHq(page, locale);
    await searchMembers(page, user.email);
    await expect(page).toHaveURL(/q=/);

    await page.getByRole("link", { name: /filter zurücksetzen|reset filters/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/?$`));
    await expect(page.getByRole("table", { name: /mitglieder|users/i })).toBeVisible();
  });
});
