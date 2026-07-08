import { describe, expect, test } from "bun:test";
import {
  AGE_GROUPS,
  DISTRICTS,
  INTERESTS,
  MOODS,
  PREFERRED_LANGUAGES,
  TIMING_OPTIONS,
  WEEKDAYS,
} from "@unveiled/auth/constants";
import type { Locale } from "./locale";
import {
  getAgeGroupLabel,
  getDistrictLabel,
  getInterestLabel,
  getMoodLabel,
  getOnboardingCopy,
  getPreferredLanguageLabel,
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
      for (const value of DISTRICTS) {
        expect(getDistrictLabel(locale, value).length).toBeGreaterThan(0);
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
    expect(getMoodLabel("en", "Leicht")).toBe("Light");
    expect(getMoodLabel("en", "Fam")).toBe("Family-friendly");
    expect(getDistrictLabel("en", "X-Berg")).toBe("Kreuzberg");
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

  test("DE district labels keep Berlin shorthand", () => {
    expect(getDistrictLabel("de", "X-Berg")).toBe("X-Berg");
    expect(getDistrictLabel("de", "P-Berg")).toBe("P-Berg");
    expect(getDistrictLabel("de", "F-Hain")).toBe("F-Hain");
  });
});
