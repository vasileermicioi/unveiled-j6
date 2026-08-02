import { resolve } from "node:path";

import type { Page } from "@playwright/test";
import { DEMO_DISCOVERY_TITLES } from "@unveiled/db/seed-titles";
import {
  adminLabels,
  adminTabLabels,
  checkOptionByName,
  createEventViaUI,
  createPartnerViaUI,
  deleteEventViaUI,
  expectEventOnDiscover,
  expectPublicEventDetail,
  fillLabeledDateOrTime,
  fillNumberByLabel,
  fillStructuredLocation,
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

async function attachEventImageFile(page: Page): Promise<void> {
  // BDD exception: file-input
  await page.locator('input[name="image"]').setInputFiles(SAMPLE_EVENT_IMAGE);
}

async function createVoucherPromoViaUI(
  page: Page,
  locale: "de" | "en",
  partnerName: string,
): Promise<{ title: string; eventId: string }> {
  const suffix = uniqueSuffix();
  const title = `E2E Voucher Clone Src ${suffix}`;
  await page.goto(`/${locale}/admin/events/new`);
  await expect(page.getByRole("heading", { name: /event anlegen|create event/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForLoadState("networkidle");
  await selectOptionByLabel(page, adminLabels.partner, partnerName);
  await fillTextbox(page, adminLabels.title, title);
  await fillTextbox(page, adminLabels.description, `Voucher clone source ${suffix}`);
  await fillStructuredLocation(page, {
    street: `Voucher Straße ${suffix}`,
    houseNumber: "7",
    zipCode: "10115",
  });
  await selectOptionByLabel(page, adminLabels.category, "Theater");
  await selectOptionByLabel(page, adminLabels.eventType, "Performance");
  await fillLabeledDateOrTime(page, adminLabels.eventDate, futureDateISO(16));
  await selectOptionByLabel(page, adminLabels.ticketType, /voucher \(promo\)|voucher/i);
  await fillTextbox(page, adminLabels.eventWebsite, "https://example.com/e2e-voucher");
  await page.getByLabel(/codes einfügen|paste codes/i).fill(`CODE-A-${suffix}\nCODE-B-${suffix}`);
  await attachEventImageFile(page);
  await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/?$`), { timeout: 90_000 });
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toBeVisible({ timeout: 15_000 });
  const editHref = await row.getByRole("link", { name: /bearbeiten|edit/i }).getAttribute("href");
  const eventId = editHref?.match(/\/events\/([^/]+)\/edit/)?.[1];
  if (!eventId) {
    throw new Error(`Could not parse event id from edit href: ${editHref}`);
  }
  return { title, eventId };
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
      zipCode: "10115",
    });

    const row = page.getByRole("row").filter({ hasText: event.title });
    await expect(row.getByText(/12\/12/)).toBeVisible();

    await expectEventOnDiscover(page, locale, event.title, partner.name);
    await expectPublicEventDetail(page, locale, event);
    await expect(page.getByText(/10115/)).toBeVisible();
  });

  test("Scenario: Admin sets Berlin zip on create", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      zipCode: "10969",
    });
    await expectPublicEventDetail(page, locale, event);
    await expect(page.getByText(/10969/)).toBeVisible();
    await expect(page.getByText(/kiez|neighborhood|bezirk/i)).toHaveCount(0);
  });

  test("Scenario: Country and city are fixed on the form", async ({ page, locale }) => {
    await page.goto(`/${locale}/admin/events/new`);
    await expect(page.getByRole("heading", { name: /event/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByDisplayValue(locale === "de" ? "Deutschland" : "Germany")).toBeVisible();
    await expect(page.getByDisplayValue("Berlin")).toBeVisible();
    await expect(page.getByLabel(/plz|zip code/i)).toBeVisible();
    await expect(page.getByLabel(/plz|zip code/i)).toBeEditable();
    await expect(page.locator("#event-country-display")).toHaveAttribute("readonly", "");
    await expect(page.locator("#event-city-display")).toHaveAttribute("readonly", "");
    await expect(page.getByLabel(/kiez|neighborhood|bezirk/i)).toHaveCount(0);
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
    await expect(hero).toHaveAttribute("src", /(?:hero-1920|large-1280|medium-640)\.webp(?:\?|$)/);
  });

  test("Scenario: Event image is required", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await expect(page.getByRole("heading", { name: /event anlegen|create event/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await fillTextbox(page, adminLabels.title, `No Image ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.description, "Missing image");
    await fillStructuredLocation(page, {
      street: "Teststraße",
      houseNumber: "1",
      zipCode: "10115",
    });
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

  test("Scenario Outline: Redemption configuration validation on create — ticketType = SECRET_CODE, requiredField = secretCode", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await fillTextbox(page, adminLabels.title, `No Secret ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.description, "Missing secret");
    await fillStructuredLocation(page, {
      street: "Teststraße",
      houseNumber: "1",
      zipCode: "10115",
    });
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

  test("Scenario Outline: Redemption configuration validation on create — ticketType = VOUCHER_PROMO, requiredField = eventWebsiteUrl", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await fillTextbox(page, adminLabels.title, `No Website ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.description, "Missing website");
    await fillStructuredLocation(page, {
      street: "Teststraße",
      houseNumber: "1",
      zipCode: "10115",
    });
    await selectOptionByLabel(page, adminLabels.category, "Theater");
    await selectOptionByLabel(page, adminLabels.eventType, "Performance");
    await fillLabeledDateOrTime(page, adminLabels.eventDate, futureDateISO(10));
    await selectOptionByLabel(page, adminLabels.ticketType, /voucher \(promo\)|voucher/i);
    await attachEventImageFile(page);
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/new`));
    await expect(
      page.getByText(/redemption|website|erforderlich|required|unvollständig|incomplete/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario: Secret code event is created with admin-configured code", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      secretCode: "MANUALCODE",
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

  test("Scenario: Clone event from catalog list", async ({ page, locale }) => {
    test.setTimeout(120_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const source = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      eventDate: futureDateISO(18),
      eventTime: "19:00",
    });
    const cloneDate = futureDateISO(25);

    await page.goto(`/${locale}/admin/events`);
    const row = page.getByRole("row").filter({ hasText: source.title });
    await row.getByRole("link", { name: /^klonen$|^clone$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/${source.eventId}/clone`));
    await expect(page.getByRole("heading", { name: /event klonen|clone event/i })).toBeVisible({
      timeout: 15_000,
    });
    await fillLabeledDateOrTime(page, adminLabels.eventDate, cloneDate);
    await fillLabeledDateOrTime(page, adminLabels.eventTime, "20:30");
    await page.getByRole("button", { name: /^klonen$|^clone$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/.+/edit`), {
      timeout: 60_000,
    });
    await expect(page.getByDisplayValue(source.title)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByDisplayValue(cloneDate)).toBeVisible();

    await page.goto(`/${locale}/admin/events`);
    await expect(page.getByRole("row").filter({ hasText: source.title })).toHaveCount(2);
  });

  test("Scenario: Clone voucher event requires inventory", async ({ page, locale }) => {
    test.setTimeout(120_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const source = await createVoucherPromoViaUI(page, locale, partner.name);

    await page.goto(`/${locale}/admin/events/${source.eventId}/clone`);
    await expect(page.getByRole("heading", { name: /event klonen|clone event/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/inventory is not copied|inventar wird nicht kopiert/i).first(),
    ).toBeVisible();
    await fillLabeledDateOrTime(page, adminLabels.eventDate, futureDateISO(28));
    await page.getByRole("button", { name: /^klonen$|^clone$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/${source.eventId}/clone`), {
      timeout: 30_000,
    });
    await expect(
      page.getByText(/inventory|inventar|erforderlich|required|voucher|promo/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario: Clone entry points visible", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const source = await createEventViaUI(page, locale, { partnerName: partner.name });

    await page.goto(`/${locale}/admin/events`);
    await expect(page.getByRole("link", { name: /event.?serie|series/i })).toHaveCount(0);
    const listRow = page.getByRole("row").filter({ hasText: source.title });
    await expect(listRow.getByRole("link", { name: /^klonen$|^clone$/i })).toBeVisible();

    await listRow.getByRole("link", { name: /bearbeiten|edit/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/${source.eventId}/edit`));
    await expect(page.getByRole("link", { name: /^klonen$|^clone$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /event.?serie|series/i })).toHaveCount(0);
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
    await fillNumberByLabel(page, adminLabels.capacity, "15");
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

  test("Scenario: Check Subtitles reveals language select", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured — create partner needs logo");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await expect(page.getByRole("heading", { name: /event anlegen|create event/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await expect(page.getByRole("checkbox", { name: adminLabels.hasSubtitles })).toBeVisible();
    await expect(page.getByLabel(adminLabels.subtitleLanguage)).toHaveCount(0);
    await page.getByRole("checkbox", { name: adminLabels.hasSubtitles }).check();
    const subtitleSelect = page.getByLabel(adminLabels.subtitleLanguage);
    await expect(subtitleSelect).toBeVisible();
    // Full ISO 639-1 list (far broader than the spoken-event 29).
    const optionCount = await subtitleSelect.locator("option").count();
    expect(optionCount).toBeGreaterThan(100);
    await expect(subtitleSelect.locator("option", { hasText: /swahili/i })).toHaveCount(1);
    await expect(
      subtitleSelect.locator("option", { hasText: /isländisch|icelandic/i }),
    ).toHaveCount(1);
  });

  test("Scenario: Save event with Subtitles and language", async ({ page, locale }) => {
    test.setTimeout(90_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, {
      partnerName: partner.name,
      hasSubtitles: true,
      subtitleLanguage: "EN",
    });
    await page.goto(event.detailPath);
    await expect(page.getByRole("heading", { name: event.title })).toBeVisible();
    await expect(page.getByText(/^details$/i).first()).toBeVisible();
    await expect(page.getByText(/^untertitel$|^subtitles$/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/^EN$/).first()).toBeVisible();
  });

  test("Scenario: Subtitles controls available when language-independent", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured — create partner needs logo");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await expect(page.getByRole("heading", { name: /event anlegen|create event/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await page.getByRole("checkbox", { name: /sprachunabhängig|language-independent/i }).check();
    await expect(page.getByRole("checkbox", { name: adminLabels.hasSubtitles })).toBeVisible();
    await page.getByRole("checkbox", { name: adminLabels.hasSubtitles }).check();
    await expect(page.getByLabel(adminLabels.subtitleLanguage)).toBeVisible();
  });

  test("Scenario: Languages multi-select with search", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured — create partner needs logo");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await expect(page.getByRole("heading", { name: /event anlegen|create event/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    const search = page.getByPlaceholder(/sprachen suchen|search languages/i);
    await expect(search).toBeVisible();
    await expect(
      page.getByText(/nur häufige sprachen|only common languages|suche|search/i).first(),
    ).toBeVisible();
    // Featured Berlin-common defaults (DE/EN/TR…); a non-featured allowlisted language needs search.
    await expect(page.getByRole("checkbox", { name: /deutsch|german/i })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /türkisch|turkish/i })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /vietnamesisch|vietnamese/i })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /chinesisch|chinese/i })).toHaveCount(0);
    await search.fill("ZH");
    await checkOptionByName(page, /chinesisch|chinese/i);
    await expect(page.getByRole("checkbox", { name: /chinesisch|chinese/i })).toBeChecked();
  });

  test("Scenario: Age groups multi-select without search", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured — create partner needs logo");
    const partner = await createPartnerViaUI(page, locale);
    await page.goto(`/${locale}/admin/events/new`);
    await expect(page.getByRole("heading", { name: /event anlegen|create event/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await expect(page.getByText(adminLabels.ageGroups).first()).toBeVisible();
    // Language search exists separately; age groups have no search control of their own.
    await expect(page.getByRole("checkbox", { name: "18-25" })).toBeVisible();
    await checkOptionByName(page, "18-25");
    await expect(page.getByRole("checkbox", { name: "18-25" })).toBeChecked();
  });

  test("Scenario: Add event prefills structured location and map from partner", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured — create partner needs logo");
    const partner = await createPartnerViaUI(page, locale, {
      street: `Prefill Straße ${uniqueSuffix()}`,
      houseNumber: "12",
      zipCode: "10115",
    });
    await page.goto(`/${locale}/admin/events/new`);
    await expect(page.getByRole("heading", { name: /event anlegen|create event/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    const streetField = page.getByRole("textbox", { name: adminLabels.street, exact: true });
    const houseField = page.getByRole("textbox", { name: adminLabels.houseNumber, exact: true });
    const zipField = page.getByLabel(/plz|zip code/i);
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await expect(streetField).toHaveValue(partner.street, { timeout: 10_000 });
    await expect(houseField).toHaveValue(partner.houseNumber);
    await expect(zipField).toHaveValue(partner.zipCode);
    // Live Nominatim map-pin success is not required in CI (soft-fail leaves map at default).
  });

  test("Scenario: Edit event keeps existing location when partner changes", async ({
    page,
    locale,
  }) => {
    test.setTimeout(90_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partnerA = await createPartnerViaUI(page, locale, {
      street: `Keep-A ${uniqueSuffix()}`,
      houseNumber: "1",
      zipCode: "10115",
    });
    const partnerB = await createPartnerViaUI(page, locale, {
      street: `Keep-B ${uniqueSuffix()}`,
      houseNumber: "2",
      zipCode: "10435",
    });
    const customStreet = `Custom kept ${uniqueSuffix()}`;
    const customHouse = "99";
    const customZip = "10969";
    const event = await createEventViaUI(page, locale, {
      partnerName: partnerA.name,
      street: customStreet,
      houseNumber: customHouse,
      zipCode: customZip,
    });

    const row = page.getByRole("row").filter({ hasText: event.title });
    await row.getByRole("link", { name: /bearbeiten|edit/i }).click();
    await expect(page.getByRole("heading", { name: /event bearbeiten|edit event/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    const streetField = page.getByRole("textbox", { name: adminLabels.street, exact: true });
    const houseField = page.getByRole("textbox", { name: adminLabels.houseNumber, exact: true });
    const zipField = page.getByLabel(/plz|zip code/i);
    await expect(streetField).toHaveValue(customStreet);
    await expect(houseField).toHaveValue(customHouse);
    await expect(zipField).toHaveValue(customZip);
    await selectOptionByLabel(page, adminLabels.partner, partnerB.name);
    await expect(streetField).toHaveValue(customStreet);
    await expect(houseField).toHaveValue(customHouse);
    await expect(zipField).toHaveValue(customZip);
  });

  test("Scenario: Geocode soft-fails leave structured location filled", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured — create partner needs logo");
    // Structured prefill is covered above; soft-fail geocode paths are unit-tested in
    // apps/web/app/lib/geocode-berlin.test.ts. Live Nominatim failure is not forced in CI.
    const partner = await createPartnerViaUI(page, locale, {
      street: `Softfail Straße ${uniqueSuffix()}`,
      houseNumber: "3",
      zipCode: "10115",
    });
    await page.goto(`/${locale}/admin/events/new`);
    await page.waitForLoadState("networkidle");
    await selectOptionByLabel(page, adminLabels.partner, partner.name);
    await expect(page.getByRole("textbox", { name: adminLabels.street, exact: true })).toHaveValue(
      partner.street,
      { timeout: 10_000 },
    );
    await expect(
      page.getByRole("textbox", { name: adminLabels.houseNumber, exact: true }),
    ).toHaveValue(partner.houseNumber);
    await expect(page.getByLabel(/plz|zip code/i)).toHaveValue(partner.zipCode);
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

  test("Scenario: Gallery manage is available from the Events catalog", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });

    await page.goto(`/${locale}/admin/events`);
    const eventsRow = page.getByRole("row").filter({ hasText: event.title });
    await expect(eventsRow).toBeVisible({ timeout: 15_000 });
    const galleryLink = eventsRow.getByRole("link", {
      name: /galerie-fotos verwalten|manage gallery photos/i,
    });
    await expect(galleryLink).toBeVisible({ timeout: 15_000 });
    await galleryLink.click();
    await expect(page).toHaveURL(new RegExp(`/admin/events/${event.eventId}/gallery`));
    await expect(page.getByRole("heading", { name: /event-galerie|event gallery/i })).toBeVisible();
  });

  test("Scenario: Admin multi-upload gallery photos", async ({ page, locale }) => {
    test.setTimeout(120_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });

    await page.goto(`/${locale}/admin/events/${event.eventId}/gallery/add`);
    await expect(
      page.getByRole("heading", { name: /galerie-fotos hinzufügen|add gallery photos/i }),
    ).toBeVisible({ timeout: 15_000 });

    // BDD exception: file-input — multi-file Pica island
    await page
      .locator('input[type="file"]')
      .setInputFiles([SAMPLE_EVENT_IMAGE, SAMPLE_EVENT_IMAGE]);
    await expect(page.getByText(/2 dateien vorbereitet|2 files prepared/i)).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole("button", { name: /fotos speichern|save photos/i }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/events/${event.eventId}/gallery/?$`), {
      timeout: 90_000,
    });
    await expect(page.getByText(/2\s*\/\s*12/)).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario: Admin removes selected gallery photos", async ({ page, locale }) => {
    test.setTimeout(120_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });

    await page.goto(`/${locale}/admin/events/${event.eventId}/gallery/add`);
    await page
      .locator('input[type="file"]')
      .setInputFiles([SAMPLE_EVENT_IMAGE, SAMPLE_EVENT_IMAGE]);
    await expect(page.getByText(/2 dateien vorbereitet|2 files prepared/i)).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole("button", { name: /fotos speichern|save photos/i }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/events/${event.eventId}/gallery/?$`), {
      timeout: 90_000,
    });

    const checkboxes = page.locator(".admin-event-gallery__checkbox");
    await expect(checkboxes).toHaveCount(2, { timeout: 15_000 });
    await checkboxes.nth(0).check({ force: true });
    await checkboxes.nth(1).check({ force: true });
    await page.getByRole("link", { name: /fotos entfernen|remove photos/i }).click();
    await expect(page).toHaveURL(/\/gallery\/remove/);
    await page.getByRole("button", { name: /fotos entfernen|remove photos/i }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/events/${event.eventId}/gallery/?$`), {
      timeout: 60_000,
    });
    await expect(page.getByText(/noch keine galerie-fotos|no gallery photos yet/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Scenario: Admin reorders gallery photos by drag and drop", async ({ page, locale }) => {
    test.setTimeout(120_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });

    await page.goto(`/${locale}/admin/events/${event.eventId}/gallery/add`);
    await page
      .locator('input[type="file"]')
      .setInputFiles([SAMPLE_EVENT_IMAGE, SAMPLE_EVENT_IMAGE]);
    await expect(page.getByText(/2 dateien vorbereitet|2 files prepared/i)).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole("button", { name: /fotos speichern|save photos/i }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/events/${event.eventId}/gallery/?$`), {
      timeout: 90_000,
    });

    const tiles = page.locator(".admin-event-gallery__tile");
    await expect(tiles).toHaveCount(2, { timeout: 15_000 });
    const firstSrcBefore = await tiles.nth(0).locator("img").getAttribute("src");
    const secondSrcBefore = await tiles.nth(1).locator("img").getAttribute("src");
    expect(firstSrcBefore).toBeTruthy();
    expect(secondSrcBefore).toBeTruthy();

    const firstBox = await tiles.nth(0).boundingBox();
    const secondBox = await tiles.nth(1).boundingBox();
    expect(firstBox).toBeTruthy();
    expect(secondBox).toBeTruthy();
    if (!firstBox || !secondBox) {
      return;
    }

    const saveOrder = page.getByRole("button", { name: /reihenfolge speichern|save order/i });
    await expect(saveOrder).toBeDisabled();

    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, {
      steps: 12,
    });
    await page.mouse.up();

    await expect(saveOrder).toBeEnabled({ timeout: 10_000 });
    await saveOrder.click();

    await expect(page).toHaveURL(new RegExp(`/admin/events/${event.eventId}/gallery/?$`), {
      timeout: 60_000,
    });
    await expect(page.locator(".admin-event-gallery__tile")).toHaveCount(2, { timeout: 15_000 });
    const firstSrcAfter = await page
      .locator(".admin-event-gallery__tile")
      .nth(0)
      .locator("img")
      .getAttribute("src");
    expect(firstSrcAfter).toBe(secondSrcBefore);
  });

  test("Scenario: List featured events", async ({ page, locale }) => {
    await navigateAdminTab(page, locale, "featured");
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/featured/?$`));
    const tabs = page.getByRole("tablist");
    await expect(tabs.getByRole("link", { name: adminTabLabels.featuredEvents })).toBeVisible();
    await expect(tabs.getByRole("link", { name: adminTabLabels.featuredPartners })).toBeVisible();
    await expect(tabs.getByRole("link", { name: /^featured$/i })).toHaveCount(0);
    await expect(tabs.getByRole("link", { name: /^empfohlen$/i })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /^empfohlene events$|^featured events$/i }),
    ).toBeVisible();
  });

  test("Scenario: Admin remove from featured keeps catalog event", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });

    await navigateAdminTab(page, locale, "featured");
    await page.getByRole("link", { name: /event hinzufügen|add event/i }).click();
    await expect(page).toHaveURL(/\/admin\/featured\/add/);
    await page.goto(`/${locale}/admin/featured/add?q=${encodeURIComponent(event.title)}`);
    const addRow = page.getByRole("row").filter({ hasText: event.title });
    await expect(addRow).toBeVisible({ timeout: 15_000 });
    // Decorative thumb <img alt=""> — assert DOM presence near the result title (proximity).
    const addThumb = addRow.locator("img").first();
    await expect(addThumb).toBeVisible({ timeout: 15_000 });
    await expect(addThumb).toHaveAttribute("src", /small-320\.webp(?:\?|$)/);
    await addRow.getByRole("button", { name: /zur featured-liste|add to featured/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/featured/?$`), { timeout: 30_000 });
    await expect(page.getByText(event.title)).toBeVisible();

    const featuredRow = page.getByRole("row").filter({ hasText: event.title });
    const featuredThumb = featuredRow.locator("img").first();
    await expect(featuredThumb).toBeVisible({ timeout: 15_000 });
    await expect(featuredThumb).toHaveAttribute("src", /small-320\.webp(?:\?|$)/);
    await featuredRow.getByRole("link", { name: /entfernen|remove/i }).click();
    await expect(page).toHaveURL(/\/admin\/featured\/.+\/remove/);
    await page
      .getByRole("button", { name: /aus featured entfernen|remove from featured/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/featured/?$`), { timeout: 30_000 });
    await expect(page.getByRole("row").filter({ hasText: event.title })).toHaveCount(0);

    await page.goto(`/${locale}/discover`);
    await expect(page.getByText(event.title)).toHaveCount(0);

    await page.goto(`/${locale}/admin/events`);
    await expect(page.getByRole("row").filter({ hasText: event.title })).toBeVisible({
      timeout: 15_000,
    });
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
    await expectEventOnDiscover(page, locale, DEMO_DISCOVERY_TITLES.tonight);
  });

  test("Scenario: Seed demo data is a no-op when data exists", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    await createPartnerViaUI(page, locale);
    await navigateAdminTab(page, locale, "overview");
    const seedButton = page.getByRole("button", { name: /demo-daten laden|load demo data/i });
    await expect(seedButton).toHaveCount(0);
    await expect(page.getByText(/partner/i).first()).toBeVisible();
  });
});
