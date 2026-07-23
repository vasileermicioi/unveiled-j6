import {
  adminLabels,
  adminTabLabels,
  createEventViaUI,
  createPartnerViaUI,
  deletePartnerViaUI,
  expectEventOnDiscover,
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
    const partner = await createPartnerViaUI(page, locale);
    await navigateAdminTab(page, locale, "partners");
    // PageSectionHeader: Admin/Verwaltung eyebrow + Partners/Partner title (proximity roles/names).
    await expect(page.getByText(/^verwaltung$|^admin$/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /^partner$|^partners$/i })).toBeVisible();
    await expect(page.getByText(partner.name).first()).toBeVisible();
    await expect(page.getByText(partner.contactEmail).first()).toBeVisible();
  });

  test("Scenario: Supply the partner logo as a direct upload or a remote URL", async ({
    page,
    locale,
  }) => {
    test.skip(!r2Configured(), "R2 vars not configured");
    // Admin UI is upload-only (no logo URL field). Remote URL path is seed/CLI only.
    const partner = await createPartnerViaUI(page, locale, { logoPath: SAMPLE_EVENT_IMAGE });
    await expect(page.getByText(partner.name).first()).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: partner.name });
    // Logo <img alt=""> is decorative — not exposed as role=img; assert DOM presence.
    const logo = row.locator("img").first();
    await expect(logo).toBeVisible({ timeout: 15_000 });
    await expect(logo).toHaveAttribute("src", /small-320\.jpg(?:\?|$)/);
  });

  test('Scenario Outline: Partner creation validation — name = ""', async ({ page, locale }) => {
    await page.goto(`/${locale}/admin/partners/new`);
    await fillTextbox(page, adminLabels.email, "valid@example.com");
    await fillTextbox(page, adminLabels.address, "Somewhere, Berlin");
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
    await page.goto(`/${locale}/admin/partners/new`);
    await fillTextbox(page, adminLabels.name, `E2E Invalid Email ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.email, "not-an-email");
    await fillTextbox(page, adminLabels.address, "Somewhere, Berlin");
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

  test('Scenario Outline: Partner creation validation — address = ""', async ({ page, locale }) => {
    await page.goto(`/${locale}/admin/partners/new`);
    await fillTextbox(page, adminLabels.name, `E2E No Address ${uniqueSuffix()}`);
    await fillTextbox(page, adminLabels.email, "valid@example.com");
    await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/new`));
    const addressField = page.getByRole("textbox", { name: adminLabels.address, exact: true });
    const invalid = await addressField.evaluate(
      (el) => (el as HTMLTextAreaElement).validity?.valueMissing,
    );
    expect(invalid || page.url().includes("/partners/new")).toBeTruthy();
  });

  test("Scenario: Edit a partner", async ({ page, locale }) => {
    const partner = await createPartnerViaUI(page, locale);
    const row = page.getByRole("row").filter({ hasText: partner.name });
    await row.getByRole("link", { name: /bearbeiten|edit/i }).click();
    await expect(page).toHaveURL(/\/admin\/partners\/.+\/edit/);

    const updatedAddress = `Updated ${uniqueSuffix()}, Berlin`;
    await fillTextbox(page, adminLabels.address, updatedAddress);
    await page.getByRole("button", { name: /^speichern$|^save$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/?$`));
    await expect(page.getByText(updatedAddress).first()).toBeVisible();
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
    const partner = await createPartnerViaUI(page, locale);
    await deletePartnerViaUI(page, locale, partner.name);
  });

  test("Scenario: List featured partners", async ({ page, locale }) => {
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
