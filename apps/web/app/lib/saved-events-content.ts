import type { Locale } from "./locale";

export type SavedEventsCopy = {
  eyebrow: string;
  title: string;
  empty: string;
  browseEvents: string;
};

const copyByLocale: Record<Locale, SavedEventsCopy> = {
  de: {
    eyebrow: "Merkliste",
    title: "Gemerkt",
    empty: "Du hast noch keine kommenden Events gemerkt.",
    browseEvents: "Events entdecken",
  },
  en: {
    eyebrow: "Your list",
    title: "Saved",
    empty: "You have no upcoming saved events yet.",
    browseEvents: "Browse events",
  },
};

export function getSavedEventsCopy(locale: Locale): SavedEventsCopy {
  return copyByLocale[locale];
}
