import type { Locale } from "./locale";
import { LOCALES, switchLocalePath } from "./locale";
import { absoluteUrl } from "./site-config";

const SITE_NAME = "Unveiled Berlin";

export type PageMetaInput = {
  locale: Locale;
  pathname: string;
  title: string;
  description: string;
  ogImage?: string;
};

export type PageMeta = {
  documentTitle: string;
  description: string;
  canonical: string;
  alternates: Array<{ hreflang: string; href: string }>;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
};

export function buildPageMeta(input: PageMetaInput): PageMeta {
  const { pathname, title, description, ogImage } = input;
  const documentTitle = `${title} — ${SITE_NAME}`;
  const canonical = absoluteUrl(pathname);

  const alternates = [
    ...LOCALES.map((loc) => ({
      hreflang: loc,
      href: absoluteUrl(switchLocalePath(pathname, loc)),
    })),
    {
      hreflang: "x-default",
      href: absoluteUrl(switchLocalePath(pathname, "de")),
    },
  ];

  const openGraph: Record<string, string> = {
    "og:title": documentTitle,
    "og:description": description,
    "og:type": "website",
    "og:url": canonical,
  };

  const twitter: Record<string, string> = {
    "twitter:card": "summary_large_image",
    "twitter:title": documentTitle,
    "twitter:description": description,
  };

  if (ogImage) {
    openGraph["og:image"] = ogImage;
    twitter["twitter:image"] = ogImage;
  }

  return {
    documentTitle,
    description,
    canonical,
    alternates,
    openGraph,
    twitter,
  };
}
