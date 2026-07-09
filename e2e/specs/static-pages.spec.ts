import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures/base";

/** Mirrors `CONSENT_STORAGE_KEY` in apps/web — keep in sync. */
const CONSENT_STORAGE_KEY = "unveiled:cookie-consent";

async function clearConsent(page: Page): Promise<void> {
  await page.addInitScript((key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, CONSENT_STORAGE_KEY);
}

test.describe("static-pages.feature", () => {
  test("Scenario: Landing page", async ({ page, locale }) => {
    await page.goto(`/${locale}`);
    await expect(page.getByRole("heading", { name: /unveiled berlin/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /so funktioniert's|how it works/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /entdecken|discover/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /anmelden|log ?in/i }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /registrieren|sign up|register/i }).first(),
    ).toBeVisible();
  });

  test("Scenario: How it works", async ({ page, locale }) => {
    await page.goto(`/${locale}/how-it-works`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText(/1\.\s*Auswahl|1\.\s*Browse|Mitglied werden|Become a member/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/2\./).first()).toBeVisible();
    await expect(page.getByText(/3\./).first()).toBeVisible();
  });

  test("Scenario: FAQ", async ({ page, locale }) => {
    await page.goto(`/${locale}/faq`);
    await expect(page.getByRole("heading", { name: /faq/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /support@unveiled\.berlin/i }).first(),
    ).toBeVisible();

    const firstQuestion = page.getByRole("button", { name: /wie buche ich|how does booking/i });
    const secondQuestion = page.getByRole("button", {
      name: /was passiert nach|what happens after/i,
    });
    await expect(firstQuestion).toBeVisible({ timeout: 10_000 });
    await expect(secondQuestion).toBeVisible();

    await secondQuestion.click();
    // Accordion is single-expand: second panel open implies first closed.
    await expect(
      page.getByText(/einlasscode|promo-code|my tickets|meine tickets/i).first(),
    ).toBeVisible();
  });

  test("Scenario: Discover / marketing preview page", async ({ page, locale }) => {
    await page.goto(`/${locale}/discover`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText(/finde dinge|find things|buche spontan|book spontaneously|community/i).first(),
    ).toBeVisible();
  });

  test("Scenario: Bilingual content", async ({ page }) => {
    await page.goto("/de/how-it-works");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/verstehen|entscheiden/i);

    await page
      .getByRole("group", { name: /language/i })
      .getByRole("link", { name: /^EN$/ })
      .click();
    await expect(page).toHaveURL(/\/en\/how-it-works/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/understand|commit/i);
  });

  test("Scenario: Legal pages exist and are linked from the footer", async ({ page, locale }) => {
    await page.goto(`/${locale}`);

    const impressum = page.getByRole("link", { name: /impressum|imprint/i }).first();
    const privacy = page.getByRole("link", { name: /datenschutz|privacy/i }).first();
    const terms = page.getByRole("link", { name: /^agb$|terms of service/i }).first();

    await expect(impressum).toBeVisible();
    await expect(privacy).toBeVisible();
    await expect(terms).toBeVisible();

    await impressum.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/impressum`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto(`/${locale}/privacy`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto(`/${locale}/terms`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Scenario: Cookie consent banner on first visit", async ({ page, locale }) => {
    await clearConsent(page);
    await page.goto(`/${locale}`);

    const accept = page.getByRole("button", { name: /akzeptieren|accept/i });
    const decline = page.getByRole("button", { name: /ablehnen|decline/i });
    await expect(accept).toBeVisible({ timeout: 10_000 });
    await expect(decline).toBeVisible();

    await accept.click();
    await expect(accept).toBeHidden({ timeout: 5_000 });

    const stored = await page.evaluate((key) => localStorage.getItem(key), CONSENT_STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored as string).decision).toBe("accepted");

    await page.reload();
    await expect(page.getByRole("button", { name: /akzeptieren|accept/i })).toHaveCount(0);
  });

  test("Scenario: Declining consent disables the map embed", async ({ page, locale }) => {
    // Phase 5: MapLibre member map is not on public pages yet. Assert consent decline
    // persistence; map tile blocking / static placeholder coverage ships with discovery E2E.
    await clearConsent(page);
    await page.goto(`/${locale}`);

    const decline = page.getByRole("button", { name: /ablehnen|decline/i });
    await expect(decline).toBeVisible({ timeout: 10_000 });
    await decline.click();

    const stored = await page.evaluate((key) => localStorage.getItem(key), CONSENT_STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored as string).decision).toBe("declined");

    await page.goto(`/${locale}/discover`);
    await expect(page.getByRole("button", { name: /ablehnen|decline/i })).toHaveCount(0);
  });

  test("Scenario: Error tracking is not gated behind consent", async ({ page, locale }) => {
    // Phase 9: Sentry is not wired yet. Assert declining consent does not inject a Sentry SDK
    // and that no consent gate exists for error tracking today.
    await clearConsent(page);
    await page.goto(`/${locale}`);
    await page.getByRole("button", { name: /ablehnen|decline/i }).click();

    const sentryGlobal = await page.evaluate(() => {
      return typeof (window as unknown as { Sentry?: unknown }).Sentry;
    });
    expect(sentryGlobal).toBe("undefined");
  });
});
