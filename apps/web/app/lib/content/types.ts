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

export type LandingPerk = {
  highlight: string;
  title: string;
  body: string;
  highlightPlacement: "start" | "end";
};

export type LandingEventTeaser = {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  time: string;
  place: string;
  credits: string;
  locked: boolean;
};

export type LandingCreditExample = {
  name: string;
  credits: string;
  icon: "community" | "theater" | "exhibition";
};

export type LandingVenueCard = {
  name: string;
  type: string;
  fromCredits: string;
};

export type LandingComingSoonPartner = {
  name: string;
  href: string;
  logoSrc: string;
};

export type LandingContent = {
  hero: {
    tag: string;
    headline: string;
    lead: string;
    galleryAlt: string;
  };
  offer: {
    depositEyebrow: string;
    depositAmount: string;
    depositToday: string;
    depositSub: string;
    depositAfter: string;
    basePerk: LandingPerk;
    perkGroupLabel: string;
    foundingPerks: readonly [LandingPerk, LandingPerk];
    cta: string;
    cancel: string;
  };
  events: {
    eyebrow: string;
    headline: string;
    body: string;
    railHint: string;
    loginCta: string;
    loginShort: string;
    communityLabel: string;
    previousPhoto: string;
    nextPhoto: string;
    items: readonly LandingEventTeaser[];
  };
  credits: {
    eyebrow: string;
    headline: string;
    amount: string;
    period: string;
    body: string;
    exampleLabel: string;
    examples: readonly [LandingCreditExample, LandingCreditExample, LandingCreditExample];
    exampleNote: string;
    used: string;
    left: string;
    mix: string;
  };
  flexibility: {
    eyebrow: string;
    headline: string;
    body: string;
    venues: readonly [LandingVenueCard, LandingVenueCard];
    moreStrip: string;
    comingSoon: string;
    reassure: string;
    reassureMuted: string;
    partners: readonly LandingComingSoonPartner[];
  };
  community: {
    eyebrow: string;
    headline: string;
    proof: string;
    photoAlt: string;
  };
  finalCta: {
    headline: string;
    body: string;
    cta: string;
    cancel: string;
  };
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
  body: readonly string[];
};

export type LegalContent = {
  eyebrow: string;
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
