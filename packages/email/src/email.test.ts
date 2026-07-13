import { describe, expect, test } from "bun:test";

import {
  buildBookingConfirmationContent,
  buildEventIcs,
  buildWaitlistPromotionContent,
  formatIcsUtc,
  sendBookingConfirmation,
  sendWaitlistPromotion,
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

describe("waitlist promotion content", () => {
  test("builds DE and EN subjects that mention waitlist promotion", () => {
    const base = {
      toEmail: "member@example.com",
      event: {
        id: "evt-1",
        title: "Sold Out Night",
        address: "Berlin",
        dateTime: new Date("2030-06-01T18:00:00.000Z"),
        partnerName: "Volksbühne",
      },
      booking: {
        id: "book-2",
        ticketsCount: 1,
        redemptionInfo: "PROMO42",
        redemptionUrl: null as string | null,
        redemptionType: "SECRET_CODE" as const,
      },
    };

    const de = buildWaitlistPromotionContent({ ...base, locale: "de" });
    expect(de.subject).toContain("Warteliste");
    expect(de.subject).toContain("Sold Out Night");
    expect(de.text).toContain("nachgerückt");
    expect(de.text).toContain("PROMO42");

    const en = buildWaitlistPromotionContent({ ...base, locale: "en" });
    expect(en.subject).toContain("Waitlist");
    expect(en.text).toContain("promoted from the waitlist");
    expect(en.text).toContain("PROMO42");
  });
});

describe("sendWaitlistPromotion", () => {
  test("posts to Resend with ICS attachment without live network", async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const result = await sendWaitlistPromotion({
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      locale: "en",
      toEmail: "member@example.com",
      event: {
        id: "evt-1",
        title: "Sold Out Night",
        address: "Berlin",
        dateTime: new Date("2030-06-01T18:00:00.000Z"),
        partnerName: "Partner",
      },
      booking: {
        id: "book-2",
        ticketsCount: 1,
        redemptionInfo: "PROMO42",
        redemptionUrl: null,
        redemptionType: "SECRET_CODE",
      },
      fetchImpl: async (url, init) => {
        calls.push({ url, body: String(init?.body ?? "") });
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "email_waitlist" }),
        };
      },
    });

    expect(result.ok).toBe(true);
    expect(result.id).toBe("email_waitlist");
    expect(calls).toHaveLength(1);
    const body = JSON.parse(calls[0]?.body ?? "{}") as {
      attachments: Array<{ filename: string }>;
      subject: string;
    };
    expect(body.subject).toContain("Waitlist");
    expect(body.attachments[0]?.filename).toBe("event.ics");
  });
});
