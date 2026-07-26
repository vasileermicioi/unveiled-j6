export const VARIANT_FILENAMES = [
  "hero-1920.webp",
  "large-1280.webp",
  "medium-640.webp",
  "small-320.webp",
  "og-1200x630.webp",
] as const;

export type VariantFilename = (typeof VARIANT_FILENAMES)[number];

/** Legacy JPEG filenames from the previous pipeline (migration / cleanup only). */
export const LEGACY_JPEG_VARIANT_FILENAMES = [
  "original.jpg",
  "hero-1920.jpg",
  "large-1280.jpg",
  "medium-640.jpg",
  "small-320.jpg",
  "og-1200x630.jpg",
] as const;

export const HERO_MAX_WIDTH = 1920;
export const HERO_QUALITY = 82;
export const LARGE_MAX_WIDTH = 1280;
export const LARGE_QUALITY = 80;
export const MEDIUM_MAX_WIDTH = 640;
export const MEDIUM_QUALITY = 78;
export const SMALL_MAX_WIDTH = 320;
export const SMALL_QUALITY = 75;
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_QUALITY = 85;

/**
 * Abuse/DoS ceiling for admin remote-URL proxy fetches only — not a product upload limit.
 * Documented in package README.
 */
export const REMOTE_FETCH_MAX_BYTES = 32 * 1024 * 1024;

export const REMOTE_FETCH_TIMEOUT_MS = 15_000;

/**
 * HTML `accept` for admin file inputs — any image the OS/browser can offer, plus `.svg`
 * (some pickers omit SVG from `image/*`).
 */
export const ACCEPTED_IMAGE_FILE_ACCEPT = "image/*,.svg";
