import type { Locale } from "./locale";

export type BookPageCopy = {
  title: string;
  subtitle: (eventTitle: string) => string;
  ticketsLabel: string;
  policy: string;
  submit: string;
  creditCost: (total: number) => string;
  backToEvent: string;
  pastDueTitle: string;
  pastDueBody: string;
  membershipCta: string;
  errorInsufficientCredits: string;
  errorSoldOut: string;
  errorPastDue: string;
  errorGeneric: string;
  waitlistCta: string;
  support: string;
};

export type BookConfirmCopy = {
  title: string;
  subtitle: string;
  ticketCodeLabel: string;
  voucherLabel: string;
  secretDesc: string;
  copy: string;
  copied: string;
  downloadIcs: string;
  supportLabel: string;
  supportEmail: string;
  ticketsLabel: (count: number) => string;
  backToEvent: string;
  openVoucher: string;
};

const bookCopy: Record<Locale, BookPageCopy> = {
  de: {
    title: "Event buchen",
    subtitle: (eventTitle) => `Reserviere Tickets für ${eventTitle}`,
    ticketsLabel: "Anzahl Tickets",
    policy: "SICHERE RSVP // KEINE ERSTATTUNG",
    submit: "Buchung bestätigen",
    creditCost: (total) => `${total} Credit${total === 1 ? "" : "s"}`,
    backToEvent: "Zurück zum Event",
    pastDueTitle: "Credits eingefroren",
    pastDueBody:
      "Dein Abo ist zahlungsgestört. Aktualisiere deine Zahlungsmethode, bevor du wieder buchen kannst.",
    membershipCta: "Zur Mitgliedschaft",
    errorInsufficientCredits: "Nicht genug Credits für diese Buchung.",
    errorSoldOut: "Nicht genug Restplätze für diese Buchung.",
    errorPastDue: "Credits sind eingefroren — bitte Zahlung aktualisieren.",
    errorGeneric: "Buchung fehlgeschlagen. Bitte erneut versuchen.",
    waitlistCta: "Auf die Warteliste",
    support: "support@unveiled.berlin",
  },
  en: {
    title: "Book event",
    subtitle: (eventTitle) => `Reserve tickets for ${eventTitle}`,
    ticketsLabel: "Ticket count",
    policy: "SECURE RSVP // NO REFUNDS",
    submit: "Confirm booking",
    creditCost: (total) => `${total} credit${total === 1 ? "" : "s"}`,
    backToEvent: "Back to event",
    pastDueTitle: "Credits frozen",
    pastDueBody: "Your subscription is past due. Update your payment method before booking again.",
    membershipCta: "Go to membership",
    errorInsufficientCredits: "Not enough credits for this booking.",
    errorSoldOut: "Not enough remaining capacity for this booking.",
    errorPastDue: "Credits are frozen — update your payment method.",
    errorGeneric: "Booking failed. Please try again.",
    waitlistCta: "Join waitlist",
    support: "support@unveiled.berlin",
  },
};

const confirmCopy: Record<Locale, BookConfirmCopy> = {
  de: {
    title: "Buchung bestätigt",
    subtitle: "Dein Ticket ist bereit.",
    ticketCodeLabel: "DEIN TICKET-CODE",
    voucherLabel: "GUTSCHEIN / RABATTCODE",
    secretDesc: "Sag diesen Code einfach an der Abendkasse oder beim Einlass.",
    copy: "Code kopieren",
    copied: "Kopiert",
    downloadIcs: "Kalender (.ics) herunterladen",
    supportLabel: "Hilfe",
    supportEmail: "support@unveiled.berlin",
    ticketsLabel: (count) => `${count} Ticket${count === 1 ? "" : "s"}`,
    backToEvent: "Zurück zum Event",
    openVoucher: "Zur Partner-Website",
  },
  en: {
    title: "Booking confirmed",
    subtitle: "Your ticket is ready.",
    ticketCodeLabel: "YOUR TICKET CODE",
    voucherLabel: "VOUCHER / PROMO CODE",
    secretDesc: "Just mention this code at the box office or entry.",
    copy: "Copy code",
    copied: "Copied",
    downloadIcs: "Download calendar (.ics)",
    supportLabel: "Support",
    supportEmail: "support@unveiled.berlin",
    ticketsLabel: (count) => `${count} ticket${count === 1 ? "" : "s"}`,
    backToEvent: "Back to event",
    openVoucher: "Open partner website",
  },
};

export function getBookPageCopy(locale: Locale): BookPageCopy {
  return bookCopy[locale];
}

export function getBookConfirmCopy(locale: Locale): BookConfirmCopy {
  return confirmCopy[locale];
}
