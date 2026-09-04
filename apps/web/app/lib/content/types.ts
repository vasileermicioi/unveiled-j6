import type { Locale } from "../locale";

export type PageKey =
  | "landing"
  | "landing-v3"
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

export type LandingComingSoonPartner = {
  name: string;
  href: string;
  logoSrc: string;
};

/**
 * Guest-safe live teaser for the v3 landing rail (step 01).
 * Deliberately narrow: no credit prices, capacity, redemption, or event-detail URLs.
 */
export type LandingLiveTeaser = {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  time: string;
  place: string;
  image?: string;
};

export type LandingV3Hero = {
  tag: string;
  headlineA: string;
  headlineB: string;
  lead: string;
  galleryAlt: string;
};

export type LandingV3EventsCopy = {
  eyebrow: string;
  headline: string;
  body: string;
  loginCta: string;
  loginShort: string;
  communityLabel: string;
  previousPhoto: string;
  nextPhoto: string;
};

export type LandingV3Credits = {
  eyebrow: string;
  headlineA: string;
  headlineB: string;
  body: string;
  goTogetherTitle: string;
  goTogetherBody: string;
  ownPlansTitle: string;
  ownPlansBody: string;
  partnersEyebrow: string;
  partnersSub: string;
  partnersNote: string;
  partners: readonly LandingComingSoonPartner[];
};

export type LandingV3Community = {
  eyebrow: string;
  headline: string;
  proof: string;
  photoAlt: string;
};

export type LandingV3FinalCta = {
  headline: string;
  body: string;
  cta: string;
  cancel: string;
};

export type LandingV3Content = {
  hero: LandingV3Hero;
  offer: LandingRegularOffer;
  events: LandingV3EventsCopy;
  credits: LandingV3Credits;
  community: LandingV3Community;
  finalCta: LandingV3FinalCta;
};

type LandingOfferBase = {
  basePerk: LandingPerk;
  perkGroupLabel: string;
  foundingPerks: readonly [LandingPerk, LandingPerk];
  cta: string;
  cancel: string;
};

export type LandingRegularOffer = LandingOfferBase & {
  kind: "regular";
  price: string;
  period: string;
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
  landing: LandingV3Content;
  "landing-v3": LandingV3Content;
  "how-it-works": HowItWorksContent;
  faq: FaqContent;
  discover: DiscoverContent;
  membership: MembershipCheckoutContent;
  impressum: LegalContent;
  privacy: LegalContent;
  terms: LegalContent;
};
