import type { Locale } from "./locale";

export type EventDetailGalleryCopy = {
  sectionTitle: string;
  previousLabel: string;
  nextLabel: string;
  closeLabel: string;
  photoAlt: (index: number) => string;
};

export function getEventDetailGalleryCopy(locale: Locale): EventDetailGalleryCopy {
  if (locale === "de") {
    return {
      sectionTitle: "Galerie",
      previousLabel: "Vorheriges Foto",
      nextLabel: "Nächstes Foto",
      closeLabel: "Galerie schließen",
      photoAlt: (index) => `Foto ${index}`,
    };
  }

  return {
    sectionTitle: "Gallery",
    previousLabel: "Previous photo",
    nextLabel: "Next photo",
    closeLabel: "Close gallery",
    photoAlt: (index) => `Photo ${index}`,
  };
}
