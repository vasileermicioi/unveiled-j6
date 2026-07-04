import type { FaqContent, LocalizedContent } from "./types";

export const faqContent: LocalizedContent<FaqContent> = {
  de: {
    hero: {
      eyebrow: "Support",
      headline: "FAQ",
      subheadline: "Alles Wichtige zu Mitgliedschaft, Buchung und Check-in an einem Ort.",
    },
    section: {
      eyebrow: "FAQ & SUPPORT",
      headline: "Häufige Fragen.",
      supportEmail: "support@unveiled.berlin",
      items: [
        {
          question: "Wie buche ich ein Event?",
          answer:
            "Öffne ein Event, wähle die Anzahl der Tickets und bestätige die Buchung mit deinen Credits. Danach findest du alle Details direkt unter Meine Tickets.",
        },
        {
          question: "Was passiert nach der Buchung?",
          answer:
            "Je nach Event bekommst du entweder einen Einlasscode oder einen Promo-Code mit Link zur externen Ticketseite. Vor Ort scannst du zusätzlich den Venue-QR, damit dein Besuch registriert wird.",
        },
        {
          question: "Was mache ich, wenn etwas nicht funktioniert?",
          answer:
            "Schreib uns an support@unveiled.berlin. Am besten mit Eventname, Uhrzeit und einem Screenshot, damit wir dir schnell helfen können.",
        },
      ],
    },
    backButton: "Zurück",
  },
  en: {
    hero: {
      eyebrow: "Support",
      headline: "FAQ",
      subheadline: "Everything important about membership, booking, and check-in in one place.",
    },
    section: {
      eyebrow: "FAQ & SUPPORT",
      headline: "Everything you need to know.",
      supportEmail: "support@unveiled.berlin",
      items: [
        {
          question: "How does booking work?",
          answer:
            "Open an event, choose the number of tickets, and confirm the booking with your credits. All details, codes, or vouchers will then appear in My Tickets.",
        },
        {
          question: "What do I receive after booking?",
          answer:
            "Depending on the event, you will receive either an entry code or a voucher or promo code with a link to the external ticket page. On site, you also scan the venue QR so your attendance is checked in correctly.",
        },
        {
          question: "What if something is not working?",
          answer:
            "Email us at support@unveiled.berlin. The fastest way for us to help is if you include the event name, time, and a screenshot.",
        },
      ],
    },
    backButton: "Back",
  },
};
