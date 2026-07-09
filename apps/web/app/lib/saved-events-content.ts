import type { Locale } from "./locale";

export type SavedEventsCopy = {
  title: string;
  empty: string;
  browseEvents: string;
};

const copyByLocale: Record<Locale, SavedEventsCopy> = {
  de: {
    title: "Gemerkt",
    empty: "Du hast noch keine kommenden Events gemerkt.",
    browseEvents: "Events entdecken",
  },
  en: {
    title: "Saved",
    empty: "You have no upcoming saved events yet.",
    browseEvents: "Browse events",
  },
};

export function getSavedEventsCopy(locale: Locale): SavedEventsCopy {
  return copyByLocale[locale];
}
