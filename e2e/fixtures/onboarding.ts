import type { Page } from "@playwright/test";

import type { Locale } from "./base";
import { expect } from "./base";

/**
 * Select a HeroUI Radio/Checkbox by accessible name.
 * Native check()/click on the input is unreliable — control spans intercept events
 * and force-check may not sync React Aria form state. Prefer label click, then Space.
 */
async function selectOption(page: Page, name: string | RegExp): Promise<void> {
  const label = page.locator("label").filter({ hasText: name }).first();
  if ((await label.count()) > 0) {
    await label.click();
    return;
  }
  const radio = page.getByRole("radio", { name });
  if ((await radio.count()) > 0) {
    await radio.focus();
    await page.keyboard.press("Space");
    return;
  }
  const checkbox = page.getByRole("checkbox", { name });
  await checkbox.focus();
  await page.keyboard.press("Space");
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

export async function completeInterestsStep(page: Page, locale: Locale = "de"): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/interests`));
  await selectOption(page, "Theater");
  await selectOption(page, locale === "de" ? "Leicht" : "Light");
  await page.getByRole("button", { name: /weiter|next/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/location`), { timeout: 15_000 });
}

export async function completeLocationStep(page: Page, locale: Locale = "de"): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/location`));
  await selectOption(page, "Mitte");
  await page.getByRole("button", { name: /weiter|next/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/timing`), { timeout: 15_000 });
}

export async function completeTimingStep(page: Page, locale: Locale = "de"): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/timing`));
  await selectOption(page, locale === "de" ? "Wochenende" : "Weekend");
  await selectOption(page, locale === "de" ? "Samstag" : "Saturday");
  await selectOption(page, locale === "de" ? "Deutsch" : "German");
  await page.getByRole("button", { name: /fertig|finish/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/membership`), { timeout: 30_000 });
}

/** Drive the full four-step wizard from age through membership redirect. */
export async function completeOnboardingWizard(page: Page, locale: Locale = "de"): Promise<void> {
  await completeAgeStep(page, locale);
  await completeInterestsStep(page, locale);
  await completeLocationStep(page, locale);
  await completeTimingStep(page, locale);
}
