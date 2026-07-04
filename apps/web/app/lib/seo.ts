import type {
  FaqContent,
  FaqItem,
  HowItWorksContent,
  LandingContent,
  MembershipCheckoutContent,
} from "./content/types";
import type { Locale } from "./locale";
import { LOCALES, localizedPath, switchLocalePath } from "./locale";
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
