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

export type DrawerSectionCopy = {
  navigation: string;
  language: string;
  account: string;
};

export type ShellCopy = {
  nav: NavLinkCopy;
  /**
   * Primary marketing nav for booking-eligible USERs (→ `/events`).
   * Matches saved/bookings `browseEvents` phrasing.
   */
  browseEvents: string;
  login: string;
  signup: string;
  logout: string;
  /** Inventory `mySaves` — USER navbar Saved link */
  mySaves: string;
  /** Inventory `myBookings` — USER navbar My Tickets link */
  myBookings: string;
  /** App-shell Profile link — USER → /profile */
  profile: string;
  formatCredits: (credits: number) => string;
  homeCta: string;
  notFoundTitle: string;
  notFoundBody: string;
  /** Mobile drawer section labels */
  drawer: DrawerSectionCopy;
  footer: FooterCopy;
};

const copy: Record<Locale, ShellCopy> = {
  de: {
    nav: {
      discover: "Entdecken",
      howItWorks: "So funktioniert's",
      membership: "Mitgliedschaft",
      faq: "Häufig gestellte Fragen",
    },
    browseEvents: "Events entdecken",
    login: "Anmelden",
    signup: "Registrieren",
    logout: "Abmelden",
    mySaves: "Gemerkt",
    myBookings: "Meine Tickets",
    profile: "Konto",
    formatCredits: (credits) => `${credits} Credits`,
    homeCta: "Entdecken",
    notFoundTitle: "Seite nicht gefunden",
    notFoundBody: "Die angeforderte Seite existiert nicht.",
    drawer: {
      navigation: "Navigation",
      language: "Sprache",
      account: "Konto",
    },
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
        faq: "HÄUFIG GESTELLTE FRAGEN",
      },
      legal: {
        impressum: "IMPRESSUM",
        privacy: "DATENSCHUTZ",
        terms: "AGB",
      },
    },
  },
  en: {
    nav: {
      discover: "Discover",
      howItWorks: "How it works",
      membership: "Membership",
      faq: "FAQ",
    },
    browseEvents: "Browse events",
    login: "Log in",
    signup: "Sign up",
    logout: "Log out",
    mySaves: "Saved",
    myBookings: "My Tickets",
    profile: "Account",
    formatCredits: (credits) => `${credits} credits`,
    homeCta: "Discover",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you requested does not exist.",
    drawer: {
      navigation: "Navigation",
      language: "Language",
      account: "Account",
    },
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

/** Sticky header + drawer marketing nav (slim IA). Footer keeps the full set via `footer.nav`. */
export const NAV_ITEMS: NavItemKey[] = ["discover", "faq"];

export const NAV_SEGMENTS: Record<NavItemKey, string> = {
  discover: "discover",
  howItWorks: "how-it-works",
  membership: "membership",
  faq: "faq",
};
