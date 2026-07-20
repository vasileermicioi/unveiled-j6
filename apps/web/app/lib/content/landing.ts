import type { LandingContent, LocalizedContent } from "./types";

export const landingContent: LocalizedContent<LandingContent> = {
  de: {
    headline: "Eine Mitgliedschaft für die gesamte Kulturszene.",
    subheadline:
      "Monatliche Credits für den Zugang zu Berlins besten Kultureinrichtungen und exklusiven Community-Events.",
    phoneAlt: "Unveiled App auf dem Smartphone",
    plan: {
      priceAmount: "29€",
      pricePeriod: "pro Monat",
      perks: [
        "17 monatliche Credits",
        "Flexible Nutzung deiner Credits",
        "Exklusiver Community-Zugang",
        "Jederzeit kündbar",
      ],
      cta: "Registrier dich jetzt",
    },
    benefits: [
      {
        title: "Zeit sparen.",
        body: "Finde großartige Events in unter einer Minute.",
      },
      {
        title: "Geld sparen.",
        body: "Eine Mitgliedschaft statt einzelner Tickets.",
      },
      {
        title: "Leute treffen.",
        body: "Werde Teil einer Community, die wirklich ausgeht.",
      },
    ],
  },
  en: {
    headline: "One membership for the entire cultural scene.",
    subheadline:
      "Monthly credits for Berlin's best cultural venues and exclusive community events.",
    phoneAlt: "Unveiled app on a smartphone",
    plan: {
      priceAmount: "29€",
      pricePeriod: "per month",
      perks: [
        "17 monthly credits",
        "Flexible credit combinations",
        "Exclusive community access",
        "Cancel the subscription anytime",
      ],
      cta: "Register now",
    },
    benefits: [
      {
        title: "Save time.",
        body: "Find great events in under a minute.",
      },
      {
        title: "Save money.",
        body: "One membership instead of individual tickets.",
      },
      {
        title: "Meet people.",
        body: "Join a community that actually goes out.",
      },
    ],
  },
};
