import type {
  BookingConfirmationContent,
  BookingConfirmationEvent,
  BookingLocale,
} from "./booking-confirmation";

export type BuildWaitlistClosedInput = {
  locale: BookingLocale;
  toEmail: string;
  event: BookingConfirmationEvent;
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

export function buildWaitlistClosedContent(
  input: BuildWaitlistClosedInput,
): BookingConfirmationContent {
  const { locale, event } = input;
  const when = formatEventWhen(event.dateTime, locale);

  if (locale === "de") {
    const subject = `Warteliste geschlossen: ${event.title}`;
    const lead = `Die Warteliste für ${event.title} wurde geschlossen. Du wurdest nicht befördert.`;
    const lines = [
      lead,
      `Partner: ${event.partnerName}`,
      `Wann: ${when}`,
      `Wo: ${event.address}`,
      "Support: support@unveiled.berlin",
    ];

    return {
      subject,
      text: lines.join("\n"),
      html: `<p>${escapeHtml(lead)}</p>
<p>Partner: ${escapeHtml(event.partnerName)}<br/>
Wann: ${escapeHtml(when)}<br/>
Wo: ${escapeHtml(event.address)}</p>
<p>Support: <a href="mailto:support@unveiled.berlin">support@unveiled.berlin</a></p>`,
    };
  }

  const subject = `Waitlist closed: ${event.title}`;
  const lead = `The waitlist for ${event.title} is closed. You were not promoted.`;
  const lines = [
    lead,
    `Partner: ${event.partnerName}`,
    `When: ${when}`,
    `Where: ${event.address}`,
    "Support: support@unveiled.berlin",
  ];

  return {
    subject,
    text: lines.join("\n"),
    html: `<p>${escapeHtml(lead)}</p>
<p>Partner: ${escapeHtml(event.partnerName)}<br/>
When: ${escapeHtml(when)}<br/>
Where: ${escapeHtml(event.address)}</p>
<p>Support: <a href="mailto:support@unveiled.berlin">support@unveiled.berlin</a></p>`,
  };
}
