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

export type OnboardingStepKey = "age" | "interests" | "location" | "timing";

type OnboardingCopy = {
  title: string;
  subtitle: string;
  ageLabel: string;
  ageSubtitle: string;
  interestLabel: string;
  interestsOtherLabel: string;
  interestsOtherPlaceholder: string;
  moodLabel: string;
  districtLabel: string;
  districtSubtitle: string;
  timingLabel: string;
  daysLabel: string;
  languagePrefLabel: string;
  languageSearchPlaceholder: string;
  accessibilitySectionLabel: string;
  accessibilityOptionLabel: string;
  next: string;
  skip: string;
  finish: string;
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
    interestsOtherLabel: "Beschreibe dein Interesse",
    interestsOtherPlaceholder: "z. B. Spoken Word",
    moodLabel: "WELCHE VIBES SUCHST DU?",
    districtLabel: "WO BIST DU UNTERWEGS?",
    districtSubtitle: "Wähle einen oder mehrere Berliner Bezirke.",
    timingLabel: "WANN HAST DU ZEIT?",
    daysLabel: "WELCHE TAGE?",
    languagePrefLabel: "SPRACHEN?",
    languageSearchPlaceholder: "Sprachen suchen",
    accessibilitySectionLabel: "Barrierefreiheit benötigt?",
    accessibilityOptionLabel: "Ja",
    next: "WEITER",
    skip: "ÜBERSPRINGEN",
    finish: "FERTIG",
    validationError: "Bitte prüfe deine Auswahl und versuche es erneut.",
    stepOf: (current, total) => `Schritt ${current} von ${total}`,
  },
  en: {
    title: "YOUR CULTURE PROFILE.",
    subtitle: "Let's find the events that actually vibe with you.",
    ageLabel: "HOW OLD ARE YOU?",
    ageSubtitle: "Don't worry, just for stats (and age restrictions).",
    interestLabel: "WHAT INTERESTS YOU?",
    interestsOtherLabel: "Describe your interest",
    interestsOtherPlaceholder: "e.g. Spoken word",
    moodLabel: "WHAT VIBES ARE YOU AFTER?",
    districtLabel: "WHERE DO YOU HANG OUT?",
    districtSubtitle: "Pick one or more Berlin districts.",
    timingLabel: "WHEN DO YOU HAVE TIME?",
    daysLabel: "WHICH DAYS?",
    languagePrefLabel: "LANGUAGES?",
    languageSearchPlaceholder: "Search languages",
    accessibilitySectionLabel: "Accessibility needed?",
    accessibilityOptionLabel: "Yes",
    next: "NEXT",
    skip: "SKIP",
    finish: "FINISH",
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
    AR: "Arabisch",
    BG: "Bulgarisch",
    CS: "Tschechisch",
    DA: "Dänisch",
    EL: "Griechisch",
    ES: "Spanisch",
    FA: "Persisch",
    FI: "Finnisch",
    FR: "Französisch",
    HE: "Hebräisch",
    HI: "Hindi",
    HR: "Kroatisch",
    HU: "Ungarisch",
    IT: "Italienisch",
    JA: "Japanisch",
    KO: "Koreanisch",
    NL: "Niederländisch",
    NO: "Norwegisch",
    PL: "Polnisch",
    PT: "Portugiesisch",
    RO: "Rumänisch",
    RU: "Russisch",
    SV: "Schwedisch",
    TR: "Türkisch",
    UK: "Ukrainisch",
    VI: "Vietnamesisch",
    ZH: "Chinesisch",
  },
  en: {
    DE: "German",
    EN: "English",
    AR: "Arabic",
    BG: "Bulgarian",
    CS: "Czech",
    DA: "Danish",
    EL: "Greek",
    ES: "Spanish",
    FA: "Persian",
    FI: "Finnish",
    FR: "French",
    HE: "Hebrew",
    HI: "Hindi",
    HR: "Croatian",
    HU: "Hungarian",
    IT: "Italian",
    JA: "Japanese",
    KO: "Korean",
    NL: "Dutch",
    NO: "Norwegian",
    PL: "Polish",
    PT: "Portuguese",
    RO: "Romanian",
    RU: "Russian",
    SV: "Swedish",
    TR: "Turkish",
    UK: "Ukrainian",
    VI: "Vietnamese",
    ZH: "Chinese",
  },
};

export type PreferredLanguageOption = {
  code: (typeof PREFERRED_LANGUAGES)[number];
  label: string;
};

/** DE and EN first; remaining codes A–Z by locale display label. */
export function getPreferredLanguageOptions(locale: Locale): PreferredLanguageOption[] {
  const pinned = PREFERRED_LANGUAGES.filter((code) => code === "DE" || code === "EN").map(
    (code) => ({
      code,
      label: languageLabels[locale][code],
    }),
  );
  const rest = PREFERRED_LANGUAGES.filter((code) => code !== "DE" && code !== "EN")
    .map((code) => ({
      code,
      label: languageLabels[locale][code],
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: "base" }));
  return [...pinned, ...rest];
}

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
    Other: "Sonstiges",
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
    Other: "Other",
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
    "Friedrichshain-Kreuzberg": "Friedrichshain-Kreuzberg",
    Pankow: "Pankow",
    "Charlottenburg-Wilmersdorf": "Charlottenburg-Wilmersdorf",
    Spandau: "Spandau",
    "Steglitz-Zehlendorf": "Steglitz-Zehlendorf",
    "Tempelhof-Schöneberg": "Tempelhof-Schöneberg",
    Neukölln: "Neukölln",
    "Treptow-Köpenick": "Treptow-Köpenick",
    "Marzahn-Hellersdorf": "Marzahn-Hellersdorf",
    Lichtenberg: "Lichtenberg",
    Reinickendorf: "Reinickendorf",
  },
  en: {
    Mitte: "Mitte",
    "Friedrichshain-Kreuzberg": "Friedrichshain-Kreuzberg",
    Pankow: "Pankow",
    "Charlottenburg-Wilmersdorf": "Charlottenburg-Wilmersdorf",
    Spandau: "Spandau",
    "Steglitz-Zehlendorf": "Steglitz-Zehlendorf",
    "Tempelhof-Schöneberg": "Tempelhof-Schöneberg",
    Neukölln: "Neukölln",
    "Treptow-Köpenick": "Treptow-Köpenick",
    "Marzahn-Hellersdorf": "Marzahn-Hellersdorf",
    Lichtenberg: "Lichtenberg",
    Reinickendorf: "Reinickendorf",
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
        description: shared.districtSubtitle,
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

export { AGE_GROUPS, DISTRICTS, INTERESTS, MOODS, PREFERRED_LANGUAGES, TIMING_OPTIONS, WEEKDAYS };
