import { describe, expect, test } from "bun:test";
import {
  AGE_GROUPS,
  INTERESTS,
  MOODS,
  PREFERRED_LANGUAGES,
  TIMING_OPTIONS,
  WEEKDAYS,
} from "@unveiled/auth/constants";
import type { Locale } from "./locale";
import {
  getAgeGroupLabel,
  getInterestLabel,
  getMoodLabel,
  getOnboardingCopy,
  getPreferredLanguageLabel,
  getPreferredLanguageOptions,
  getTimingLabel,
  getWeekdayLabel,
} from "./onboarding-content";

const locales: Locale[] = ["de", "en"];

describe("onboarding-content i18n", () => {
  test("shell copy differs by locale", () => {
    expect(getOnboardingCopy("de").title).toBe("DEIN KULTUR-PROFIL.");
    expect(getOnboardingCopy("en").title).toBe("YOUR CULTURE PROFILE.");
    expect(getOnboardingCopy("de").next).toBe("WEITER");
    expect(getOnboardingCopy("en").next).toBe("NEXT");
  });

  test("accessibility section and option labels are split by locale", () => {
    expect(getOnboardingCopy("en").accessibilitySectionLabel).toBe("Accessibility needed?");
    expect(getOnboardingCopy("en").accessibilityOptionLabel).toBe("Yes");
    expect(getOnboardingCopy("de").accessibilitySectionLabel).toBe("Barrierefreiheit benötigt?");
    expect(getOnboardingCopy("de").accessibilityOptionLabel).toBe("Ja");
  });

  test("language search placeholder is localized", () => {
    expect(getOnboardingCopy("en").languageSearchPlaceholder).toBe("Search languages");
    expect(getOnboardingCopy("de").languageSearchPlaceholder).toBe("Sprachen suchen");
  });

  test("preferred language options pin DE and EN then sort by locale label", () => {
    const en = getPreferredLanguageOptions("en");
    expect(en[0]?.code).toBe("DE");
    expect(en[1]?.code).toBe("EN");
    expect(en[0]?.label).toBe("German");
    expect(en[1]?.label).toBe("English");
    expect(en.some((option) => option.code === "Non-Verbal")).toBe(false);

    const restLabels = en.slice(2).map((option) => option.label);
    expect(restLabels).toEqual([...restLabels].sort((a, b) => a.localeCompare(b, "en")));

    const de = getPreferredLanguageOptions("de");
    expect(de[0]?.label).toBe("Deutsch");
    expect(de[1]?.label).toBe("Englisch");
    const deRest = de.slice(2).map((option) => option.label);
    expect(deRest).toEqual([...deRest].sort((a, b) => a.localeCompare(b, "de")));
  });

  test("every allowlist value has localized labels in both locales", () => {
    for (const locale of locales) {
      for (const value of AGE_GROUPS) {
        expect(getAgeGroupLabel(locale, value)).toBe(value);
      }
      for (const value of INTERESTS) {
        expect(getInterestLabel(locale, value).length).toBeGreaterThan(0);
      }
      for (const value of MOODS) {
        expect(getMoodLabel(locale, value).length).toBeGreaterThan(0);
      }
      for (const value of TIMING_OPTIONS) {
        expect(getTimingLabel(locale, value).length).toBeGreaterThan(0);
      }
      for (const value of WEEKDAYS) {
        expect(getWeekdayLabel(locale, value).length).toBeGreaterThan(0);
      }
      for (const value of PREFERRED_LANGUAGES) {
        expect(getPreferredLanguageLabel(locale, value).length).toBeGreaterThan(0);
      }
    }
  });

  test("EN option labels translate German canonical values", () => {
    expect(getInterestLabel("en", "Kino")).toBe("Cinema");
    expect(getInterestLabel("en", "Ausstellung")).toBe("Exhibition");
    expect(getInterestLabel("en", "Other")).toBe("Other");
    expect(getInterestLabel("de", "Other")).toBe("Sonstiges");
    expect(getMoodLabel("en", "Leicht")).toBe("Light");
    expect(getMoodLabel("en", "Fam")).toBe("Family-friendly");
    expect(getTimingLabel("en", "Day")).toBe("Daytime");
    expect(getWeekdayLabel("en", "Monday")).toBe("Monday");
    expect(getWeekdayLabel("de", "Monday")).toBe("Montag");
    expect(getPreferredLanguageLabel("en", "DE")).toBe("German");
    expect(getPreferredLanguageLabel("de", "EN")).toBe("Englisch");
  });

  test("DE timing labels are German", () => {
    expect(getTimingLabel("de", "After Work")).toBe("Nach der Arbeit");
    expect(getTimingLabel("de", "Weekend")).toBe("Wochenende");
    expect(getTimingLabel("de", "Day")).toBe("Tagsüber");
  });

  test("location copy uses Germany/Berlin zip labels", () => {
    expect(getOnboardingCopy("de").locationLabel).toBe("DEIN STANDORT");
    expect(getOnboardingCopy("de").countryLabel).toBe("Land");
    expect(getOnboardingCopy("de").countryDisplay).toBe("Deutschland");
    expect(getOnboardingCopy("de").cityLabel).toBe("Stadt");
    expect(getOnboardingCopy("de").cityDisplay).toBe("Berlin");
    expect(getOnboardingCopy("de").zipCodeLabel).toBe("PLZ");
    expect(getOnboardingCopy("de").zipCodeHint).toContain("Berlin");
    expect(getOnboardingCopy("de").radiusLabel).toBe("Wie weit bist du bereit zu fahren?");
    expect(getOnboardingCopy("de").km).toBe("km");
    expect(getOnboardingCopy("de").invalidMaxDistance).toContain("1");
    expect(getOnboardingCopy("en").locationLabel).toBe("YOUR LOCATION");
    expect(getOnboardingCopy("en").countryLabel).toBe("Country");
    expect(getOnboardingCopy("en").countryDisplay).toBe("Germany");
    expect(getOnboardingCopy("en").cityLabel).toBe("City");
    expect(getOnboardingCopy("en").cityDisplay).toBe("Berlin");
    expect(getOnboardingCopy("en").zipCodeLabel).toBe("Zip code");
    expect(getOnboardingCopy("en").zipCodeHint).toContain("Berlin");
    expect(getOnboardingCopy("en").radiusLabel).toBe("How far will you travel?");
    expect(getOnboardingCopy("en").km).toBe("km");
    expect(getOnboardingCopy("en").invalidMaxDistance).toContain("50");
  });
});
