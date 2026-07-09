export const VARIANT_FILENAMES = [
  "original.jpg",
  "hero-1920.jpg",
  "large-1280.jpg",
  "medium-640.jpg",
  "small-320.jpg",
  "og-1200x630.jpg",
] as const;

export type VariantFilename = (typeof VARIANT_FILENAMES)[number];

export const ORIGINAL_MAX_EDGE = 3840;
export const ORIGINAL_QUALITY = 90;
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

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MIN_IMAGE_WIDTH = 800;
export const MIN_IMAGE_HEIGHT = 420;

export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export const REMOTE_FETCH_TIMEOUT_MS = 15_000;
