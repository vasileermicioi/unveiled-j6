import { expect, type Page } from "@playwright/test";

import type { Locale } from "./base";

/**
 * Assert seeded catalog content is visible via public pages — no direct DB access from Playwright.
 */
export async function expectDiscoverHasEvents(page: Page, locale: Locale = "de"): Promise<void> {
  await page.goto(`/${locale}/discover`);
  await expect(page.getByRole("main")).toBeVisible();
  const eventLinks = page.getByRole("link", { name: /mehr sehen|see details/i });
  await expect(eventLinks.first()).toBeVisible({ timeout: 15_000 });
}
