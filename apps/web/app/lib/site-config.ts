export const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export function getSiteUrl(): string {
  const raw = process.env.SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, `${getSiteUrl()}/`).href;
}

export function getDefaultOgImage(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}
