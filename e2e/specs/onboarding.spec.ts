import { loginAsAdmin, logout, signupFreshUser } from "../fixtures/auth";
import { expect, test } from "../fixtures/base";
import {
  completeAgeStep,
  completeInterestsStep,
  completeInterestsStepBlank,
  completeLocationStep,
  completeLocationStepBlank,
  completeOnboardingWizard,
  completeOnboardingWizardBlank,
  completeTimingStep,
  completeTimingStepBlank,
  skipAgeStep,
} from "../fixtures/onboarding";
import { hasAdminCredentials } from "../fixtures/waitlist";

test.describe("onboarding.feature", () => {
  test("Scenario: Onboarding is required before using the app", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await page.goto(`/${locale}/events`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/`));
  });

  test("Scenario: Non-USER roles skip onboarding", async ({ page, locale }) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_* required for ADMIN onboarding skip");
    // ADMIN via ADMIN_PROMOTE_EMAILS — never shown the wizard after promotion.
    await loginAsAdmin(page, locale);
    // If admin account was just created as USER, first login may hit onboarding before promote.
    // Re-login forces session resolve + promote.
    if (page.url().includes("/onboarding")) {
      await logout(page, locale).catch(() => undefined);
      await loginAsAdmin(page, locale);
    }
    await expect(page).not.toHaveURL(/\/onboarding\//);
    // Middleware 302s ADMIN away from /onboarding/*; concurrent wait avoids ERR_ABORTED on goto.
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes("/onboarding"), { timeout: 15_000 }),
      page.goto(`/${locale}/onboarding/age`).catch(() => undefined),
    ]);
    await expect(page).not.toHaveURL(/\/onboarding\//);
  });

  test("Scenario: Already-onboarded users skip onboarding", async ({ page, locale }) => {
    const { email, password } = await signupFreshUser(page, locale);
    await completeOnboardingWizard(page, locale);
    await page.goto(`/${locale}/onboarding/age`);
    // Inactive / non-booking-eligible USERs land on Discover; booking-eligible on /events.
    await expect(page).toHaveURL(new RegExp(`/${locale}/(events|discover)`));
    void email;
    void password;
  });

  test("Scenario: Step 1 — age group (skippable)", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await expect(page.getByText(/wie alt bist du|how old are you/i)).toBeVisible();
    await expect(page.getByText("18-25")).toBeVisible();
    await expect(page.getByText("26-35")).toBeVisible();
    await expect(page.getByText("36-50")).toBeVisible();
    await expect(page.getByText("50+")).toBeVisible();
    await expect(page.getByRole("button", { name: /überspringen|skip/i })).toBeVisible();
    await completeAgeStep(page, locale, "26-35");
  });

  test("Scenario: Step 2 — interests and moods", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await completeAgeStep(page, locale);
    await expect(page.getByText(/was interessiert dich|what interests you/i)).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Theater" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Kino" })).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: locale === "de" ? "Sonstiges" : "Other" }),
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: locale === "de" ? "Leicht" : "Light" }),
    ).toBeVisible();
    await completeInterestsStep(page, locale);
  });

  test("Scenario: Step 2 — interests and moods optional", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await completeAgeStep(page, locale);
    await completeInterestsStepBlank(page, locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/location`));
  });

  test("Scenario: Step 3 — zip under Germany/Berlin", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await completeAgeStep(page, locale);
    await completeInterestsStep(page, locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/location`));
    await expect(page.locator("#onboarding-country-display")).toHaveValue(
      locale === "de" ? "Deutschland" : "Germany",
    );
    await expect(page.locator("#onboarding-city-display")).toHaveValue("Berlin");
    await expect(page.locator("#zip_code")).toBeVisible();
    await expect(page.locator("#zip_code")).not.toHaveAttribute("required", "");
    await expect(page.getByRole("checkbox", { name: "Mitte" })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "Neukölln" })).toHaveCount(0);
    await expect(
      page.getByRole("spinbutton", {
        name: /wie weit bist du bereit zu fahren\?|how far will you travel\?/i,
      }),
    ).toHaveCount(0);
    await expect(page.locator("#max_distance")).toHaveCount(0);

    // Invalid non-empty zip is rejected with a validation message.
    await page.locator("#zip_code").evaluate(() => {
      const zip = document.querySelector<HTMLInputElement>("#zip_code");
      const form = document.querySelector<HTMLFormElement>("form.onboarding-form");
      if (!zip || !form) {
        throw new Error("location form fields missing");
      }
      zip.value = "80331";
      form.requestSubmit();
    });
    await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/location`), { timeout: 15_000 });
    await expect(page.getByText(/bitte prüfe|please check/i)).toBeVisible();

    // Blank zip advances to timing.
    await completeLocationStepBlank(page, locale);
  });

  test("Scenario: Step 4 — timing, days, languages, accessibility", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await completeAgeStep(page, locale);
    await completeInterestsStep(page, locale);
    await completeLocationStep(page, locale);
    await expect(page.getByText(/wann hast du zeit|when do you have time/i)).toBeVisible();
    await expect(page.getByText(/welche tage|which days/i)).toBeVisible();
    await expect(page.getByText(/sprachen|languages/i).first()).toBeVisible();
    await expect(
      page.getByPlaceholder(locale === "de" ? /sprachen suchen/i : /search languages/i),
    ).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /non-verbal/i })).toHaveCount(0);
    await expect(
      page.getByText(/barrierefreiheit benötigt\?|accessibility needed\?/i),
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", {
        name: locale === "de" ? /^ja$/i : /^yes$/i,
      }),
    ).toBeVisible();
    await completeTimingStep(page, locale);
  });

  test("Scenario: Step 4 — timing preferences optional", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await skipAgeStep(page, locale);
    await completeInterestsStepBlank(page, locale);
    await completeLocationStepBlank(page, locale);
    await completeTimingStepBlank(page, locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/membership`));
  });

  test("Scenario: Completing onboarding", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await completeOnboardingWizard(page, locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/membership`));
  });

  test("Scenario: Completing onboarding with all fields blank", async ({ page, locale }) => {
    await signupFreshUser(page, locale);
    await completeOnboardingWizardBlank(page, locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/membership`));
  });
});
