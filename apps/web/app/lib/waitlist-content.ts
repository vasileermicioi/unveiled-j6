import type { Locale } from "./locale";

export type WaitlistJoinCopy = {
  eyebrow: string;
  title: string;
  subtitle: (eventTitle: string) => string;
  ticketsLabel: string;
  submit: string;
  backToEvent: string;
  confirmEyebrow: string;
  confirmTitle: string;
  confirmCreated: string;
  confirmExisting: string;
  statusLabel: string;
  positionLabel: (position: number) => string;
  qtyLabel: (qty: number) => string;
  cancelLink: string;
  errorGeneric: string;
  errorInvalidQty: string;
};

export type WaitlistCancelCopy = {
  eyebrow: string;
  title: string;
  subtitle: (eventTitle: string) => string;
  confirmBody: string;
  submit: string;
  back: string;
  successEyebrow: string;
  successTitle: string;
  successBody: string;
  errorGeneric: string;
  errorForbidden: string;
  errorNotWaiting: string;
  notFoundTitle: string;
};

const joinCopy: Record<Locale, WaitlistJoinCopy> = {
  de: {
    eyebrow: "Buchungen",
    title: "Warteliste",
    subtitle: (eventTitle) => `Auf die Warteliste für ${eventTitle}`,
    ticketsLabel: "Gewünschte Tickets",
    submit: "Warteliste beitreten",
    backToEvent: "Zurück zum Event",
    confirmEyebrow: "Buchungen",
    confirmTitle: "Du bist auf der Warteliste",
    confirmCreated:
      "Dein Eintrag wurde erstellt. Wir benachrichtigen dich, wenn ein Platz frei wird.",
    confirmExisting: "Du bist bereits auf der Warteliste für dieses Event.",
    statusLabel: "Status: WAITING",
    positionLabel: (position) => `Position: ${position}`,
    qtyLabel: (qty) => `${qty} Ticket${qty === 1 ? "" : "s"} angefragt`,
    cancelLink: "Wartelisten-Eintrag stornieren",
    errorGeneric: "Warteliste fehlgeschlagen. Bitte erneut versuchen.",
    errorInvalidQty: "Bitte 1–3 Tickets wählen.",
  },
  en: {
    eyebrow: "Bookings",
    title: "Waitlist",
    subtitle: (eventTitle) => `Join the waitlist for ${eventTitle}`,
    ticketsLabel: "Requested tickets",
    submit: "Join waitlist",
    backToEvent: "Back to event",
    confirmEyebrow: "Bookings",
    confirmTitle: "You are on the waitlist",
    confirmCreated: "Your entry was created. We will notify you if a spot opens up.",
    confirmExisting: "You are already on the waitlist for this event.",
    statusLabel: "Status: WAITING",
    positionLabel: (position) => `Position: ${position}`,
    qtyLabel: (qty) => `${qty} ticket${qty === 1 ? "" : "s"} requested`,
    cancelLink: "Cancel waitlist entry",
    errorGeneric: "Waitlist join failed. Please try again.",
    errorInvalidQty: "Please choose 1–3 tickets.",
  },
};

const cancelCopy: Record<Locale, WaitlistCancelCopy> = {
  de: {
    eyebrow: "Buchungen",
    title: "Warteliste stornieren",
    subtitle: (eventTitle) => `Wartelisten-Eintrag für ${eventTitle} stornieren`,
    confirmBody: "Möchtest du deinen Wartelisten-Eintrag wirklich stornieren?",
    submit: "Stornieren bestätigen",
    back: "Abbrechen",
    successEyebrow: "Buchungen",
    successTitle: "Eintrag storniert",
    successBody: "Dein Wartelisten-Eintrag wurde storniert.",
    errorGeneric: "Stornierung fehlgeschlagen. Bitte erneut versuchen.",
    errorForbidden: "Du kannst nur deinen eigenen Eintrag stornieren.",
    errorNotWaiting: "Dieser Eintrag kann nicht mehr storniert werden.",
    notFoundTitle: "Eintrag nicht gefunden",
  },
  en: {
    eyebrow: "Bookings",
    title: "Cancel waitlist",
    subtitle: (eventTitle) => `Cancel your waitlist entry for ${eventTitle}`,
    confirmBody: "Do you want to cancel your waitlist entry?",
    submit: "Confirm cancel",
    back: "Keep entry",
    successEyebrow: "Bookings",
    successTitle: "Entry cancelled",
    successBody: "Your waitlist entry has been cancelled.",
    errorGeneric: "Cancel failed. Please try again.",
    errorForbidden: "You can only cancel your own entry.",
    errorNotWaiting: "This entry can no longer be cancelled.",
    notFoundTitle: "Entry not found",
  },
};

export function getWaitlistJoinCopy(locale: Locale): WaitlistJoinCopy {
  return joinCopy[locale];
}

export function getWaitlistCancelCopy(locale: Locale): WaitlistCancelCopy {
  return cancelCopy[locale];
}
