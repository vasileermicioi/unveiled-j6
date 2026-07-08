import type { Event } from "@unveiled/db";
import { buildVariantUrl } from "@unveiled/images/urls";

import type {
  DiscoverContent,
  FaqContent,
  FaqItem,
  HowItWorksContent,
  LandingContent,
  LegalContent,
  MembershipCheckoutContent,
} from "./content/types";
import type { Locale } from "./locale";
import { LOCALES, localizedPath, switchLocalePath } from "./locale";
import { absoluteUrl, getDefaultOgImage } from "./site-config";

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

  const resolvedOgImage = ogImage ?? getDefaultOgImage();
  openGraph["og:image"] = resolvedOgImage;
  twitter["twitter:image"] = resolvedOgImage;

  return {
    documentTitle,
    description,
    canonical,
    alternates,
    openGraph,
    twitter,
  };
}

export function landingPageMeta(content: LandingContent) {
  return {
    title: content.headline,
    description: content.subheadline,
  };
}

export function howItWorksPageMeta(content: HowItWorksContent, pageTitle: string) {
  return {
    title: pageTitle,
    description: content.hero.subheadline,
  };
}

export function faqPageMeta(content: FaqContent) {
  return {
    title: content.hero.headline,
    description: content.hero.subheadline,
  };
}

export function membershipPageMeta(content: MembershipCheckoutContent, pageTitle: string) {
  return {
    title: pageTitle,
    description: content.subtitle,
  };
}

export function discoverPageMeta(content: DiscoverContent, pageTitle: string) {
  return {
    title: pageTitle,
    description: content.hero.subheadline,
  };
}

function truncateDescription(text: string, maxLength = 160): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function eventDetailPageMeta(
  event: Event,
  referenceDate: Date = new Date(),
): {
  title: string;
  description: string;
  ogImage?: string;
  robots?: string;
} {
  const title = `${event.title} at ${event.partnerName}`;
  const description = truncateDescription(event.description);
  let ogImage: string | undefined;

  try {
    ogImage = buildVariantUrl(event.imageId, "og-1200x630.webp");
  } catch {
    ogImage = undefined;
  }

  const bookable = event.remainingCapacity > 0 && event.dateTime > referenceDate;

  return {
    title,
    description,
    ogImage,
    robots: bookable ? undefined : "noindex, follow",
  };
}

export type EventJsonLd = {
  "@context": "https://schema.org";
  "@type": "Event";
  name: string;
  startDate: string;
  description: string;
  image: string;
  location: {
    "@type": "Place";
    name: string;
    address: string;
  };
  organizer: {
    "@type": "Organization";
    name: string;
  };
};

export function buildEventJsonLd(event: Event): EventJsonLd {
  let image = "";
  try {
    image = buildVariantUrl(event.imageId, "hero-1920.webp");
  } catch {
    image = getDefaultOgImage();
  }

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.dateTime.toISOString(),
    description: event.description,
    image,
    location: {
      "@type": "Place",
      name: event.partnerName,
      address: event.address,
    },
    organizer: {
      "@type": "Organization",
      name: event.partnerName,
    },
  };
}

export function legalPageMeta(content: LegalContent) {
  return {
    title: content.pageTitle,
    description: content.intro,
  };
}

export type FaqPageJsonLd = {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
};

export function buildFaqPageJsonLd(items: readonly FaqItem[]): FaqPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export type OrganizationJsonLd = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  email: string;
  address: {
    "@type": "PostalAddress";
    addressLocality: string;
    addressCountry: string;
  };
};

export function buildOrganizationJsonLd(locale: Locale): OrganizationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Unveiled Berlin",
    url: absoluteUrl(localizedPath(locale, "")),
    email: "support@unveiled.berlin",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Berlin",
      addressCountry: "DE",
    },
  };
}
