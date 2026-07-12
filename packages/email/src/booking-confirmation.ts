export type BookingLocale = "de" | "en";

export type BookingConfirmationEvent = {
  id: string;
  title: string;
  address: string;
  dateTime: Date;
  partnerName: string;
};

export type BookingConfirmationBooking = {
  id: string;
  ticketsCount: number;
  redemptionInfo: string | null;
  redemptionUrl: string | null;
  redemptionType: "VOUCHER" | "SECRET_CODE" | null;
};

export type BuildBookingConfirmationInput = {
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

export type BookingConfirmationContent = {
  subject: string;
  text: string;
  html: string;
};

export function buildBookingConfirmationContent(
  input: BuildBookingConfirmationInput,
): BookingConfirmationContent {
  const { locale, event, booking } = input;
  const when = formatEventWhen(event.dateTime, locale);
  const code = booking.redemptionInfo?.trim() || "";
  const url = booking.redemptionUrl?.trim() || "";

  if (locale === "de") {
    const subject = `Buchungsbestätigung: ${event.title}`;
    const lines = [
      `Deine Buchung für ${event.title} ist bestätigt.`,
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
      html: `<p>Deine Buchung für <strong>${escapeHtml(event.title)}</strong> ist bestätigt.</p>
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

  const subject = `Booking confirmation: ${event.title}`;
  const lines = [
    `Your booking for ${event.title} is confirmed.`,
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
    html: `<p>Your booking for <strong>${escapeHtml(event.title)}</strong> is confirmed.</p>
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
