import type { Page } from "@playwright/test";
import { createDb, eq, events, waitlistEntries } from "@unveiled/db";

import { loginAsAdmin, logout, waitForPostLogin } from "./auth";
import type { Locale } from "./base";
import { expect } from "./base";
import { getUserIdByEmail, requireDatabaseUrl } from "./billing";
import { hasAdminCredentials } from "./waitlist";

export { hasAdminCredentials };

/** Open Membership HQ list (DE default copy). */
export async function openMembershipHq(page: Page, locale: Locale): Promise<void> {
  await page.goto(`/${locale}/admin/users`);
  await expect(page.getByRole("heading", { name: /mitglieder|users/i })).toBeVisible({
    timeout: 20_000,
  });
}

/** Search members by name/email query and submit. */
export async function searchMembers(page: Page, query: string): Promise<void> {
  const search = page.getByRole("searchbox", { name: /name oder e-mail|search name or email/i });
  await expect(search).toBeVisible({ timeout: 15_000 });
  await search.fill(query);
  await page.getByRole("button", { name: /suchen|search/i }).click();
  await page.waitForLoadState("networkidle");
}

/** Open member detail via list row link (after search). */
export async function openMemberDetailByEmail(
  page: Page,
  locale: Locale,
  email: string,
): Promise<string> {
  const userId = await getUserIdByEmail(email);
  await openMembershipHq(page, locale);
  await searchMembers(page, email);
  const row = page.getByRole("row").filter({ hasText: email });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("link").first().click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/users/${userId}`));
  return userId;
}

export async function loginAdminForMembershipHq(page: Page, locale: Locale): Promise<void> {
  await loginAsAdmin(page, locale);
  await waitForPostLogin(page, locale);
}

/** Set remaining capacity without running waitlist auto-promotion (manual promote tests). */
export async function setEventRemainingCapacity(
  eventId: string,
  remainingCapacity: number,
): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  await db
    .update(events)
    .set({ remainingCapacity, updatedAt: new Date() })
    .where(eq(events.id, eventId));
}

export async function getWaitingEntryIdForUserEvent(
  userId: string,
  eventId: string,
): Promise<string> {
  const db = createDb(requireDatabaseUrl());
  const rows = await db.query.waitlistEntries.findMany({
    where: eq(waitlistEntries.userId, userId),
  });
  const hit = rows.find((row) => row.eventId === eventId && row.status === "WAITING");
  if (!hit) {
    throw new Error(`WAITING waitlist entry not found for user ${userId} event ${eventId}`);
  }
  return hit.id;
}

/** Admin session → promote WAITING entry (capacity must already allow it). */
export async function promoteWaitlistEntryViaAdmin(
  page: Page,
  locale: Locale,
  entryId: string,
): Promise<void> {
  await loginAsAdmin(page, locale);
  await waitForPostLogin(page, locale);
  await page.goto(`/${locale}/admin/waitlist/${entryId}/promote`);
  await expect(
    page.getByRole("heading", { name: /warteliste befördern|promote waitlist/i }),
  ).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /^befördern$|^promote$/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/waitlist`), { timeout: 60_000 });
  await logout(page, locale);
}
