import type { Locale } from "./locale";

/** Serializable island copy only — no functions (HonoX JSON props). */
export type EventDetailGalleryCopy = {
  sectionTitle: string;
  previousLabel: string;
  nextLabel: string;
  closeLabel: string;
  /** Prefix for “Photo N” / “Foto N” alt text. */
  photoAltPrefix: string;
};

export function getEventDetailGalleryCopy(locale: Locale): EventDetailGalleryCopy {
  if (locale === "de") {
    return {
      sectionTitle: "Galerie",
      previousLabel: "Zurück",
      nextLabel: "Weiter",
      closeLabel: "Zum Schließen Esc drücken oder außerhalb klicken",
      photoAltPrefix: "Foto",
    };
  }

  return {
    sectionTitle: "Gallery",
    previousLabel: "Prev",
    nextLabel: "Next",
    closeLabel: "Press Escape or click outside to close",
    photoAltPrefix: "Photo",
  };
}

export function galleryPhotoAlt(copy: EventDetailGalleryCopy, index: number): string {
  return `${copy.photoAltPrefix} ${index}`;
}
