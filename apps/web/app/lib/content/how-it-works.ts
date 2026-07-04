import type { HowItWorksContent, LocalizedContent } from "./types";

export const howItWorksContent: LocalizedContent<HowItWorksContent> = {
  de: {
    hero: {
      eyebrow: "How Unveiled works",
      headline: "Erst verstehen, dann entscheiden.",
      subheadline:
        "Unveiled verbindet Mitgliedschaft, kuratierte Event-Auswahl und unkomplizierte Buchung in einem klaren Flow.",
    },
    steps: [
      {
        title: "1. Auswahl ansehen",
        body: "Du siehst vorab, welche Events und Kulturhäuser aktuell im Abo enthalten sind.",
      },
      {
        title: "2. Mitglied werden",
        body: "Mit der Mitgliedschaft bekommst du Zugang zu kuratierten Kulturangeboten in Berlin.",
      },
      {
        title: "3. Event buchen",
        body: "Sobald du ein Event buchen willst, nutzt du deine Credits und erhältst direkt alle Einlassdetails.",
      },
    ],
    whyItWorks: {
      eyebrow: "Warum das funktioniert",
      points: [
        "Kuratiert statt beliebig",
        "Live synchronisierte Event-Auswahl",
        "Transparenz vor dem Paywall-Moment",
      ],
    },
  },
  en: {
    hero: {
      eyebrow: "How Unveiled works",
      headline: "Understand the value before you commit.",
      subheadline:
        "Unveiled combines membership, a curated event selection, and simple booking in one clear flow.",
    },
    steps: [
      {
        title: "1. Browse the selection",
        body: "See which events and venues are currently included before making any commitment.",
      },
      {
        title: "2. Become a member",
        body: "Membership gives you access to curated cultural experiences across Berlin.",
      },
      {
        title: "3. Book an event",
        body: "Once you want to attend, you use your credits and receive the entry details right away.",
      },
    ],
    whyItWorks: {
      eyebrow: "Why this works",
      points: [
        "Curated instead of random",
        "Live synced event selection",
        "Transparency before the paywall moment",
      ],
    },
  },
};
