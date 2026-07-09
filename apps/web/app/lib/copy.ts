import type { Locale } from "./locale";

export type NavLinkCopy = {
  discover: string;
  howItWorks: string;
  membership: string;
  faq: string;
};

export type FooterCopy = {
  brandEyebrow: string;
  tagline: string;
  body: string;
  navigationEyebrow: string;
  legalEyebrow: string;
  contactEyebrow: string;
  location: string;
  nav: NavLinkCopy;
  legal: {
    impressum: string;
    privacy: string;
    terms: string;
  };
};

export type ShellCopy = {
  headerTagline: string;
  nav: NavLinkCopy;
  login: string;
  signup: string;
  logout: string;
  /** Inventory `mySaves` — USER navbar Saved link */
  mySaves: string;
  formatCredits: (credits: number) => string;
  homeCta: string;
  notFoundTitle: string;
  notFoundBody: string;
  footer: FooterCopy;
};

const copy: Record<Locale, ShellCopy> = {
  de: {
    headerTagline: "Kuratierter Kulturzugang in Berlin",
    nav: {
      discover: "Entdecken",
      howItWorks: "So funktioniert's",
      membership: "Mitgliedschaft",
      faq: "FAQ",
    },
    login: "Anmelden",
    signup: "Registrieren",
    logout: "Abmelden",
    mySaves: "Gemerkt",
    formatCredits: (credits) => `${credits} Credits`,
    homeCta: "Entdecken",
    notFoundTitle: "Seite nicht gefunden",
    notFoundBody: "Die angeforderte Seite existiert nicht.",
    footer: {
      brandEyebrow: "UNVEILED BERLIN",
      tagline: "KURATIERTER KULTURZUGANG IN BERLIN.",
      body: "ENTDECKE THEATER, KINO, AUSSTELLUNGEN UND BESONDERE ORTE IN BERLIN MIT EINER MITGLIEDSCHAFT.",
      navigationEyebrow: "NAVIGATION",
      legalEyebrow: "RECHTLICHES",
      contactEyebrow: "KONTAKT",
      location: "BERLIN, DEUTSCHLAND",
      nav: {
        discover: "ENTDECKEN",
        howItWorks: "SO FUNKTIONIERT'S",
        membership: "MITGLIEDSCHAFT",
        faq: "FAQ",
      },
      legal: {
        impressum: "IMPRESSUM",
        privacy: "DATENSCHUTZ",
        terms: "AGB",
      },
    },
  },
  en: {
    headerTagline: "Curated cultural access in Berlin",
    nav: {
      discover: "Discover",
      howItWorks: "How it works",
      membership: "Membership",
      faq: "FAQ",
    },
    login: "Log in",
    signup: "Sign up",
    logout: "Log out",
    mySaves: "Saved",
    formatCredits: (credits) => `${credits} credits`,
    homeCta: "Discover",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you requested does not exist.",
    footer: {
      brandEyebrow: "UNVEILED BERLIN",
      tagline: "CURATED CULTURAL ACCESS IN BERLIN.",
      body: "DISCOVER THEATRE, CINEMA, EXHIBITIONS, AND SPECIAL VENUES IN BERLIN WITH ONE MEMBERSHIP.",
      navigationEyebrow: "NAVIGATION",
      legalEyebrow: "LEGAL",
      contactEyebrow: "CONTACT",
      location: "BERLIN, GERMANY",
      nav: {
        discover: "DISCOVER",
        howItWorks: "HOW IT WORKS",
        membership: "MEMBERSHIP",
        faq: "FAQ",
      },
      legal: {
        impressum: "IMPRINT",
        privacy: "PRIVACY POLICY",
        terms: "TERMS OF SERVICE",
      },
    },
  },
};

export function getCopy(locale: Locale): ShellCopy {
  return copy[locale];
}

export type NavItemKey = keyof NavLinkCopy;

export const NAV_ITEMS: NavItemKey[] = ["discover", "howItWorks", "membership", "faq"];

export const NAV_SEGMENTS: Record<NavItemKey, string> = {
  discover: "",
  howItWorks: "how-it-works",
  membership: "membership",
  faq: "faq",
};
