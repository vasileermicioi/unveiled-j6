import {
  AGE_GROUPS,
  DISTRICTS,
  INTERESTS,
  MAX_DISTANCE_MAX,
  MAX_DISTANCE_MIN,
  MOODS,
  PREFERRED_LANGUAGES,
  TIMING_OPTIONS,
  WEEKDAYS,
} from "@unveiled/auth/constants";

import type { Locale } from "./locale";

export type OnboardingStepKey = "age" | "interests" | "location" | "timing";

type OnboardingCopy = {
  title: string;
  subtitle: string;
  ageLabel: string;
  ageSubtitle: string;
  interestLabel: string;
  moodLabel: string;
  districtLabel: string;
  radiusLabel: string;
  timingLabel: string;
  daysLabel: string;
  languagePrefLabel: string;
  accessibilityLabel: string;
  next: string;
  skip: string;
  finish: string;
  km: string;
  validationError: string;
  stepOf: (current: number, total: number) => string;
};

const copy: Record<Locale, OnboardingCopy> = {
  de: {
    title: "DEIN KULTUR-PROFIL.",
    subtitle: "Wir finden die Events, die wirklich zu dir passen.",
    ageLabel: "WIE ALT BIST DU?",
    ageSubtitle: "Keine Sorge, nur für die Statistik (und Altersbeschränkungen).",
    interestLabel: "WAS INTERESSIERT DICH?",
    moodLabel: "WELCHE VIBES SUCHST DU?",
    districtLabel: "WO BIST DU UNTERWEGS?",
    radiusLabel: "WIE WEIT WÜRDEST DU FAHREN?",
    timingLabel: "WANN HAST DU ZEIT?",
    daysLabel: "WELCHE TAGE?",
    languagePrefLabel: "SPRACHEN?",
    accessibilityLabel: "BARRIEREFREIHEIT ERFORDERLICH?",
    next: "WEITER",
    skip: "ÜBERSPRINGEN",
    finish: "FERTIG",
    km: "km",
    validationError: "Bitte prüfe deine Auswahl und versuche es erneut.",
    stepOf: (current, total) => `Schritt ${current} von ${total}`,
  },
  en: {
    title: "YOUR CULTURE PROFILE.",
    subtitle: "Let's find the events that actually vibe with you.",
    ageLabel: "HOW OLD ARE YOU?",
    ageSubtitle: "Don't worry, just for stats (and age restrictions).",
    interestLabel: "WHAT INTERESTS YOU?",
    moodLabel: "WHAT VIBES ARE YOU AFTER?",
    districtLabel: "WHERE DO YOU HANG OUT?",
    radiusLabel: "HOW FAR WOULD YOU TRAVEL?",
    timingLabel: "WHEN DO YOU HAVE TIME?",
    daysLabel: "WHICH DAYS?",
    languagePrefLabel: "LANGUAGES?",
    accessibilityLabel: "ACCESSIBILITY REQUIRED?",
    next: "NEXT",
    skip: "SKIP",
    finish: "FINISH",
    km: "km",
    validationError: "Please check your selections and try again.",
    stepOf: (current, total) => `Step ${current} of ${total}`,
  },
};

const weekdayLabels: Record<Locale, Record<(typeof WEEKDAYS)[number], string>> = {
  de: {
    Monday: "Montag",
    Tuesday: "Dienstag",
    Wednesday: "Mittwoch",
    Thursday: "Donnerstag",
    Friday: "Freitag",
    Saturday: "Samstag",
    Sunday: "Sonntag",
  },
  en: {
    Monday: "Monday",
    Tuesday: "Tuesday",
    Wednesday: "Wednesday",
    Thursday: "Thursday",
    Friday: "Friday",
    Saturday: "Saturday",
    Sunday: "Sunday",
  },
};

const timingLabels: Record<Locale, Record<(typeof TIMING_OPTIONS)[number], string>> = {
  de: {
    "After Work": "Nach der Arbeit",
    Weekend: "Wochenende",
    Day: "Tagsüber",
  },
  en: {
    "After Work": "After Work",
    Weekend: "Weekend",
    Day: "Daytime",
  },
};

const languageLabels: Record<Locale, Record<(typeof PREFERRED_LANGUAGES)[number], string>> = {
  de: {
    DE: "Deutsch",
    EN: "Englisch",
    "Non-Verbal": "Nonverbal",
  },
  en: {
    DE: "German",
    EN: "English",
    "Non-Verbal": "Non-verbal",
  },
};

