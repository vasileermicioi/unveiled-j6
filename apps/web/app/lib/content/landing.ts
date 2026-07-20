import type { LandingContent, LocalizedContent } from "./types";

export const landingContent: LocalizedContent<LandingContent> = {
  de: {
    headline: "Eine Mitgliedschaft für die gesamte Kulturszene.",
    subheadline: "Monatliche Credits für Berlins beste Kulturorte und exklusive Community-Events.",
    phoneAlt: "Unveiled App auf dem Smartphone",
    plan: {
      price: "29€ pro Monat",
      perks: [
        "17 monatliche Credits",
        "Flexible Credit-Kombinationen",
        "Exklusiver Community-Zugang",
        "Abo jederzeit kündbar",
      ],
      cta: "Registrier dich jetzt",
    },
    benefits: [
      {
        title: "Zeit sparen.",
        body: "Finde große Events in unter einer Minute.",
      },
      {
        title: "Geld sparen.",
        body: "Eine Mitgliedschaft statt einzelner Tickets.",
      },
      {
        title: "Leute treffen.",
        body: "Schließ dich einer Community an, die wirklich rausgeht.",
      },
    ],
  },
  en: {
    headline: "One membership for the entire cultural scene.",
    subheadline:
      "Monthly credits for Berlin's best cultural venues and exclusive community events.",
    phoneAlt: "Unveiled app on a smartphone",
    plan: {
      price: "29€ per month",
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
