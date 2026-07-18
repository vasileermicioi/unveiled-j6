import type { Page } from "@playwright/test";

import { settleAdminSession } from "../fixtures/admin";
import {
  hasAdminCredentials,
  loginAdminForMembershipHq,
  openMemberDetailByEmail,
} from "../fixtures/admin-users";
import { signupFreshUser } from "../fixtures/auth";
import { expect, type Locale, test } from "../fixtures/base";
import {
  activateMemberForBooking,
  getUserCredits,
  hasDatabaseUrl,
  setSubscriptionStatus,
} from "../fixtures/billing";
import { ensureEventHasCapacity } from "../fixtures/catalog";
import { completeOnboardingWizard } from "../fixtures/onboarding";
import {
  forceEventSoldOut,
  getSoldOutWaitlistEventId,
  SOLD_OUT_WAITLIST_TITLE,
} from "../fixtures/waitlist";

/** Stable demo seed — SECRET_CODE / MANUAL, creditPrice 2, future date. */
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

async function bookableEventPath(locale: Locale): Promise<string> {
  const eventId = await ensureEventHasCapacity(BOOKABLE_TITLE, 5);
  return `/${locale}/events/${eventId}`;
}

test.describe("booking.feature", () => {
  test("Scenario: Booking requires authentication", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to resolve seeded event id");

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
  });

  test("Scenario: Booking requires an active subscription", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    await onboardFreshMember(page, locale);
    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/membership`));
    await expect(page.getByRole("button", { name: /abo starten|start sub/i })).toBeVisible();
  });

  test("Scenario: Member ticket quantity follows credits and capacity", async ({
    page,
    locale,
  }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to activate member + resolve event");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 17);
    // Tartuffe creditPrice 2 → floor(17/2)=8; ensure capacity allows > 3
    const eventId = await ensureEventHasCapacity(BOOKABLE_TITLE, 8);

    await page.goto(`/${locale}/events/${eventId}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });

    const increase = page.getByRole("button", { name: /ticket mehr|increase tickets/i });
    await expect(increase).toBeVisible();
    // From 1 → 4 (past former hard max of 3); total = 4 × 2 credits
    await increase.click();
    await increase.click();
    await increase.click();
    await expect(page.getByText(/8 credits/i).first()).toBeVisible();
    await expect(increase).toBeEnabled();
  });

  test("Scenario: Successful booking", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to activate member + resolve event");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();

    await expect(page).toHaveURL(/\/book\/confirm/);
    await expect(
      page.getByRole("heading", { name: /buchung bestätigt|booking confirmed/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/TARTUFFE|DEIN TICKET-CODE|YOUR TICKET CODE/i).first(),
    ).toBeVisible();
  });

  test("Scenario Outline: Redemption info by ticket type and secret code mode — ticketType = SECRET_CODE, mode = MANUAL", async ({
    page,
    locale,
  }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
    await expect(page).toHaveURL(/\/book\/confirm/);
    await expect(page.getByText("TARTUFFE", { exact: true })).toBeVisible();
    await expect(page.getByText(/abendkasse|box office|einlass|entry/i).first()).toBeVisible();
  });

  test("Scenario Outline: Redemption info by ticket type and secret code mode — ticketType = SECRET_CODE, mode = SHARED_GENERATED", async () => {
    test.skip(
      true,
      "Deferred — demo seed has no SHARED_GENERATED event; Phase 6 covers MANUAL via seed",
    );
  });

  test("Scenario Outline: Redemption info by ticket type and secret code mode — ticketType = SECRET_CODE, mode = UNIQUE_PER_BOOKING", async () => {
    test.skip(
      true,
      "Deferred — demo seed has no UNIQUE_PER_BOOKING event; Phase 6 covers MANUAL via seed",
    );
  });

  test("Scenario Outline: Redemption info by ticket type and secret code mode — ticketType = VOUCHER, mode = (n/a)", async () => {
    test.skip(
      true,
      "Deferred — demo seed has no VOUCHER event; Phase 6 covers SECRET_CODE MANUAL via seed",
    );
  });

  test("Scenario: Sold out — automatic waitlist offer", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required for sold-out seed");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const eventId = await getSoldOutWaitlistEventId();
    await forceEventSoldOut(eventId);

    await page.goto(`/${locale}/events/${eventId}`);
    await expect(page.getByText(SOLD_OUT_WAITLIST_TITLE).first()).toBeVisible();
    await expect(page.getByText(/ausverkauft|sold out|warteliste|waitlist/i).first()).toBeVisible();
    await page.getByRole("link", { name: /auf die warteliste|join waitlist/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/events/${eventId}/waitlist`));
    await expect(page.getByRole("heading", { name: /warteliste|waitlist/i })).toBeVisible();
  });

  test("Scenario: Booking fails — insufficient credits", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to seed low credit balance");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 0);

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();

    await expect(page.getByText(/nicht genug credits|not enough credits/i)).toBeVisible();
    await expect(page).not.toHaveURL(/\/book\/confirm/);
  });

  test("Scenario: Booking fails — subscription frozen (past due)", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to seed PAST_DUE");

    const user = await onboardFreshMember(page, locale);
    await setSubscriptionStatus(user.email, "PAST_DUE");

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await expect(
      page.getByRole("heading", { name: /credits eingefroren|credits frozen/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/zahlungsgestört|past due|zahlungsmethode|payment method/i).first(),
    ).toBeVisible();
  });

  test("Scenario: Idempotent retry", async () => {
    test.skip(
      true,
      "Idempotency covered by packages/db book-event.integration.test; book form issues a fresh idempotencyKey each GET",
    );
  });

  test("Scenario: Post-booking actions", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
    await expect(page).toHaveURL(/\/book\/confirm/);

    await expect(page.getByRole("button", { name: /code kopieren|copy code/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /kalender \(\.ics\)|download calendar/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: /support@unveiled\.berlin/i }),
    ).toBeVisible();
  });

  test("Scenario: Booking confirmation email", async () => {
    test.skip(
      true,
      "No email capture harness in Playwright; assert via Resend dashboard on staging smoke (DEPLOYMENT.md Phase 6)",
    );
  });

  test("Scenario: Admin cancels a confirmed booking", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required for admin cancel");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
    await expect(page).toHaveURL(/\/book\/confirm/);

    const creditsBefore = await getUserCredits(user.email);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMemberDetailByEmail(page, locale, user.email);

    await page
      .getByRole("link", { name: /stornieren|cancel/i })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/bookings/.+/cancel`));
    await page.getByRole("textbox", { name: /begründung|reason/i }).fill("E2E admin cancel");
    await page.getByRole("button", { name: /buchung stornieren|cancel booking/i }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/`));
    await expect(page.getByText(/buchung wurde storniert|booking was cancelled/i)).toBeVisible();
    expect(await getUserCredits(user.email)).toBe(creditsBefore);
  });

  test("Scenario: Cannot cancel a booking that is not confirmed", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required for admin cancel");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
    await expect(page).toHaveURL(/\/book\/confirm/);
    await page.context().clearCookies();

    await loginAdminForMembershipHq(page, locale);
    await settleAdminSession(page, locale);
    await openMemberDetailByEmail(page, locale, user.email);

    await page
      .getByRole("link", { name: /stornieren|cancel/i })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/bookings/.+/cancel`));
    const cancelUrl = page.url();
    await page.getByRole("textbox", { name: /begründung|reason/i }).fill("E2E first cancel");
    await page.getByRole("button", { name: /buchung stornieren|cancel booking/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/`));

    await page.goto(cancelUrl);
    await expect(page.getByText(/nur bestätigte buchungen|only confirmed bookings/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /buchung stornieren|cancel booking/i }),
    ).toBeDisabled();
  });

  test("Scenario: Members cannot self-cancel or self-refund", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await expect(
      page.getByText(/sichere rsvp|secure rsvp|keine erstattung|no refunds/i),
    ).toBeVisible();
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
    await expect(page).toHaveURL(/\/book\/confirm/);

    await expect(
      page.getByRole("button", { name: /stornieren|cancel|refund|erstattung/i }),
    ).toHaveCount(0);
    await expect(page.getByRole("link", { name: /stornieren|cancel booking|refund/i })).toHaveCount(
      0,
    );

    await page.goto(`/${locale}/bookings`);
    await expect(page.getByRole("heading", { name: /meine tickets|my tickets/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /stornieren|cancel|refund|erstattung/i }),
    ).toHaveCount(0);
  });
});
