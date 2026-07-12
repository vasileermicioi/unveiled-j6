import type { Locale } from "../locale";

export type PageKey =
  | "landing"
  | "how-it-works"
  | "faq"
  | "discover"
  | "membership"
  | "impressum"
  | "privacy"
  | "terms";

export type LocalizedContent<T> = Record<Locale, T>;

export type LandingContent = {
  headline: string;
  subheadline: string;
  ctaDiscover: string;
  ctaHowItWorks: string;
  trustMicrocopy: string;
  conversionCard: {
    loginCta: string;
    signupCta: string;
  };
  trustBadges: readonly [string, string, string];
};

export type ValuePropCard = {
  title: string;
  body: string;
};

export type DiscoverHeroContent = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaMembership: string;
  ctaBrowseEvents: string;
  stats: {
    liveFeed: { label: string; suffix: string };
    partnerVenues: { label: string; suffix: string };
    membership: { label: string; body: string };
  };
};

export type DiscoverContent = {
  hero: DiscoverHeroContent;
  valueProps: ValuePropCard[];
  livePreview: {
    eyebrow: string;
    headline: string;
    emptyState: string;
  };
  categories: {
    eyebrow: string;
    headline: string;
    subtext: string;
    items: string[];
    callout: {
      title: string;
      body: string;
      cta: string;
      email: string;
    };
  };
  partners: {
    eyebrow: string;
  };
};

export type HowItWorksStep = {
  title: string;
  body: string;
};

export type HowItWorksContent = {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
  };
  steps: HowItWorksStep[];
  whyItWorks: {
    eyebrow: string;
    points: string[];
  };
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqContent = {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
  };
  section: {
    eyebrow: string;
    headline: string;
    supportEmail: string;
    items: FaqItem[];
  };
};

export type MembershipCheckoutContent = {
  title: string;
  subtitle: string;
  button: string;
  secure: string;
  perks: readonly [string, string, string];
  guarantee: string;
  successTitle: string;
  successSubtitle: string;
  errorTitle: string;
  errorSubtitle: string;
  promoCodeLabel: string;
  promoCodePlaceholder: string;
  alreadyActive: string;
  activeStatus: string;
  paymentStoppedTitle: string;
  paymentStoppedBody: string;
  supportEmail: string;
  supportCta: string;
  loginCta: string;
  signupCta: string;
  guestPrompt: string;
  checkoutError: string;
};

export type LegalSection = {
  id: string;
  title: string;
  placeholder: string;
};

export type LegalContent = {
  pageTitle: string;
  intro: string;
  sections: LegalSection[];
};

export type PageContentMap = {
  landing: LandingContent;
  "how-it-works": HowItWorksContent;
  faq: FaqContent;
  discover: DiscoverContent;
  membership: MembershipCheckoutContent;
  impressum: LegalContent;
  privacy: LegalContent;
  terms: LegalContent;
};
