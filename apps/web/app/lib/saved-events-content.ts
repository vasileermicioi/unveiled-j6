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
    empty: "Du hast noch keine kommenden Erlebnisse gemerkt.",
    browseEvents: "Erlebnisse entdecken",
  },
  en: {
    eyebrow: "Your list",
    title: "Saved",
    empty: "You have no upcoming saved experiences yet.",
    browseEvents: "Explore experiences",
  },
};

export function getSavedEventsCopy(locale: Locale): SavedEventsCopy {
  return copyByLocale[locale];
}
