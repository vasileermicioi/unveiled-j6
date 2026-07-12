import { describe, expect, test } from "bun:test";

import {
  buildBookingConfirmationContent,
  buildEventIcs,
  formatIcsUtc,
  sendBookingConfirmation,
} from "./index";

describe("booking confirmation content", () => {
  test("builds DE and EN subjects with redemption info", () => {
    const base = {
      toEmail: "member@example.com",
      event: {
        id: "evt-1",
        title: "Tonight Show",
        address: "Rosa-Luxemburg-Platz, Berlin",
        dateTime: new Date("2030-06-01T18:00:00.000Z"),
        partnerName: "Volksbühne",
      },
      booking: {
        id: "book-1",
        ticketsCount: 2,
        redemptionInfo: "SECRET99",
        redemptionUrl: null as string | null,
        redemptionType: "SECRET_CODE" as const,
      },
    };

    const de = buildBookingConfirmationContent({ ...base, locale: "de" });
    expect(de.subject).toContain("Tonight Show");
    expect(de.text).toContain("SECRET99");
    expect(de.html).toContain("SECRET99");

    const en = buildBookingConfirmationContent({ ...base, locale: "en" });
    expect(en.subject).toContain("Booking confirmation");
    expect(en.text).toContain("SECRET99");
  });
});

describe("ICS builder", () => {
  test("emits VEVENT with UTC timestamps", () => {
    const start = new Date("2030-06-01T18:00:00.000Z");
    const ics = buildEventIcs({
      event: {
        id: "evt-1",
        title: "Tonight Show",
        address: "Berlin",
        dateTime: start,
        partnerName: "Partner",
      },
      bookingId: "book-1",
    });

    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain(`DTSTART:${formatIcsUtc(start)}`);
    expect(ics).toContain("SUMMARY:Tonight Show");
    expect(ics).toContain("UID:booking-book-1@unveiled.berlin");
  });
});

describe("sendBookingConfirmation", () => {
  test("posts to Resend with ICS attachment without live network", async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const result = await sendBookingConfirmation({
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      locale: "en",
      toEmail: "member@example.com",
      event: {
        id: "evt-1",
        title: "Tonight Show",
        address: "Berlin",
        dateTime: new Date("2030-06-01T18:00:00.000Z"),
        partnerName: "Partner",
      },
      booking: {
        id: "book-1",
        ticketsCount: 1,
        redemptionInfo: "CODE1",
        redemptionUrl: null,
        redemptionType: "SECRET_CODE",
      },
      fetchImpl: async (url, init) => {
        calls.push({ url, body: String(init?.body ?? "") });
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "email_test" }),
        };
      },
    });

    expect(result.ok).toBe(true);
    expect(result.id).toBe("email_test");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(calls[0]?.body ?? "{}") as {
      attachments: Array<{ filename: string; content: string }>;
      subject: string;
    };
    expect(body.subject).toContain("Tonight Show");
    expect(body.attachments[0]?.filename).toBe("event.ics");
    expect(body.attachments[0]?.content.length).toBeGreaterThan(10);
  });
});
