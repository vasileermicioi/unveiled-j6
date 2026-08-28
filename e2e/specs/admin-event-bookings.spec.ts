import { settleAdminSession } from "../fixtures/admin";
import {
  bookPaidTicket,
  createSecretCodeE2eEvent,
  filterBookingsIndexByTitle,
  hasAdminCredentials,
  hasDatabaseUrl,
  joinEventWaitlist,
  loginAdmin,
  onboardFreshMember,
  openAdminBookingsTab,
  openEventBookingsFromCatalog,
  submitCancelAll,
} from "../fixtures/admin-event-bookings";
import { loginAdminForMembershipHq } from "../fixtures/admin-users";
import { expect, test } from "../fixtures/base";

test.describe("admin-event-bookings.feature", () => {
  test.beforeEach(async () => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");
  });

  test("Scenario: Admin opens the Bookings tab", async ({ page, locale }) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required");
    const event = await createSecretCodeE2eEvent();
    await bookPaidTicket(page, locale, event.id);
    await page.context().clearCookies();

    await loginAdmin(page, locale);
    await openAdminBookingsTab(page, locale);
    await filterBookingsIndexByTitle(page, event.title);

    const row = page.getByRole("row").filter({ hasText: event.title });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: event.title }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/${event.id}/bookings`));
    await expect(page.getByRole("heading", { name: /^buchungen$|^bookings$/i })).toBeVisible();
  });

  test("Scenario: Admin views bookings for one event", async ({ page, locale }) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required");
    const event = await createSecretCodeE2eEvent();
    const paid = await bookPaidTicket(page, locale, event.id);
    await page.context().clearCookies();

    await loginAdmin(page, locale);
    await page.goto(`/${locale}/admin/events/${event.id}/bookings`);
    await expect(page.getByRole("table", { name: /^buchungen$|^bookings$/i })).toBeVisible({
      timeout: 20_000,
    });

    const row = page.getByRole("row").filter({ hasText: paid.email });
    await expect(row).toBeVisible();
    await expect(row.getByText(/bestätigt|confirmed/i)).toBeVisible();
    await expect(
      row.getByRole("link", { name: /buchung stornieren|cancel booking/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: /alle bestätigten buchungen stornieren|cancel all confirmed bookings/i,
      }),
    ).toBeVisible();
  });

  test("Scenario: Empty event bookings", async ({ page, locale }) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required");
    const event = await createSecretCodeE2eEvent({
      title: `E2E Empty Bookings ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openEventBookingsFromCatalog(page, locale, event.title, event.id);

    await expect(
      page.getByText(/keine buchungen für dieses event\.|no bookings for this event\./i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: /alle bestätigten buchungen stornieren|cancel all confirmed bookings/i,
      }),
    ).toHaveCount(0);
  });

  test("Scenario: Admin cancels all bookings from the confirm page", async ({ page, locale }) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required");
    const event = await createSecretCodeE2eEvent();
    const paid = await bookPaidTicket(page, locale, event.id);
    await page.context().clearCookies();
    await joinEventWaitlist(page, locale, event.id);
    await page.context().clearCookies();

    await loginAdmin(page, locale);
    await page.goto(`/${locale}/admin/events/${event.id}/bookings`);
    await page
      .getByRole("link", {
        name: /alle bestätigten buchungen stornieren|cancel all confirmed bookings/i,
      })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/${locale}/admin/events/${event.id}/bookings/cancel-all`),
    );

    await page
      .getByRole("textbox", { name: /grund \(erforderlich\)|reason \(required\)/i })
      .fill("E2E cancel-all");
    await page
      .getByRole("button", { name: /stornierung bestätigen|confirm cancellation/i })
      .click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/${event.id}/bookings(\\?|$)`));
    await expect(
      page.getByText(
        /buchungen storniert\. credits und gutscheine wurden zurückgegeben\.|bookings cancelled\. credits and vouchers were returned\./i,
      ),
    ).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: paid.email });
    await expect(row.getByText(/storniert|cancelled/i)).toBeVisible();
  });

  test("Scenario: Cancel-all confirm rejects an empty reason", async ({ page, locale }) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required");
    const event = await createSecretCodeE2eEvent();
    const paid = await bookPaidTicket(page, locale, event.id);
    await page.context().clearCookies();

    await loginAdmin(page, locale);
    await submitCancelAll(page, locale, event.id, "   ");

    await expect(page).toHaveURL(
      new RegExp(`/${locale}/admin/events/${event.id}/bookings/cancel-all`),
    );
    await expect(page.getByText(/begründung ist erforderlich|a reason is required/i)).toBeVisible();

    await page.goto(`/${locale}/admin/events/${event.id}/bookings`);
    const row = page.getByRole("row").filter({ hasText: paid.email });
    await expect(row.getByText(/bestätigt|confirmed/i)).toBeVisible();
  });

  test("Scenario: Member cannot open the Bookings tab", async ({ page, locale }) => {
    await onboardFreshMember(page, locale);
    await page.goto(`/${locale}/admin/bookings`);
    await expect(page).not.toHaveURL(/\/admin\/bookings/);
    await expect(
      page.getByRole("heading", { name: /buchungen nach event|bookings by event/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("table", { name: /buchungen nach event|bookings by event/i }),
    ).toHaveCount(0);
  });
});
