import type { Page } from "@playwright/test";
import { DEMO_DISCOVERY_TITLES } from "@unveiled/db/seed-titles";

import { privateR2Configured, settleAdminSession } from "../fixtures/admin";
import {
  bookPaidTicket,
  createSecretCodeE2eEvent,
  getBookingStatusesForUserEvent,
  loginAdmin,
  submitCancelAll,
} from "../fixtures/admin-event-bookings";
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
import {
  createPricedSlotEvent,
  ensureEventHasCapacity,
  seedGrandfatheredPromoBooking,
  setE2eEventPublished,
} from "../fixtures/catalog";
import { completeOnboardingWizard } from "../fixtures/onboarding";
import {
  forceEventSoldOut,
  getSoldOutWaitlistEventId,
  SOLD_OUT_WAITLIST_TITLE,
} from "../fixtures/waitlist";

/** Stable demo seed — SECRET_CODE, creditPrice 2, future date. */
const BOOKABLE_TITLE = DEMO_DISCOVERY_TITLES.theaterFuture;
const SECRET_CODE = "ICHWILLABE26";
const PROMO_TITLE = DEMO_DISCOVERY_TITLES.voucherPromo;
const PDF_TITLE = DEMO_DISCOVERY_TITLES.voucherPdf;

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

async function bookableEventPath(locale: Locale, title = BOOKABLE_TITLE): Promise<string> {
  const eventId = await ensureEventHasCapacity(title, 5);
  return `/${locale}/events/${eventId}`;
}

function alreadyBookedMessage(locale: Locale): string {
  return locale === "de"
    ? "Du hast das bereits gebucht. Du kannst es unter Meine Tickets nachschauen."
    : "You've already booked this. You can check it in My Tickets.";
}

async function confirmBooking(page: Page, locale: Locale, title: string): Promise<string> {
  const eventPath = await bookableEventPath(locale, title);
  await page.goto(`${eventPath}/book`);
  await expect(page).toHaveURL(new RegExp(`/${locale}/events/.+/book`));
  await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
  await expect(page).toHaveURL(/\/book\/confirm/, { timeout: 15_000 });
  return eventPath;
}

async function expectAlreadyBookedChrome(page: Page, locale: Locale) {
  await expect(page.getByText(alreadyBookedMessage(locale))).toBeVisible();
  const ticketsLink = page.getByRole("main").getByRole("link", {
    name: locale === "de" ? "Meine Tickets" : "My Tickets",
  });
  await expect(ticketsLink).toBeVisible();
  await expect(ticketsLink).toHaveAttribute("href", `/${locale}/bookings`);
  await expect(
    page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /tickets buchen|book tickets/i })).toHaveCount(0);
}

async function expectMaskedCode(page: Page, code: string) {
  const codeInput = page.locator(`input[type="password"][value="${code}"]`).first();
  await expect(codeInput).toBeVisible();
  await expect(page.getByText(code, { exact: true })).toHaveCount(0);
}

