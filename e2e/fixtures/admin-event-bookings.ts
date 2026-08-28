import type { Page } from "@playwright/test";
import { bookings, createDb, eq, waitlistEntries } from "@unveiled/db";

import { settleAdminSession } from "./admin";
import { hasAdminCredentials, loginAdminForMembershipHq } from "./admin-users";
import { signupFreshUser } from "./auth";
import type { Locale } from "./base";
import { expect } from "./base";
import {
  activateMemberForBooking,
  getUserIdByEmail,
  hasDatabaseUrl,
  requireDatabaseUrl,
} from "./billing";
import { createSecretCodeE2eEvent } from "./catalog";
import { completeOnboardingWizard } from "./onboarding";
import { forceEventSoldOut } from "./waitlist";

export { createSecretCodeE2eEvent, hasAdminCredentials, hasDatabaseUrl };

export async function onboardFreshMember(page: Page, locale: Locale) {
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

export async function bookPaidTicket(
  page: Page,
  locale: Locale,
  eventId: string,
): Promise<{ email: string }> {
  const user = await onboardFreshMember(page, locale);
  await activateMemberForBooking(user.email);
  await page.goto(`/${locale}/events/${eventId}/book`);
  await page.getByRole("button", { name: /buchung bestätigen|confirm booking/i }).click();
  await expect(page).toHaveURL(/\/book\/confirm/, { timeout: 15_000 });
  return { email: user.email };
}

export async function joinEventWaitlist(
  page: Page,
  locale: Locale,
  eventId: string,
): Promise<{ email: string }> {
  await forceEventSoldOut(eventId);
  const user = await onboardFreshMember(page, locale);
  await activateMemberForBooking(user.email);
  await page.goto(`/${locale}/events/${eventId}/waitlist`);
  await page.getByRole("button", { name: /warteliste beitreten|join waitlist/i }).click();
  await expect(page.getByText(/status:\s*waiting/i)).toBeVisible({ timeout: 15_000 });
  return { email: user.email };
}

export async function loginAdmin(page: Page, locale: Locale): Promise<void> {
  await loginAdminForMembershipHq(page, locale);
  await settleAdminSession(page, locale);
}

export async function openAdminBookingsTab(page: Page, locale: Locale): Promise<void> {
  await page.goto(`/${locale}/admin`);
  await page
    .getByRole("tablist")
    .getByRole("link", { name: /^buchungen$|^bookings$/i })
    .click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/bookings`));
  await expect(
    page.getByRole("heading", { name: /buchungen nach event|bookings by event/i }),
  ).toBeVisible({ timeout: 20_000 });
}

export async function filterBookingsIndexByTitle(page: Page, title: string): Promise<void> {
  await page.getByLabel(/event-titel|event title/i).fill(title);
  await page.getByRole("button", { name: /suchen|search/i }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toBeVisible({ timeout: 20_000 });
}

export async function openEventBookingsFromCatalog(
  page: Page,
  locale: Locale,
  title: string,
  eventId: string,
): Promise<void> {
  await page.goto(`/${locale}/admin/events`);
  await expect(page.getByRole("heading", { name: /^events$/i })).toBeVisible({ timeout: 20_000 });
  await page.getByLabel(/event-titel|event title/i).fill(title);
  await page.getByRole("button", { name: /suchen|search/i }).click();
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByRole("link", { name: /^buchungen$|^bookings$/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/${eventId}/bookings`));
}

export async function submitCancelAll(
  page: Page,
  locale: Locale,
  eventId: string,
  reason: string,
): Promise<void> {
  await page.goto(`/${locale}/admin/events/${eventId}/bookings/cancel-all`);
  await expect(
    page.getByRole("heading", { name: /alle buchungen stornieren|cancel all bookings/i }),
  ).toBeVisible({ timeout: 20_000 });
  await page
    .getByRole("textbox", { name: /grund \(erforderlich\)|reason \(required\)/i })
    .fill(reason);
  await page.getByRole("button", { name: /stornierung bestätigen|confirm cancellation/i }).click();
}

export async function getBookingStatusesForUserEvent(
  email: string,
  eventId: string,
): Promise<string[]> {
  const db = createDb(requireDatabaseUrl());
  const userId = await getUserIdByEmail(email);
  const rows = await db.query.bookings.findMany({
    where: eq(bookings.userId, userId),
  });
  return rows.filter((row) => row.eventId === eventId).map((row) => row.status);
}

export async function getWaitlistStatusesForUserEvent(
  email: string,
  eventId: string,
): Promise<string[]> {
  const db = createDb(requireDatabaseUrl());
  const userId = await getUserIdByEmail(email);
  const rows = await db.query.waitlistEntries.findMany({
    where: eq(waitlistEntries.userId, userId),
  });
  return rows.filter((row) => row.eventId === eventId).map((row) => row.status);
}
