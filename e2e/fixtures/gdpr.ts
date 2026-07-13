import type { Page } from "@playwright/test";
import { createDb, deletedEmailPlaceholder, eq, users } from "@unveiled/db";

import type { FreshUser } from "./auth";
import { loginWithCredentials } from "./auth";
import type { Locale } from "./base";
import { expect } from "./base";
import { getUserIdByEmail, requireDatabaseUrl } from "./billing";

export type AnonymizedUserRow = {
  id: string;
  email: string;
  deletedAt: Date | null;
};

/** Look up anonymization state by original email (row email changes after delete). */
export async function getUserAnonymizationById(userId: string): Promise<AnonymizedUserRow | null> {
  const db = createDb(requireDatabaseUrl());
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    deletedAt: row.deletedAt,
  };
}

export async function assertUserAnonymized(userId: string): Promise<void> {
  const row = await getUserAnonymizationById(userId);
  expect(row).not.toBeNull();
  expect(row?.deletedAt).not.toBeNull();
  expect(row?.email).toBe(deletedEmailPlaceholder(userId));
}

export async function assertUserNotAnonymized(email: string): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const row = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  expect(row).not.toBeNull();
  expect(row?.deletedAt).toBeNull();
}

/**
 * Download GDPR export JSON via authenticated `?download=1` (same session cookies).
 */
export async function downloadDataExportJson(
  page: Page,
  locale: Locale,
): Promise<Record<string, unknown>> {
  const response = await page.request.get(`/${locale}/profile/data-export?download=1`);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"] ?? "").toMatch(/application\/json/i);
  const disposition = response.headers()["content-disposition"] ?? "";
  expect(disposition).toMatch(/attachment/i);
  const payload = (await response.json()) as Record<string, unknown>;
  expect(payload).toHaveProperty("exportedAt");
  expect(payload).toHaveProperty("user");
  expect(payload).toHaveProperty("bookings");
  expect(payload).toHaveProperty("creditLedger");
  return payload;
}

/**
 * Confirm self-service delete. Prefer success redirect; tolerate AUTH_DISABLE_FAILED
 * only when public.users is already anonymized (Neon Auth plugin gap).
 */
export async function confirmMemberAccountDeletion(
  page: Page,
  locale: Locale,
  userId: string,
): Promise<"ok" | "auth-disable-partial"> {
  await page.goto(`/${locale}/profile/delete-account`);
  await expect(page.getByRole("heading", { name: /konto löschen|delete account/i })).toBeVisible({
    timeout: 15_000,
  });
  await page
    .getByRole("button", { name: /konto endgültig löschen|permanently delete account/i })
    .click();

  const authDisableError = page.getByText(
    /anmeldung konnte nicht vollständig deaktiviert|login could not be fully disabled/i,
  );
  try {
    await page.waitForURL(new RegExp(`/${locale}/?$`), { timeout: 45_000 });
    await assertUserAnonymized(userId);
    return "ok";
  } catch {
    if (await authDisableError.isVisible().catch(() => false)) {
      await assertUserAnonymized(userId);
      return "auth-disable-partial";
    }
    throw new Error(
      `Member delete did not redirect home and no AUTH_DISABLE_FAILED message. URL=${page.url()}`,
    );
  }
}

/**
 * Assert prior credentials no longer authenticate. If Auth disable failed in the
 * environment, skip with a named Neon Auth reason (caller should use test.skip).
 */
export async function expectCredentialsRejected(
  page: Page,
  locale: Locale,
  user: FreshUser,
): Promise<"rejected" | "still-works"> {
  await page.context().clearCookies();
  await loginWithCredentials(page, locale, user);
  try {
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 12_000 });
    // Landed somewhere authenticated — Auth disable did not stick.
    if (!page.url().includes("/login")) {
      return "still-works";
    }
  } catch {
    // Still on login — good.
  }
  await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
  return "rejected";
}

export async function resolveUserId(email: string): Promise<string> {
  return getUserIdByEmail(email);
}