async function revealAndHideCode(page: Page, code: string) {
  const codeInput = page.locator(`input[value="${code}"]`).first();
  await expect(codeInput).toHaveAttribute("type", "password");
  await expect(page.getByText(code, { exact: true })).toHaveCount(0);

  // Reveal control is the eye button adjacent to this code field.
  const reveal = codeInput.locator("xpath=following-sibling::button[1]");
  await reveal.click();
  await expect(codeInput).toHaveAttribute("type", "text");

  const hide = codeInput.locator("xpath=following-sibling::button[1]");
  await hide.click();
  await expect(codeInput).toHaveAttribute("type", "password");
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

  test("Scenario: Member cannot select more than one ticket", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to activate member + resolve event");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 17);
    const eventId = await ensureEventHasCapacity(BOOKABLE_TITLE, 5);

    await page.goto(`/${locale}/events/${eventId}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/anzahl tickets|ticket count/i)).toHaveCount(0);
    await expect(page.getByText(/2 CREDITS/i).first()).toBeVisible();

    await page.goto(`/${locale}/events/${eventId}/book`);
    await expect(page.getByLabel(/anzahl tickets|ticket count/i)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }),
    ).toBeVisible();
  });

  test("Scenario: Reopening a booked single-slot event", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to activate member + resolve event");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    const eventPath = await confirmBooking(page, locale, BOOKABLE_TITLE);

    await page.goto(eventPath);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expectAlreadyBookedChrome(page, locale);

    await page.goto(`${eventPath}/book`);
    await expectAlreadyBookedChrome(page, locale);
  });

  test("Scenario: Booked hour on a multi-hour event", async ({ page, locale }) => {
    test.skip(
      !hasDatabaseUrl(),
      "DATABASE_URL required to seed multi-slot event + activate member",
    );

    const event = await createPricedSlotEvent();
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 17);

    await page.goto(`/${locale}/events/${event.id}`);
    await expect(page.getByRole("heading", { level: 1, name: event.title })).toBeVisible({
      timeout: 15_000,
    });
    await page
      .getByRole("link", { name: /tickets buchen|book tickets/i })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/events/${event.id}/book`));
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
    await expect(page).toHaveURL(/\/book\/confirm/, { timeout: 15_000 });

    await page.goto(`/${locale}/events/${event.id}`);
    await expectAlreadyBookedChrome(page, locale);
    const slotSelect = page.getByLabel(/datum und uhrzeit|date and time/i);
    await expect(slotSelect).toBeVisible();
    await slotSelect.selectOption({ index: 1 });
    await expect(
      page.getByRole("link", { name: /tickets buchen|book tickets/i }).first(),
    ).toBeVisible();
    await page
      .getByRole("link", { name: /tickets buchen|book tickets/i })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/events/${event.id}/book`));
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
    await expect(page).toHaveURL(/\/book\/confirm/, { timeout: 15_000 });
  });

  test("Scenario: Successful booking", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required to activate member + resolve event");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    const eventPath = await bookableEventPath(locale);
    await page.goto(`${eventPath}/book`);
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();

    await expect(page).toHaveURL(/\/book\/confirm/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /buchung bestätigt|booking confirmed/i }),
    ).toBeVisible();
    await expect(page.getByText(/DEIN TICKET-CODE|YOUR TICKET CODE/i).first()).toBeVisible();
    await expectMaskedCode(page, SECRET_CODE);
  });

  test("Scenario: Book a priced datetime slot", async ({ page, locale }) => {
    test.skip(
      !hasDatabaseUrl(),
      "DATABASE_URL required to seed multi-slot event + activate member",
    );

    const event = await createPricedSlotEvent();
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email, 17);
    const creditsBefore = await getUserCredits(user.email);

    await page.goto(`/${locale}/events/${event.id}`);
    await expect(page.getByRole("heading", { level: 1, name: event.title })).toBeVisible({
      timeout: 15_000,
    });
    const slotSelect = page.getByLabel(/datum und uhrzeit|date and time/i);
    await expect(slotSelect).toBeVisible();
    const eveningIso = await slotSelect.locator("option").nth(1).getAttribute("value");
    expect(eveningIso).toBeTruthy();
    await page.goto(
      `/${locale}/events/${event.id}/book?dateTime=${encodeURIComponent(eveningIso ?? "")}`,
    );
    const bookSelect = page.getByLabel(/datum und uhrzeit|date and time/i);
    await expect(bookSelect).toBeVisible();
    await bookSelect.selectOption(eveningIso ?? "");
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
    await expect(page).toHaveURL(/\/book\/confirm/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /buchung bestätigt|booking confirmed/i }),
    ).toBeVisible();

    const eveningLabel = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin",
    }).format(event.evening);
    await expect(
      page.getByText(new RegExp(eveningLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
    ).toBeVisible();
    expect(await getUserCredits(user.email)).toBe(creditsBefore - 4);
  });

  test("Scenario Outline: Redemption info by ticket type — ticketType = SECRET_CODE", async ({
    page,
    locale,
  }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);

    await confirmBooking(page, locale, BOOKABLE_TITLE);
    await expectMaskedCode(page, SECRET_CODE);
    await revealAndHideCode(page, SECRET_CODE);
    await expect(page.getByText(/abendkasse|box office|einlass|entry/i).first()).toBeVisible();
  });

  test("Scenario Outline: Redemption info by ticket type — ticketType = VOUCHER_PROMO", async ({
    page,
    locale,
  }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await ensureEventHasCapacity(PROMO_TITLE, 4);

    await confirmBooking(page, locale, PROMO_TITLE);
    const allocatedCode = await page.locator('input[type="password"]').first().inputValue();
    expect(allocatedCode.length).toBeGreaterThan(0);
    await revealAndHideCode(page, allocatedCode);
    await expect(
      page.getByRole("link", { name: /zur partner-website|open partner website/i }).first(),
    ).toBeVisible();
  });

  test("Scenario Outline: Redemption info by ticket type — ticketType = VOUCHER_PDF", async ({
    page,
    locale,
  }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");
    test.skip(
      !privateR2Configured(),
      "S3_PRIVATE_BUCKET (and shared/override S3 credentials) required for seeded PDF voucher download",
    );

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await ensureEventHasCapacity(PDF_TITLE, 4);

    await confirmBooking(page, locale, PDF_TITLE);
    const downloadLinks = page.getByRole("link", { name: /pdf herunterladen|download pdf/i });
    await expect(downloadLinks).toHaveCount(1);

    const href = await downloadLinks.first().getAttribute("href");
    expect(href).toMatch(/\/bookings\/.+\/tickets\/.+\/voucher\.pdf$/);
    if (!href) {
      throw new Error("Expected PDF download href");
    }
    const response = await page.request.get(new URL(href, page.url()).toString());
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(/application\/pdf/i);
  });

  test("Scenario: Booking fails — insufficient voucher inventory", async () => {
    test.skip(
      true,
      "Covered by packages/db book-event.integration.test (INSUFFICIENT_VOUCHER_INVENTORY)",
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

    await confirmBooking(page, locale, BOOKABLE_TITLE);
    await expectMaskedCode(page, SECRET_CODE);
    await expect(page.getByRole("button", { name: /code anzeigen|show code/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /code kopieren|copy code/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /kalender \(\.ics\)|download calendar/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: /support@unveiled\.berlin/i }),
    ).toBeVisible();

    await page.goto(`/${locale}/bookings`);
    await expect(page.getByRole("heading", { name: /meine tickets|my tickets/i })).toBeVisible();
    await expectMaskedCode(page, SECRET_CODE);
  });

  test("Scenario: Multi-ticket promo codes are listed separately", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await ensureEventHasCapacity(PROMO_TITLE, 4);

    await seedGrandfatheredPromoBooking(user.email, PROMO_TITLE);
    await page.goto(`/${locale}/bookings`);
    await expect(page.getByText(/Ticket 1/i)).toBeVisible();
    await expect(page.getByText(/Ticket 2/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /code anzeigen|show code/i })).toHaveCount(2);
  });

  test("Scenario: PDF voucher download is ownership-gated", async ({ page, locale, browser }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");
    test.skip(
      !privateR2Configured(),
      "S3_PRIVATE_BUCKET (and shared/override S3 credentials) required for seeded PDF voucher download",
    );

    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await ensureEventHasCapacity(PDF_TITLE, 3);

    await confirmBooking(page, locale, PDF_TITLE);
    const downloadLink = page
      .getByRole("link", { name: /pdf herunterladen|download pdf/i })
      .first();
    await expect(downloadLink).toBeVisible();
    const href = await downloadLink.getAttribute("href");
    if (!href) {
      throw new Error("Expected PDF download href");
    }
    const pdfUrl = new URL(href, page.url()).toString();

    const owned = await page.request.get(pdfUrl);
    expect(owned.status()).toBe(200);
    expect(owned.headers()["content-type"] ?? "").toMatch(/application\/pdf/i);

    const guestContext = await browser.newContext();
    const guestResponse = await guestContext.request.get(pdfUrl, { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308, 401, 403, 404]).toContain(guestResponse.status());
    expect(guestResponse.headers()["content-type"] ?? "").not.toMatch(/application\/pdf/i);
    await guestContext.close();
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

  test("Scenario: Admin cancels all confirmed bookings for an event", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required");
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required for admin cancel-all");

    const event = await createSecretCodeE2eEvent();
    const paid = await bookPaidTicket(page, locale, event.id);
    const creditsBefore = await getUserCredits(paid.email);
    await page.context().clearCookies();

    await loginAdmin(page, locale);
    await submitCancelAll(page, locale, event.id, "E2E booking.feature cancel-all");
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/${event.id}/bookings(\\?|$)`));

    const statuses = await getBookingStatusesForUserEvent(paid.email, event.id);
    expect(statuses).toContain("CANCELLED");
    expect(await getUserCredits(paid.email)).toBeGreaterThan(creditsBefore);
  });

  test("Scenario: Cancel-all refunds paid tickets but not comps", async () => {
    test.skip(
      true,
      "Covered by packages/db cancel-all-bookings-for-event.integration.test.ts (paid vs comp)",
    );
  });

  test("Scenario: Cancel-all leaves USED bookings in place", async () => {
    test.skip(
      true,
      "Covered by packages/db cancel-all-bookings-for-event.integration.test.ts; USED requires partner check-in (post-MVP)",
    );
  });

  test("Scenario: Cancel-all is idempotent when nothing is confirmed", async () => {
    test.skip(
      true,
      "Covered by packages/db cancel-all-bookings-for-event.integration.test.ts no-op path",
    );
  });

  test("Scenario: Cancel-all requires a reason", async () => {
    test.skip(
      true,
      "UI covered by admin-event-bookings.feature Scenario: Cancel-all confirm rejects an empty reason; domain INVALID_REASON unit test",
    );
  });

  test("Scenario: Member receives cancel-all email", async () => {
    test.skip(
      true,
      "No email capture harness in Playwright; assert via Resend dashboard on staging smoke (DEPLOYMENT.md Phase 6)",
    );
  });

  test("Scenario: Book unpublished fails", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required for unpublished booking fixture");
    const event = await createSecretCodeE2eEvent({ published: false });
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    const response = await page.goto(`/${locale}/events/${event.id}/book`);
    expect([404, 302, 301]).toContain(response?.status() ?? 0);
    await expect(
      page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }),
    ).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /bestätigt|confirmed/i })).toHaveCount(0);
  });

  test("Scenario: Existing booking remains after unpublish", async ({ page, locale }) => {
    test.skip(!hasDatabaseUrl(), "DATABASE_URL required for unpublish-after-book fixture");
    const event = await createSecretCodeE2eEvent();
    const user = await onboardFreshMember(page, locale);
    await activateMemberForBooking(user.email);
    await page.goto(`/${locale}/events/${event.id}/book`);
    await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
    await expect(page).toHaveURL(/\/book\/confirm/, { timeout: 15_000 });
    await setE2eEventPublished(event.id, false);
    await page.goto(`/${locale}/bookings`);
    await expect(page.getByText(event.title)).toBeVisible({ timeout: 15_000 });
    const bookAgain = await page.goto(`/${locale}/events/${event.id}/book`);
    expect(bookAgain?.status()).toBe(404);
  });
});
