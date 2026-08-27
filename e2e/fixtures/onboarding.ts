import type { Page } from "@playwright/test";

import type { Locale } from "./base";
import { expect } from "./base";

/**
 * Select a native radio/checkbox by accessible name (label text).
 * Prefer role locators; fall back to associated label click.
 */
async function selectOption(page: Page, name: string | RegExp): Promise<void> {
  const radio = page.getByRole("radio", { name });
  if ((await radio.count()) > 0) {
    await radio.check();
    return;
  }
  const checkbox = page.getByRole("checkbox", { name });
  if ((await checkbox.count()) > 0) {
    await checkbox.check();
    return;
  }
  await page.locator("label").filter({ hasText: name }).first().click();
}

export async function completeAgeStep(
  page: Page,
  locale: Locale = "de",
  ageGroup: string = "26-35",
): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/age`));
  await selectOption(page, ageGroup);
  await page.getByRole("button", { name: /weiter|next/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/interests`), { timeout: 15_000 });
}

export async function skipAgeStep(page: Page, locale: Locale = "de"): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/age`));
  await page.getByRole("button", { name: /überspringen|skip/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/interests`), { timeout: 15_000 });
}

export async function completeAgeStepBlank(page: Page, locale: Locale = "de"): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/age`));
  await page.getByRole("button", { name: /weiter|next/i }).click();
  await expect(page.getByText(/bitte prüfe|please check/i)).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/interests`), { timeout: 15_000 });
}

export async function completeInterestsStep(page: Page, locale: Locale = "de"): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/interests`));
  await selectOption(page, "Theater");
  await selectOption(page, locale === "de" ? "Leicht" : "Light");
  await page.getByRole("button", { name: /weiter|next/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/location`), { timeout: 15_000 });
}

export async function completeLocationStep(
  page: Page,
  locale: Locale = "de",
  zipCode: string = "10115",
): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/location`));
  // Playwright fill on uncontrolled fields remounts the HonoX island and can wipe values.
  // Set zip + submit in one browser turn so the POST includes the PLZ (or blank).
  await page.locator("#zip_code").evaluate((el, nextZip) => {
    const zip = el as HTMLInputElement;
    const form = document.querySelector<HTMLFormElement>("form.onboarding-form");
    if (!zip || !form) {
      throw new Error("location form fields missing");
    }
    zip.value = nextZip;
    form.requestSubmit();
  }, zipCode);
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/timing`), { timeout: 15_000 });
}

export async function completeLocationStepBlank(page: Page, locale: Locale = "de"): Promise<void> {
  await completeLocationStep(page, locale, "");
}

export async function completeInterestsStepBlank(page: Page, locale: Locale = "de"): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/interests`));
  await page.getByRole("button", { name: /weiter|next/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/location`), { timeout: 15_000 });
}

export async function completeTimingStep(
  page: Page,
  locale: Locale = "de",
  options: { fillPreferences?: boolean } = {},
): Promise<void> {
  const fillPreferences = options.fillPreferences ?? true;
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/timing`));
  if (fillPreferences) {
    await selectOption(page, locale === "de" ? "Wochenende" : "Weekend");
    await selectOption(page, locale === "de" ? "Samstag" : "Saturday");
    await selectOption(page, locale === "de" ? "Deutsch" : "German");
  }
  await page.getByRole("button", { name: /fertig|finish/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/membership`), { timeout: 30_000 });
}

export async function completeTimingStepBlank(page: Page, locale: Locale = "de"): Promise<void> {
  await completeTimingStep(page, locale, { fillPreferences: false });
}

/** Drive the full four-step wizard from age through membership redirect. */
export async function completeOnboardingWizard(page: Page, locale: Locale = "de"): Promise<void> {
  await completeAgeStep(page, locale);
  await completeInterestsStep(page, locale);
  await completeLocationStep(page, locale);
  await completeTimingStep(page, locale);
}

/** Drive the wizard leaving all optional preference fields blank. */
export async function completeOnboardingWizardBlank(
  page: Page,
  locale: Locale = "de",
): Promise<void> {
  await skipAgeStep(page, locale);
  await completeInterestsStepBlank(page, locale);
  await completeLocationStepBlank(page, locale);
  await completeTimingStepBlank(page, locale);
}