const interestLabels: Record<Locale, Record<(typeof INTERESTS)[number], string>> = {
  de: {
    Theater: "Theater",
    Kino: "Kino",
    Museum: "Museum",
    Ausstellung: "Ausstellung",
    Konzert: "Konzert",
    "Talk/Lesung": "Talk/Lesung",
    Comedy: "Comedy",
    "Tanz/Performance": "Tanz/Performance",
  },
  en: {
    Theater: "Theater",
    Kino: "Cinema",
    Museum: "Museum",
    Ausstellung: "Exhibition",
    Konzert: "Concert",
    "Talk/Lesung": "Talk / Reading",
    Comedy: "Comedy",
    "Tanz/Performance": "Dance / Performance",
  },
};

const moodLabels: Record<Locale, Record<(typeof MOODS)[number], string>> = {
  de: {
    Leicht: "Leicht",
    Experimentell: "Experimentell",
    Klassisch: "Klassisch",
    Politisch: "Politisch",
    Fam: "Familiär",
  },
  en: {
    Leicht: "Light",
    Experimentell: "Experimental",
    Klassisch: "Classical",
    Politisch: "Political",
    Fam: "Family-friendly",
  },
};

const districtLabels: Record<Locale, Record<(typeof DISTRICTS)[number], string>> = {
  de: {
    Mitte: "Mitte",
    "X-Berg": "Kreuzberg",
    "P-Berg": "Prenzlauer Berg",
    Charlottenburg: "Charlottenburg",
    Wedding: "Wedding",
    "F-Hain": "Friedrichshain",
    Schöneberg: "Schöneberg",
  },
  en: {
    Mitte: "Mitte",
    "X-Berg": "Kreuzberg",
    "P-Berg": "Prenzlauer Berg",
    Charlottenburg: "Charlottenburg",
    Wedding: "Wedding",
    "F-Hain": "Friedrichshain",
    Schöneberg: "Schöneberg",
  },
};

const ageGroupLabels: Record<Locale, Record<(typeof AGE_GROUPS)[number], string>> = {
  de: {
    "18-25": "18-25",
    "26-35": "26-35",
    "36-50": "36-50",
    "50+": "50+",
  },
  en: {
    "18-25": "18-25",
    "26-35": "26-35",
    "36-50": "36-50",
    "50+": "50+",
  },
};

export function getOnboardingCopy(locale: Locale): OnboardingCopy {
  return copy[locale];
}

export function getOnboardingStepMeta(locale: Locale, step: OnboardingStepKey) {
  const shared = getOnboardingCopy(locale);
  switch (step) {
    case "age":
      return { heading: shared.ageLabel, description: shared.ageSubtitle, stepNumber: 1 as const };
    case "interests":
      return {
        heading: shared.interestLabel,
        description: shared.moodLabel,
        stepNumber: 2 as const,
      };
    case "location":
      return {
        heading: shared.districtLabel,
        description: shared.radiusLabel,
        stepNumber: 3 as const,
      };
    case "timing":
      return {
        heading: shared.timingLabel,
        description: shared.daysLabel,
        stepNumber: 4 as const,
      };
  }
}

export function getAgeGroupLabel(locale: Locale, value: (typeof AGE_GROUPS)[number]): string {
  return ageGroupLabels[locale][value];
}

export function getInterestLabel(locale: Locale, value: (typeof INTERESTS)[number]): string {
  return interestLabels[locale][value];
}

export function getMoodLabel(locale: Locale, value: (typeof MOODS)[number]): string {
  return moodLabels[locale][value];
}

export function getDistrictLabel(locale: Locale, value: (typeof DISTRICTS)[number]): string {
  return districtLabels[locale][value];
}

export function getTimingLabel(locale: Locale, value: (typeof TIMING_OPTIONS)[number]): string {
  return timingLabels[locale][value];
}

export function getWeekdayLabel(locale: Locale, value: (typeof WEEKDAYS)[number]): string {
  return weekdayLabels[locale][value];
}

export function getPreferredLanguageLabel(
  locale: Locale,
  value: (typeof PREFERRED_LANGUAGES)[number],
): string {
  return languageLabels[locale][value];
}

export {
  AGE_GROUPS,
  DISTRICTS,
  INTERESTS,
  MAX_DISTANCE_MAX,
  MAX_DISTANCE_MIN,
  MOODS,
  PREFERRED_LANGUAGES,
  TIMING_OPTIONS,
  WEEKDAYS,
};
