import type {
  BookingConfirmationBooking,
  BookingConfirmationContent,
  BookingConfirmationEvent,
  BookingLocale,
} from "./booking-confirmation";

export type BuildWaitlistPromotionInput = {
  locale: BookingLocale;
  toEmail: string;
  event: BookingConfirmationEvent;
  booking: BookingConfirmationBooking;
};

function formatEventWhen(dateTime: Date, locale: BookingLocale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(dateTime);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Waitlist promotion email — same redemption details as booking confirmation,
 * with subject/body that state the member was promoted from the waitlist.
 */
export function buildWaitlistPromotionContent(
  input: BuildWaitlistPromotionInput,
): BookingConfirmationContent {
  const { locale, event, booking } = input;
  const when = formatEventWhen(event.dateTime, locale);
  const code = booking.redemptionInfo?.trim() || "";
  const url = booking.redemptionUrl?.trim() || "";

  if (locale === "de") {
    const subject = `Warteliste → Ticket: ${event.title}`;
    const lines = [
      `Gute Nachrichten: du wurdest von der Warteliste für ${event.title} nachgerückt.`,
      `Deine Buchung ist bestätigt.`,
      `Partner: ${event.partnerName}`,
      `Wann: ${when}`,
      `Wo: ${event.address}`,
      `Tickets: ${booking.ticketsCount}`,
      code ? `Dein Ticket-Code: ${code}` : null,
      url ? `Link: ${url}` : null,
      "Sag den Code an der Abendkasse oder beim Einlass.",
      "Support: support@unveiled.berlin",
    ].filter(Boolean);

    return {
      subject,
      text: lines.join("\n"),
      html: `<p>Gute Nachrichten: du wurdest von der Warteliste für <strong>${escapeHtml(event.title)}</strong> nachgerückt.</p>
<p>Deine Buchung ist bestätigt.</p>
<p>Partner: ${escapeHtml(event.partnerName)}<br/>
Wann: ${escapeHtml(when)}<br/>
Wo: ${escapeHtml(event.address)}<br/>
Tickets: ${booking.ticketsCount}</p>
${code ? `<p><strong>Dein Ticket-Code:</strong> ${escapeHtml(code)}</p>` : ""}
${url ? `<p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>` : ""}
<p>Sag den Code an der Abendkasse oder beim Einlass.</p>
<p>Support: <a href="mailto:support@unveiled.berlin">support@unveiled.berlin</a></p>`,
    };
  }

  const subject = `Waitlist → ticket: ${event.title}`;
  const lines = [
    `Good news: you were promoted from the waitlist for ${event.title}.`,
    `Your booking is confirmed.`,
    `Partner: ${event.partnerName}`,
    `When: ${when}`,
    `Where: ${event.address}`,
    `Tickets: ${booking.ticketsCount}`,
    code ? `Your ticket code: ${code}` : null,
    url ? `Link: ${url}` : null,
    "Mention this code at the box office or entry.",
    "Support: support@unveiled.berlin",
  ].filter(Boolean);

  return {
    subject,
    text: lines.join("\n"),
    html: `<p>Good news: you were promoted from the waitlist for <strong>${escapeHtml(event.title)}</strong>.</p>
<p>Your booking is confirmed.</p>
<p>Partner: ${escapeHtml(event.partnerName)}<br/>
When: ${escapeHtml(when)}<br/>
Where: ${escapeHtml(event.address)}<br/>
Tickets: ${booking.ticketsCount}</p>
${code ? `<p><strong>Your ticket code:</strong> ${escapeHtml(code)}</p>` : ""}
${url ? `<p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>` : ""}
<p>Mention this code at the box office or entry.</p>
<p>Support: <a href="mailto:support@unveiled.berlin">support@unveiled.berlin</a></p>`,
  };
}
