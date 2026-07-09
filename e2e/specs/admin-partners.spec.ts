import {
  adminLabels,
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

test.describe("admin-partners.feature", () => {
  test.beforeEach(async ({ page, locale }, testInfo) => {
    if (testInfo.tags.includes("@skip-no-ui")) {
      return;
    }
    await loginAsAdmin(page, locale);
    await settleAdminSession(page, locale);
  });

  test("Scenario: Create a partner", async ({ page, locale }) => {
    const partner = await createPartnerViaUI(page, locale);
    await navigateAdminTab(page, locale, "partners");
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

  test("Scenario: Regenerate a partner's venue check-in QR token", {
    tag: "@skip-no-ui",
  }, async () => {
    test.skip(true, "Phase 4 — no admin UI for venue check-in QR regenerate (domain helper only)");
  });

  test("Scenario: Create partner portal login access", { tag: "@skip-no-ui" }, async () => {
    test.skip(true, "Phase 4 — partner portal access UI not built (admin-provisioned in Phase 8)");
  });

  test("Scenario: Creating portal access when it already exists", {
    tag: "@skip-no-ui",
  }, async () => {
    test.skip(true, "Phase 4 — partner portal access UI not built");
  });

  test("Scenario: Creating portal access requires a valid email", {
    tag: "@skip-no-ui",
  }, async () => {
    test.skip(true, "Phase 4 — partner portal access UI not built");
  });

  test("Scenario: Creating portal access with an email already in use", {
    tag: "@skip-no-ui",
  }, async () => {
    test.skip(true, "Phase 4 — partner portal access UI not built");
  });
});
