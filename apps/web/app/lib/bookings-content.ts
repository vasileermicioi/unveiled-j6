import type { Locale } from "./locale";

export type MyTicketsCopy = {
  title: string;
  empty: string;
  browseEvents: string;
  viewTicket: string;
  paginationShowing: (from: number, to: number, total: number) => string;
  paginationPrevious: string;
  paginationNext: string;
  statusConfirmed: string;
  statusCancelled: string;
  statusUsed: string;
  statusWaitlist: string;
};

const copyByLocale: Record<Locale, MyTicketsCopy> = {
  de: {
    title: "Meine Tickets",
    empty: "Du hast noch keine Tickets.",
    browseEvents: "Events entdecken",
    viewTicket: "Ticket ansehen",
    paginationShowing: (from, to, total) => `Zeige ${from}–${to} von ${total}`,
    paginationPrevious: "Zurück",
    paginationNext: "Weiter",
    statusConfirmed: "Bestätigt",
    statusCancelled: "Storniert",
    statusUsed: "Eingelöst",
    statusWaitlist: "Warteliste",
  },
  en: {
    title: "My Tickets",
    empty: "You have no tickets yet.",
    browseEvents: "Browse events",
    viewTicket: "View ticket",
    paginationShowing: (from, to, total) => `Showing ${from}–${to} of ${total}`,
    paginationPrevious: "Previous",
    paginationNext: "Next",
    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    statusUsed: "Used",
    statusWaitlist: "Waitlist",
  },
};

export function getMyTicketsCopy(locale: Locale): MyTicketsCopy {
  return copyByLocale[locale];
}
