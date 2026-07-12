import type { BookingConfirmationEvent } from "./booking-confirmation";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format an instant as UTC `YYYYMMDDTHHMMSSZ` for ICS. */
export function formatIcsUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcsText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

export type BuildIcsInput = {
  event: BookingConfirmationEvent;
  bookingId: string;
  /** Duration hint in minutes; default 120. */
  durationMinutes?: number;
};

/**
 * Build a VEVENT ICS payload (Europe/Berlin wall times expressed as UTC instants).
 */
export function buildEventIcs(input: BuildIcsInput): string {
  const start = input.event.dateTime;
  const end = new Date(start.getTime() + (input.durationMinutes ?? 120) * 60_000);
  const uid = `booking-${input.bookingId}@unveiled.berlin`;
  const stamp = formatIcsUtc(new Date());
  const summary = escapeIcsText(input.event.title);
  const location = escapeIcsText(input.event.address);
  const description = escapeIcsText(`${input.event.partnerName} — Unveiled Berlin`);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Unveiled Berlin//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
