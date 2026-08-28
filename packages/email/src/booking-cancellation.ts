import type {
  BookingConfirmationContent,
  BookingConfirmationEvent,
  BookingLocale,
} from "./booking-confirmation";

export type BuildBookingCancellationInput = {
  locale: BookingLocale;
  toEmail: string;
  event: BookingConfirmationEvent;
  ticketsCount: number;
  totalCredits: number;
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

export function buildBookingCancellationContent(
  input: BuildBookingCancellationInput,
): BookingConfirmationContent {
  const { locale, event, ticketsCount, totalCredits } = input;
  const when = formatEventWhen(event.dateTime, locale);
  const creditsReturned = totalCredits > 0;

  if (locale === "de") {
    const subject = `Buchung storniert: ${event.title}`;
    const voidLine = `Dein Ticket für ${event.title} ist ungültig.`;
    const creditLine = creditsReturned ? `${totalCredits} Credits wurden dir zurückgegeben.` : null;
    const lines = [
      voidLine,
      creditLine,
      `Partner: ${event.partnerName}`,
      `Wann: ${when}`,
      `Wo: ${event.address}`,
      `Tickets: ${ticketsCount}`,
      "Support: support@unveiled.berlin",
    ].filter(Boolean);

    return {
      subject,
      text: lines.join("\n"),
      html: `<p>${escapeHtml(voidLine)}</p>
${creditLine ? `<p>${escapeHtml(creditLine)}</p>` : ""}
<p>Partner: ${escapeHtml(event.partnerName)}<br/>
Wann: ${escapeHtml(when)}<br/>
Wo: ${escapeHtml(event.address)}<br/>
Tickets: ${ticketsCount}</p>
<p>Support: <a href="mailto:support@unveiled.berlin">support@unveiled.berlin</a></p>`,
    };
  }

  const subject = `Booking cancelled: ${event.title}`;
  const voidLine = `Your ticket for ${event.title} is void.`;
  const creditLine = creditsReturned ? `${totalCredits} credits were returned to you.` : null;
  const lines = [
    voidLine,
    creditLine,
    `Partner: ${event.partnerName}`,
    `When: ${when}`,
    `Where: ${event.address}`,
    `Tickets: ${ticketsCount}`,
    "Support: support@unveiled.berlin",
  ].filter(Boolean);

  return {
    subject,
    text: lines.join("\n"),
    html: `<p>${escapeHtml(voidLine)}</p>
${creditLine ? `<p>${escapeHtml(creditLine)}</p>` : ""}
<p>Partner: ${escapeHtml(event.partnerName)}<br/>
When: ${escapeHtml(when)}<br/>
Where: ${escapeHtml(event.address)}<br/>
Tickets: ${ticketsCount}</p>
<p>Support: <a href="mailto:support@unveiled.berlin">support@unveiled.berlin</a></p>`,
  };
}
