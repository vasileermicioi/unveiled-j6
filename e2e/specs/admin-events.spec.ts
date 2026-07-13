import { resolve } from "node:path";

import type { Page } from "@playwright/test";
import {
  adminLabels,
  createEventViaUI,
  createPartnerViaUI,
  deleteEventViaUI,
  expectEventOnDiscover,
  expectPublicEventDetail,
  fillLabeledDateOrTime,
  fillTextbox,
  futureDateISO,
  navigateAdminTab,
  r2Configured,
  SAMPLE_EVENT_IMAGE,
  selectOptionByLabel,
  settleAdminSession,
  uniqueSuffix,
} from "../fixtures/admin";
import { loginAsAdmin } from "../fixtures/auth";
import { expect, test } from "../fixtures/base";
import { hasAdminCredentials } from "../fixtures/waitlist";

/** Stable Wikimedia Commons URL used by seed data (fetchable for processImageFromUrl). */
const SAMPLE_REMOTE_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Berlin%2C_Mitte%2C_Rosa-Luxemburg-Platz%2C_Volksbuehne_02.jpg/1280px-Berlin%2C_Mitte%2C_Rosa-Luxemburg-Platz%2C_Volksbuehne_02.jpg";

async function fillEventBaseFields(page: Page, partnerName: string, title: string): Promise<void> {
  await expect(page.getByRole("heading", { name: /serie|series|event/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForLoadState("networkidle");
  const suffix = uniqueSuffix();
  await selectOptionByLabel(page, adminLabels.partner, partnerName);
  await fillTextbox(page, adminLabels.title, title);
  await fillTextbox(page, adminLabels.description, `Series desc ${suffix}`);
  await fillTextbox(page, adminLabels.address, `Series venue ${suffix}, Berlin`);
  await fillTextbox(page, adminLabels.neighborhood, "Mitte");
  await selectOptionByLabel(page, adminLabels.category, "Theater");
  await selectOptionByLabel(page, adminLabels.eventType, "Performance");
  await fillTextbox(page, adminLabels.secretCode, `SER${suffix.slice(0, 6).toUpperCase()}`);
}

async function attachEventImageFile(page: Page): Promise<void> {
  // BDD exception: file-input
  await page.locator('input[name="image"]').setInputFiles(SAMPLE_EVENT_IMAGE);
}

test.describe("admin-events.feature", () => {
  test.beforeEach(async ({ page, locale }, testInfo) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required for admin events e2e");
    if (testInfo.tags.includes("@skip-no-ui")) {
      return;
    }
    await loginAsAdmin(page, locale);
    await settleAdminSession(page, locale);
  });

  test("Scenario: Create a single event", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      totalCapacity: "12",
    });

    const row = page.getByRole("row").filter({ hasText: event.title });
    await expect(row.getByText(/12\/12/)).toBeVisible();

    await expectEventOnDiscover(page, locale, event.title, partner.name);
    await expectPublicEventDetail(page, locale, event);
  });

  test("Scenario: Supply the event image as a direct upload", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      imagePath: SAMPLE_EVENT_IMAGE,
    });
    await page.goto(event.detailPath);
    // Hero alt is the event title — prefer role over CSS/src attribute selectors.
    const hero = page.getByRole("img", { name: event.title });
    await expect(hero).toBeVisible({ timeout: 15_000 });
    await expect(hero).toHaveAttribute("src", /(?:hero-1920|large-1280|medium-640)\.jpg(?:\?|$)/);
  });

  test("Scenario: Supply the event image as a remote URL", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      imageUrl: SAMPLE_REMOTE_IMAGE_URL,
    });
    await page.goto(event.detailPath);
    const hero = page.getByRole("img", { name: event.title });
    await expect(hero).toBeVisible({ timeout: 15_000 });
    await expect(hero).toHaveAttribute("src", /(?:hero-1920|large-1280|medium-640)\.jpg(?:\?|$)/);
  });

  test("Scenario: Event image is required", async ({ page, locale }) => {
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await expect(page.getByRole("heading", { name: /event anlegen|create event/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await fillTextbox(page, adminLabels.title, `No Image ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.description, "Missing image");
    await fillTextbox(page, adminLabels.address, "Berlin");
    await fillTextbox(page, adminLabels.neighborhood, "Mitte");
    await selectOptionByLabel(page, adminLabels.category, "Theater");
    await selectOptionByLabel(page, adminLabels.eventType, "Performance");
    await fillLabeledDateOrTime(page, adminLabels.eventDate, futureDateISO(10));
    await fillTextbox(page, adminLabels.secretCode, "NOIMG001");
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/new`));
    await expect(
      page.getByText(/event-bild ist erforderlich|event image is required/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario Outline: Redemption configuration validation on create — ticketType = SECRET_CODE, mode = MANUAL, requiredField = secretCode", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await fillTextbox(page, adminLabels.title, `No Secret ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.description, "Missing secret");
    await fillTextbox(page, adminLabels.address, "Berlin");
    await fillTextbox(page, adminLabels.neighborhood, "Mitte");
    await selectOptionByLabel(page, adminLabels.category, "Theater");
    await selectOptionByLabel(page, adminLabels.eventType, "Performance");
    await fillLabeledDateOrTime(page, adminLabels.eventDate, futureDateISO(10));
    await attachEventImageFile(page);
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/new`));
    await expect(
      page.getByText(/redemption|secret|erforderlich|required|unvollständig|incomplete/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario Outline: Redemption configuration validation on create — ticketType = VOUCHER, mode = (n/a), requiredField = promoCode", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await fillTextbox(page, adminLabels.title, `No Promo ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.description, "Missing promo");
    await fillTextbox(page, adminLabels.address, "Berlin");
    await fillTextbox(page, adminLabels.neighborhood, "Mitte");
    await selectOptionByLabel(page, adminLabels.category, "Theater");
    await selectOptionByLabel(page, adminLabels.eventType, "Performance");
    await fillLabeledDateOrTime(page, adminLabels.eventDate, futureDateISO(10));
    await selectOptionByLabel(page, adminLabels.ticketType, "Voucher");
    await fillTextbox(page, adminLabels.eventWebsite, "https://example.com/event");
    await attachEventImageFile(page);
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/new`));
    await expect(
      page.getByText(/redemption|promo|erforderlich|required|unvollständig|incomplete/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario Outline: Redemption configuration validation on create — ticketType = VOUCHER, mode = (n/a), requiredField = eventWebsiteUrl", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await fillTextbox(page, adminLabels.title, `No Website ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.description, "Missing website");
    await fillTextbox(page, adminLabels.address, "Berlin");
    await fillTextbox(page, adminLabels.neighborhood, "Mitte");
    await selectOptionByLabel(page, adminLabels.category, "Theater");
    await selectOptionByLabel(page, adminLabels.eventType, "Performance");
    await fillLabeledDateOrTime(page, adminLabels.eventDate, futureDateISO(10));
    await selectOptionByLabel(page, adminLabels.ticketType, "Voucher");
    await fillTextbox(page, adminLabels.promoCode, "PROMO123");
    await attachEventImageFile(page);
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/new`));
    await expect(
      page.getByText(/redemption|website|erforderlich|required|unvollständig|incomplete/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario: Shared generated code is created automatically", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      secretCodeMode: "SHARED_GENERATED",
    });
    await expect(page.getByText(event.title).first()).toBeVisible();
  });

  test("Scenario: Default values on creation", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });
    const row = page.getByRole("row").filter({ hasText: event.title });
    await expect(row.getByText(/10\/10/)).toBeVisible();
  });

  test("Scenario: Create an event series with manual slots", async ({ page, locale }) => {
    test.setTimeout(120_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const title = `Series Manual ${uniqueSuffix()}`;

    await page.goto(`/${locale}/admin/events/series/new`);
    await fillEventBaseFields(page, partner.name, title);
    await fillLabeledDateOrTime(page, adminLabels.slotDate, futureDateISO(20), { nth: 0 });
    await fillLabeledDateOrTime(page, adminLabels.slotTime, "19:00", { nth: 0 });
    await fillLabeledDateOrTime(page, adminLabels.slotDate, futureDateISO(21), { nth: 1 });
    await fillLabeledDateOrTime(page, adminLabels.slotTime, "20:00", { nth: 1 });
    await attachEventImageFile(page);
    await page.getByRole("button", { name: /slots anzeigen|show slots|preview/i }).click();

    await expect(page.getByRole("heading", { name: /vorschau|preview/i })).toBeVisible({
      timeout: 30_000,
    });
    // File inputs clear on remount between preview and confirm — re-attach before submit.
    await attachEventImageFile(page);
    await page.getByRole("button", { name: /events anlegen|create .*events/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/?$`), { timeout: 60_000 });
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test("Scenario: Create an event series with a date-range builder", async ({ page, locale }) => {
    test.setTimeout(120_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const title = `Series Builder ${uniqueSuffix()}`;
    const start = futureDateISO(30);
    const end = futureDateISO(36);

    await page.goto(`/${locale}/admin/events/series/new`);
    await fillEventBaseFields(page, partner.name, title);
    await selectOptionByLabel(page, adminLabels.slotMode, /datumsbereich|date range/i);
    await fillLabeledDateOrTime(page, adminLabels.builderStart, start);
    await fillLabeledDateOrTime(page, adminLabels.builderEnd, end);
    await page.getByRole("button", { name: adminLabels.weekdays }).click();
    await page.getByRole("option", { name: "Mo" }).click();
    await page.keyboard.press("Escape");
    await fillLabeledDateOrTime(page, adminLabels.builderTime1, "19:30");
    await attachEventImageFile(page);
    await page.getByRole("button", { name: /slots anzeigen|show slots|preview/i }).click();

    await expect(page.getByRole("heading", { name: /vorschau|preview/i })).toBeVisible({
      timeout: 30_000,
    });
    await attachEventImageFile(page);
    await page.getByRole("button", { name: /events anlegen|create .*events/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/?$`), { timeout: 60_000 });
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test("Scenario: Update an event's capacity", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    // Phase 4: sold=0 always — recalculation with sold tickets needs Phase 6 bookings.
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      totalCapacity: "10",
    });

    const row = page.getByRole("row").filter({ hasText: event.title });
    await row.getByRole("link", { name: /bearbeiten|edit/i }).click();
    // HeroUI NumberField: click increment until 15 (fill is unreliable on the spin textbox).
    const capacityField = page.getByRole("textbox", { name: adminLabels.capacity, exact: true });
    await expect(capacityField).toBeVisible();
    const increment = page.getByRole("button", { name: /erhöhen|increment|increase/i }).nth(1);
    for (let i = 0; i < 5; i++) {
      await increment.click();
    }
    await expect(capacityField).toHaveValue("15");
    await page.getByRole("button", { name: /^speichern$|^save$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/?$`));
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: event.title })
        .getByText(/15\/15/),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario: Edit event details", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });

    const row = page.getByRole("row").filter({ hasText: event.title });
    await row.getByRole("link", { name: /bearbeiten|edit/i }).click();
    const updatedTitle = `Edited ${uniqueSuffix()}`;
    await fillTextbox(page, adminLabels.title, updatedTitle);
    await fillTextbox(page, adminLabels.description, "Updated description for E2E");
    await page.getByRole("button", { name: /^speichern$|^save$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/?$`));

    await expectEventOnDiscover(page, locale, updatedTitle, partner.name);
    await page.goto(event.detailPath);
    await expect(page.getByRole("heading", { name: updatedTitle })).toBeVisible();
  });

  test("Scenario: Delete an event", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });
    await deleteEventViaUI(page, locale, event.title);

    await page.goto(`/${locale}`);
    await expect(page.getByText(event.title)).toHaveCount(0);
  });

  test("Scenario: Optional accessibility and audience metadata", async ({ page, locale }) => {
    test.setTimeout(90_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      barrierFree: "Ja",
      language: /deutsch|german/i,
      ageGroup: "18-25",
    });
    await page.goto(event.detailPath);
    await expect(page.getByRole("heading", { name: event.title })).toBeVisible();
    await expect(
      page.getByText(/barrierefrei|barrier.?free|18-25|deutsch|german/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Scenario: Export redemption codes for an event", async ({ page, locale }) => {
    test.setTimeout(90_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    // Phase 4 stub CSV (header only) — assert download link works; rows need Phase 6 bookings.
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });

    const row = page.getByRole("row").filter({ hasText: event.title });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      row.getByRole("link", { name: /^codes$/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/codes\.csv$/i);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const fs = await import("node:fs/promises");
    const body = await fs.readFile(resolve(downloadPath as string), "utf8");
    expect(body).toMatch(/booking_id|redemption_code/i);
  });

  test("Scenario: Seed demo data (empty environment only)", async ({ page, locale }) => {
    await navigateAdminTab(page, locale, "overview");
    const seedButton = page.getByRole("button", { name: /demo-daten laden|load demo data/i });
    if ((await seedButton.count()) === 0) {
      test.skip(
        true,
        "Catalog not empty — seed button hidden; run `bun run seed:demo -- --reset` for empty-env coverage",
      );
      return;
    }
    await seedButton.click();
    await expect(page).toHaveURL(/seed=seeded/);
    await expect(
      page.getByText(/demo-daten wurden erstellt|demo data (was )?created/i),
    ).toBeVisible({ timeout: 120_000 });
    await expectEventOnDiscover(page, locale, "Tonight: Stadt ohne Schlaf");
  });

  test("Scenario: Seed demo data is a no-op when data exists", async ({ page, locale }) => {
    await createPartnerViaUI(page, locale);
    await navigateAdminTab(page, locale, "overview");
    const seedButton = page.getByRole("button", { name: /demo-daten laden|load demo data/i });
    await expect(seedButton).toHaveCount(0);
    await expect(page.getByText(/partner/i).first()).toBeVisible();
  });
});
