import {
  adminLabels,
  adminTabLabels,
  composeDisplayAddress,
  createEventViaUI,
  createPartnerViaUI,
  deletePartnerViaUI,
  expectEventOnDiscover,
  fillStructuredLocation,
  fillTextbox,
  navigateAdminTab,
  r2Configured,
  SAMPLE_EVENT_IMAGE,
  settleAdminSession,
  uniqueSuffix,
} from "../fixtures/admin";
import { loginAsAdmin } from "../fixtures/auth";
import { expect, test } from "../fixtures/base";
import { hasAdminCredentials } from "../fixtures/waitlist";

test.describe("admin-partners.feature", () => {
  test.beforeEach(async ({ page, locale }, testInfo) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required for admin partners e2e");
    if (testInfo.tags.includes("@skip-no-ui")) {
      return;
    }
    await loginAsAdmin(page, locale);
    await settleAdminSession(page, locale);
  });

  test("Scenario: Create a partner", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await navigateAdminTab(page, locale, "partners");
    // PageSectionHeader: Admin/Verwaltung eyebrow + Partners/Partner title (proximity roles/names).
    await expect(page.getByText(/^verwaltung$|^admin$/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /^partner$|^partners$/i })).toBeVisible();
    await expect(page.getByText(partner.name).first()).toBeVisible();
    await expect(page.getByText(partner.contactEmail).first()).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: partner.name });
    const logo = row.locator("img").first();
    await expect(logo).toBeVisible({ timeout: 15_000 });
    await expect(logo).toHaveAttribute("src", /small-320\.webp(?:\?|$)/);
  });

  test("Scenario: Supply the partner logo as a direct upload", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    // Admin UI is upload-only (no logo URL field). Remote URL path is seed/CLI only.
    const partner = await createPartnerViaUI(page, locale, { logoPath: SAMPLE_EVENT_IMAGE });
    await expect(page.getByText(partner.name).first()).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: partner.name });
    // Logo <img alt=""> is decorative — not exposed as role=img; assert DOM presence.
    const logo = row.locator("img").first();
    await expect(logo).toBeVisible({ timeout: 15_000 });
    await expect(logo).toHaveAttribute("src", /small-320\.webp(?:\?|$)/);
  });

  test("Scenario: Partner logo is required", async ({ page, locale }) => {
    await page.goto(`/${locale}/admin/partners/new`);
    await expect(
      page.getByRole("heading", { name: /partner anlegen|create partner/i }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    await fillTextbox(page, adminLabels.name, `No Logo ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.email, `nologo-${uniqueSuffix()}@example.com`);
    await fillStructuredLocation(page, {
      street: "Teststraße",
      houseNumber: "1",
      zipCode: "10115",
    });
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/new`));
    await expect(
      page.getByText(/partner-logo ist erforderlich|partner logo is required/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Scenario Outline: Partner creation validation — name = ""', async ({ page, locale }) => {
    await page.goto(`/${locale}/admin/partners/new`);
    await fillTextbox(page, adminLabels.email, "valid@example.com");
    await fillStructuredLocation(page, {
      street: "Teststraße",
      houseNumber: "1",
      zipCode: "10115",
    });
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/new`));
    const nameField = page.getByRole("textbox", { name: adminLabels.name, exact: true });
    const invalid = await nameField.evaluate(
      (el) => (el as HTMLInputElement).validity?.valueMissing,
    );
    expect(invalid || page.url().includes("/partners/new")).toBeTruthy();
  });

  test('Scenario Outline: Partner creation validation — contactEmail = "not-an-email"', async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    await page.goto(`/${locale}/admin/partners/new`);
    await fillTextbox(page, adminLabels.name, `E2E Invalid Email ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.email, "not-an-email");
    await fillStructuredLocation(page, {
      street: "Teststraße",
      houseNumber: "1",
      zipCode: "10115",
    });
    // BDD exception: file-input — attach logo so submit reaches field validation
    await page.locator('input[name="logo"]').setInputFiles(SAMPLE_EVENT_IMAGE);
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/new`));
    const emailField = page.getByRole("textbox", { name: adminLabels.email, exact: true });
    const invalid = await emailField.evaluate(
      (el) =>
        (el as HTMLInputElement).validity?.typeMismatch ||
        (el as HTMLInputElement).validity?.valueMissing,
    );
    expect(
      invalid ||
        (await page.getByText(/gültige e-mail|valid e-?mail|invalid|ungültig/i).count()) > 0,
    ).toBeTruthy();
  });

  test('Scenario Outline: Partner creation validation — street = ""', async ({ page, locale }) => {
    await page.goto(`/${locale}/admin/partners/new`);
    await fillTextbox(page, adminLabels.name, `E2E No Street ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.email, "valid@example.com");
    await fillTextbox(page, adminLabels.houseNumber, "1");
    await fillTextbox(page, adminLabels.zipCode, "10115");
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/new`));
    const streetField = page.getByRole("textbox", { name: adminLabels.street, exact: true });
    const invalid = await streetField.evaluate(
      (el) => (el as HTMLInputElement).validity?.valueMissing,
    );
    expect(invalid || page.url().includes("/partners/new")).toBeTruthy();
  });

  test("Scenario: Edit a partner", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const row = page.getByRole("row").filter({ hasText: partner.name });
    await row.getByRole("link", { name: /bearbeiten|edit/i }).click();
    await expect(page).toHaveURL(/\/admin\/partners\/.+\/edit/);

    const updatedStreet = `Updated ${uniqueSuffix()}`;
    const updatedHouse = "77";
    const updatedZip = "10437";
    await fillStructuredLocation(page, {
      street: updatedStreet,
      houseNumber: updatedHouse,
      zipCode: updatedZip,
    });
    await page.getByRole("button", { name: /^speichern$|^save$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/?$`));
    const composed = composeDisplayAddress({
      street: updatedStreet,
      houseNumber: updatedHouse,
      zipCode: updatedZip,
    });
    await expect(page.getByText(composed).first()).toBeVisible();
  });

  test("Scenario: Renaming a partner propagates to its events", async ({ page, locale }) => {
    test.setTimeout(120_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    const event = await createEventViaUI(page, locale, { partnerName: partner.name });

    await page.goto(`/${locale}/admin/partners`);
    const row = page.getByRole("row").filter({ hasText: partner.name });
    await row.getByRole("link", { name: /bearbeiten|edit/i }).click();

    const renamed = `Renamed ${uniqueSuffix()}`;
    await fillTextbox(page, adminLabels.name, renamed);
    await page.getByRole("button", { name: /^speichern$|^save$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/?$`));

    await expectEventOnDiscover(page, locale, event.title, renamed);
  });

  test("Scenario: Delete a partner", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await deletePartnerViaUI(page, locale, partner.name);
  });

  test("Scenario: List featured partners", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await navigateAdminTab(page, locale, "featured-partners");
    await page.getByRole("link", { name: /partner hinzufügen|add partner/i }).click();
    await page.goto(`/${locale}/admin/featured-partners/add?q=${encodeURIComponent(partner.name)}`);
    const addRow = page.getByRole("row").filter({ hasText: partner.name });
    await expect(addRow).toBeVisible({ timeout: 15_000 });
    await addRow.getByRole("button", { name: /zur featured-liste|add to featured/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/featured-partners/?$`), {
      timeout: 30_000,
    });

    const tabs = page.getByRole("tablist");
    await expect(tabs.getByRole("link", { name: adminTabLabels.featuredPartners })).toBeVisible();
    await expect(tabs.getByRole("link", { name: adminTabLabels.featuredEvents })).toBeVisible();
    // Bare legacy labels must not be the tab accessible names.
    await expect(tabs.getByRole("link", { name: /^featured$/i })).toHaveCount(0);
    await expect(tabs.getByRole("link", { name: /^empfohlen$/i })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /^empfohlene partner$|^featured partners$/i }),
    ).toBeVisible();
    await expect(page.getByText(partner.name, { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /reihenfolge speichern|save order/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /partner entfernen|remove partners/i }),
    ).toBeVisible();
  });

  test("Scenario: Add by searching existing partners", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await navigateAdminTab(page, locale, "featured-partners");
    await page.getByRole("link", { name: /partner hinzufügen|add partner/i }).click();
    await expect(page).toHaveURL(/\/admin\/featured-partners\/add/);
    await page.goto(`/${locale}/admin/featured-partners/add?q=${encodeURIComponent(partner.name)}`);
    const addRow = page.getByRole("row").filter({ hasText: partner.name });
    await expect(addRow).toBeVisible({ timeout: 15_000 });
    await addRow.getByRole("button", { name: /zur featured-liste|add to featured/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/featured-partners/?$`), {
      timeout: 30_000,
    });
    await expect(page.getByText(partner.name, { exact: true }).first()).toBeVisible();
  });

  test("Scenario: Admin reorders featured partners by drag and drop", async ({ page, locale }) => {
    test.setTimeout(120_000);
    test.skip(!r2Configured(), "R2 vars not configured");
    const partnerA = await createPartnerViaUI(page, locale);
    const partnerB = await createPartnerViaUI(page, locale);

    for (const partner of [partnerA, partnerB]) {
      await navigateAdminTab(page, locale, "featured-partners");
      await page.getByRole("link", { name: /partner hinzufügen|add partner/i }).click();
      await page.goto(
        `/${locale}/admin/featured-partners/add?q=${encodeURIComponent(partner.name)}`,
      );
      const addRow = page.getByRole("row").filter({ hasText: partner.name });
      await expect(addRow).toBeVisible({ timeout: 15_000 });
      await addRow.getByRole("button", { name: /zur featured-liste|add to featured/i }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/admin/featured-partners/?$`), {
        timeout: 30_000,
      });
    }

    const tileA = page
      .locator(".admin-featured-partners__tile")
      .filter({ hasText: partnerA.name })
      .first();
    const tileB = page
      .locator(".admin-featured-partners__tile")
      .filter({ hasText: partnerB.name })
      .first();
    await expect(tileA).toBeVisible({ timeout: 15_000 });
    await expect(tileB).toBeVisible({ timeout: 15_000 });

    const saveOrder = page.getByRole("button", { name: /reihenfolge speichern|save order/i });
    await expect(saveOrder).toBeDisabled();

    const boxA = await tileA.boundingBox();
    const boxB = await tileB.boundingBox();
    expect(boxA).toBeTruthy();
    expect(boxB).toBeTruthy();
    if (!boxA || !boxB) {
      return;
    }

    await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
    await page.mouse.down();
    await page.mouse.move(boxB.x + boxB.width / 2, boxB.y + boxB.height / 2, { steps: 12 });
    await page.mouse.up();

    await expect(saveOrder).toBeEnabled({ timeout: 10_000 });
    await saveOrder.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/featured-partners/?$`), {
      timeout: 30_000,
    });
    await expect(
      page.locator(".admin-featured-partners__tile").filter({ hasText: partnerA.name }).first(),
    ).toBeVisible();
  });

  test("Scenario: Admin remove from featured partners keeps venue", async ({ page, locale }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    const partner = await createPartnerViaUI(page, locale);
    await navigateAdminTab(page, locale, "featured-partners");
    await page.getByRole("link", { name: /partner hinzufügen|add partner/i }).click();
    await page.goto(`/${locale}/admin/featured-partners/add?q=${encodeURIComponent(partner.name)}`);
    const addRow = page.getByRole("row").filter({ hasText: partner.name });
    await expect(addRow).toBeVisible({ timeout: 15_000 });
    await addRow.getByRole("button", { name: /zur featured-liste|add to featured/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/featured-partners/?$`), {
      timeout: 30_000,
    });

    const tile = page
      .locator(".admin-featured-partners__tile")
      .filter({ hasText: partner.name })
      .first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    await tile.locator(".admin-featured-partners__checkbox").check({ force: true });
    await page.getByRole("link", { name: /partner entfernen|remove partners/i }).click();
    await expect(page).toHaveURL(/\/admin\/featured-partners\/remove/);
    await page
      .getByRole("button", { name: /aus featured entfernen|remove from featured/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/featured-partners/?$`), {
      timeout: 30_000,
    });
    await expect(
      page.locator(".admin-featured-partners__tile").filter({ hasText: partner.name }),
    ).toHaveCount(0);

    await page.goto(`/${locale}/discover`);
    await expect(page.getByLabel(partner.name, { exact: true })).toHaveCount(0);

    await navigateAdminTab(page, locale, "partners");
    await expect(page.getByRole("row").filter({ hasText: partner.name })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Scenario: Partner list search is labeled Name", async ({ page, locale }) => {
    await navigateAdminTab(page, locale, "partners");
    const search = page.getByRole("searchbox", { name: /^name$/i });
    await expect(search).toBeVisible({ timeout: 15_000 });
    await expect(search).toHaveAttribute("placeholder", /^Name$/i);
    await expect(
      page.getByRole("searchbox", { name: /titel oder partner|search title or partner/i }),
    ).toHaveCount(0);
  });

  // Scenario Outline: Partner list can be sorted — column headers (Name / Created / Active events).
  test("Scenario Outline: Partner list can be sorted", async ({ page, locale }) => {
    const cases = [
      { column: /^(name)$/i, sort: "name", dir: "asc" },
      { column: /^(name)$/i, sort: "name", dir: "desc", secondClick: true },
      { column: /^(erstellt|created)$/i, sort: "created", dir: "asc" },
      { column: /^(aktive events|active events)$/i, sort: "events", dir: "desc" },
      {
        column: /^(aktive events|active events)$/i,
        sort: "events",
        dir: "asc",
        secondClick: true,
      },
    ] as const;

    for (const { column, sort, dir, ...rest } of cases) {
      const secondClick = "secondClick" in rest && rest.secondClick;
      await page.goto(`/${locale}/admin/partners`);
      await expect(page.getByRole("heading", { name: /^partner$|^partners$/i })).toBeVisible({
        timeout: 15_000,
      });
      const header = page.getByRole("link", { name: column }).first();
      await header.click();
      if (secondClick) {
        await page.getByRole("link", { name: column }).first().click();
      }
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });

      const isDefault = sort === "created" && dir === "desc";
      if (isDefault) {
        await expect(page).not.toHaveURL(/[?&]sort=/);
      } else {
        await expect(page).toHaveURL(new RegExp(`[?&]sort=${sort}(?:&|$)`));
        await expect(page).toHaveURL(new RegExp(`[?&]dir=${dir}(?:&|$)`));
      }
    }
  });

  test("Scenario: Partner list reset filters clears search and sort", async ({ page, locale }) => {
    await page.goto(`/${locale}/admin/partners?q=demo&sort=name&dir=asc`);
    await expect(page.getByRole("heading", { name: /^partner$|^partners$/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("link", { name: /filter zurücksetzen|reset filters/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/?$`));
    await expect(page).not.toHaveURL(/[?&](q|sort|dir)=/);
  });

  test("Scenario: Partner list shows Active events column", async ({ page, locale }) => {
    await navigateAdminTab(page, locale, "partners");
    const empty = page.getByText(/noch keine partner|no partners yet/i);
    if ((await empty.count()) > 0) {
      await expect(empty.first()).toBeVisible();
      return;
    }
    await expect(page.getByText(/aktive events|active events/i).first()).toBeVisible({
      timeout: 15_000,
    });
    const row = page.getByRole("row").nth(1);
    await expect(row).toBeVisible();
    // Active events is the 6th cell (logo, name, email, address, created, active).
    await expect(row.getByRole("cell").nth(5)).toHaveText(/^\d+$/);
  });

  test("Scenario: Partner list Export opens sales export", async ({ page, locale }) => {
    await navigateAdminTab(page, locale, "partners");
    await page.getByRole("link", { name: /^export$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/export`));
    await expect(
      page.getByRole("heading", { name: /^verkaufsexport$|^sales export$/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario: View tickets sold for a period", async ({ page, locale }) => {
    await page.goto(`/${locale}/admin/partners/export`);
    await expect(
      page.getByRole("heading", { name: /^verkaufsexport$|^sales export$/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/^von$|^from$/i)).toBeVisible();
    await expect(page.getByLabel(/^bis$|^to$/i)).toBeVisible();
    await expect(page.getByLabel(/event-titel|event title/i)).toBeVisible();
    await expect(page.getByLabel(/partnername|partner name/i)).toBeVisible();
    await page.getByRole("button", { name: /^anzeigen$|^show$/i }).click();
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });

    const empty = page.getByText(/keine events vorhanden|no events yet/i);
    const table = page.getByRole("table", { name: /^verkaufsexport$|^sales export$/i });
    if ((await empty.count()) > 0) {
      await expect(empty.first()).toBeVisible();
    } else {
      await expect(table).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /^titel$|^title$/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /^partner$/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /^datum$|^date$/i })).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: /verkaufte tickets|tickets sold/i }),
      ).toBeVisible();
    }
  });

  test("Scenario: Filter sales export by event title and partner name", async ({
    page,
    locale,
  }) => {
    await page.goto(`/${locale}/admin/partners/export`);
    await expect(
      page.getByRole("heading", { name: /^verkaufsexport$|^sales export$/i }),
    ).toBeVisible({ timeout: 15_000 });

    const from = await page.getByLabel(/^von$|^from$/i).inputValue();
    const to = await page.getByLabel(/^bis$|^to$/i).inputValue();
    await page.getByLabel(/event-titel|event title/i).fill("demo");
    await page.getByLabel(/partnername|partner name/i).fill("berlin");
    await page.getByRole("button", { name: /^anzeigen$|^show$/i }).click();
    await expect(page).toHaveURL(/[?&]title=demo(?:&|$)/);
    await expect(page).toHaveURL(/[?&]partner=berlin(?:&|$)/);
    await expect(
      page.getByRole("link", { name: /filter zurücksetzen|reset filters/i }),
    ).toBeVisible();

    const csvLink = page.getByRole("link", { name: /csv herunterladen|download csv/i }).first();
    if ((await csvLink.count()) > 0) {
      const href = await csvLink.getAttribute("href");
      expect(href).toMatch(/[?&]title=demo(?:&|$)/);
      expect(href).toMatch(/[?&]partner=berlin(?:&|$)/);
      expect(href).toMatch(/[?&]format=csv(?:&|$)/);
    } else {
      const csvUrl = `/${locale}/admin/partners/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&title=demo&partner=berlin&format=csv`;
      const response = await page.request.get(csvUrl);
      expect(response.ok()).toBeTruthy();
      const body = await response.text();
      expect(body.split("\n")[0] ?? "").toMatch(/tickets_sold/);
    }
  });

  test("Scenario: Download sales CSV", async ({ page, locale }) => {
    await page.goto(`/${locale}/admin/partners/export`);
    await expect(
      page.getByRole("heading", { name: /^verkaufsexport$|^sales export$/i }),
    ).toBeVisible({ timeout: 15_000 });

    const from = await page.getByLabel(/^von$|^from$/i).inputValue();
    const to = await page.getByLabel(/^bis$|^to$/i).inputValue();
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const csvUrl = `/${locale}/admin/partners/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=csv`;
    const response = await page.request.get(csvUrl);
    expect(response.ok()).toBeTruthy();
    const contentType = response.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/text\/csv/);
    const disposition = response.headers()["content-disposition"] ?? "";
    expect(disposition).toMatch(/attachment/i);
    expect(disposition).toMatch(/sales-export-/);
    const body = await response.text();
    expect(body.split("\n")[0] ?? "").toMatch(/tickets_sold/);

    const filteredUrl = `/${locale}/admin/partners/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&title=__no_such_event__&format=csv`;
    const filtered = await page.request.get(filteredUrl);
    expect(filtered.ok()).toBeTruthy();
    const filteredBody = await filtered.text();
    expect(filteredBody.trim()).toBe("event_id,title,partner_name,date_time,tickets_sold");
  });

  test("Scenario: Sales export is admin-only", async ({ page, locale, context }) => {
    await context.clearCookies();
    await page.goto(`/${locale}/admin/partners/export`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?returnTo=`));
  });

  test("Scenario: Regenerate a partner's venue check-in QR token", {
    tag: "@skip-no-ui",
  }, async () => {
    test.skip(true, "post-MVP — no admin UI for venue check-in QR regenerate (domain helper only)");
  });

  test("Scenario: Create partner portal login access", { tag: "@skip-no-ui" }, async () => {
    test.skip(true, "post-MVP — partner portal access UI not built");
  });

  test("Scenario: Creating portal access when it already exists", {
    tag: "@skip-no-ui",
  }, async () => {
    test.skip(true, "post-MVP — partner portal access UI not built");
  });

  test("Scenario: Creating portal access requires a valid email", {
    tag: "@skip-no-ui",
  }, async () => {
    test.skip(true, "post-MVP — partner portal access UI not built");
  });

  test("Scenario: Creating portal access with an email already in use", {
    tag: "@skip-no-ui",
  }, async () => {
    test.skip(true, "post-MVP — partner portal access UI not built");
  });
});
