export function getSiteUrl(): string {
  const raw = process.env.SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, `${getSiteUrl()}/`).href;
}
