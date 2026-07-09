import { createRoute } from "honox/factory";

import { LOCALES, localizedPath } from "../lib/locale";
import { absoluteUrl } from "../lib/site-config";

const SITEMAP_STATIC_PATHS = [
  "",
  "how-it-works",
  "faq",
  "membership",
  "impressum",
  "privacy",
  "terms",
] as const;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildSitemapXml(): string {
  const urls = LOCALES.flatMap((locale) =>
    SITEMAP_STATIC_PATHS.map((segment) => absoluteUrl(localizedPath(locale, segment))),
  );

  const urlEntries = urls.map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
}

export default createRoute((c) => {
  return c.body(buildSitemapXml(), 200, {
    "Content-Type": "application/xml; charset=utf-8",
  });
});
