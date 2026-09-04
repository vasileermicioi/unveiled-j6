import { describe, expect, test } from "bun:test";

import {
  buildBookingCancellationContent,
  buildBookingConfirmationContent,
  buildEventIcs,
  buildSubscriptionCancellationContent,
  buildSubscriptionInvoiceContent,
  buildWaitlistClosedContent,
  buildWaitlistPromotionContent,
  formatCancellationEndDate,
  formatIcsUtc,
  sendBookingCancellation,
  sendBookingConfirmation,
  sendSubscriptionCancellation,
  sendSubscriptionInvoice,
  sendWaitlistClosed,
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

  test("DTSTART uses the booked occurrence instant, not a different catalog primary", () => {
    const booked = new Date("2030-06-08T17:00:00.000Z");
    const ics = buildEventIcs({
      event: {
        id: "evt-1",
        title: "Tonight Show",
        address: "Berlin",
        dateTime: booked,
        partnerName: "Partner",
      },
      bookingId: "book-1",
    });
    expect(ics).toContain(`DTSTART:${formatIcsUtc(booked)}`);
    expect(ics).not.toContain(`DTSTART:${formatIcsUtc(new Date("2030-06-01T18:00:00.000Z"))}`);
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

const INVOICE_SITE_URL = "https://example.test";

const EN_INVOICE_LINKS = [
  `${INVOICE_SITE_URL}/en/events`,
  `${INVOICE_SITE_URL}/en/bookings`,
  `${INVOICE_SITE_URL}/en/profile/billing`,
  `${INVOICE_SITE_URL}/en/how-it-works`,
  `${INVOICE_SITE_URL}/en/faq`,
] as const;

const DE_INVOICE_LINKS = [
  `${INVOICE_SITE_URL}/de/events`,
  `${INVOICE_SITE_URL}/de/bookings`,
  `${INVOICE_SITE_URL}/de/profile/billing`,
  `${INVOICE_SITE_URL}/de/how-it-works`,
  `${INVOICE_SITE_URL}/de/faq`,
] as const;

describe("subscription invoice content", () => {
  test("builds EN invoice with instructions and site links", () => {
    const content = buildSubscriptionInvoiceContent({
      locale: "en",
      siteUrl: INVOICE_SITE_URL,
    });

    expect(content.subject).toBe("Your Unveiled Berlin invoice");

    for (const body of [content.text, content.html]) {
      expect(body).toContain("membership is active");
      expect(body).toContain("Basic Berlin");
      expect(body).toContain("29€/month");
      expect(body).toContain("17 per month");
      expect(body).toContain("unused credits do not roll over");
      expect(body).toContain("Your invoice is attached as a PDF.");
      expect(body).toContain("support@unveiled.berlin");
      for (const link of EN_INVOICE_LINKS) {
        expect(body).toContain(link);
      }
    }

    expect(content.html).toContain(`href="${EN_INVOICE_LINKS[0]}"`);
    expect(content.html).toContain('href="mailto:support@unveiled.berlin"');
  });

  test("builds DE invoice with instructions and site links", () => {
    const content = buildSubscriptionInvoiceContent({
      locale: "de",
      siteUrl: INVOICE_SITE_URL,
    });

    expect(content.subject).toBe("Deine Unveiled Berlin Rechnung");

    for (const body of [content.text, content.html]) {
      expect(body).toContain("Mitgliedschaft ist aktiv");
      expect(body).toContain("Basic Berlin");
      expect(body).toContain("29€/Monat");
      expect(body).toContain("17 pro Monat");
      expect(body).toContain("ungenutzte Credits verfallen");
      expect(body).toContain("Deine Rechnung ist als PDF angehängt.");
      expect(body).toContain("support@unveiled.berlin");
      for (const link of DE_INVOICE_LINKS) {
        expect(body).toContain(link);
      }
    }

    expect(content.html).toContain(`href="${DE_INVOICE_LINKS[0]}"`);
    expect(content.html).toContain('href="mailto:support@unveiled.berlin"');
  });

  test("uses a branded mail-client-safe layout with preheader in both locales", () => {
    const en = buildSubscriptionInvoiceContent({
      locale: "en",
      siteUrl: INVOICE_SITE_URL,
    });
    const de = buildSubscriptionInvoiceContent({
      locale: "de",
      siteUrl: INVOICE_SITE_URL,
    });

    for (const content of [en, de]) {
      // Hidden inbox-preview preheader.
      expect(content.html).toContain("display:none");
      expect(content.html).toContain("mso-hide:all");
      // Table-based layout, max-width 600, brand yellow, inline styles only.
      expect(content.html).toContain("<table");
      expect(content.html).toContain("600");
      expect(content.html).toContain("#FAFF86");
      expect(content.html).not.toContain("<style");
      // Header / summary / next-steps / footer structure.
      expect(content.html).toContain("Unveiled Berlin");
      expect(content.html).toContain("<ol");
      expect(content.html).toContain("<li");
      for (const body of [content.text, content.html]) {
        expect(body).toContain("Basic Berlin");
        expect(body).toContain("support@unveiled.berlin");
      }
    }

    expect(en.html).toContain("Your membership is active");
    expect(en.html).toContain("invoice attached");
    expect(de.html).toContain("Deine Mitgliedschaft ist aktiv");
    expect(de.html).toContain("Rechnung im Anhang");
  });

  test("keeps text free of markup while HTML anchors every locale link", () => {
    for (const locale of ["en", "de"] as const) {
      const content = buildSubscriptionInvoiceContent({
        locale,
        siteUrl: INVOICE_SITE_URL,
      });
      const links = locale === "en" ? EN_INVOICE_LINKS : DE_INVOICE_LINKS;

      expect(content.text).not.toContain("<a");
      expect(content.text).not.toContain("<table");
      for (const link of links) {
        expect(content.text).toContain(link);
        expect(content.html).toContain(`href="${link}"`);
      }
    }
  });

  test("escapes a hostile siteUrl in HTML", () => {
    const hostile = 'https://example.test"><script>alert(1)</script>';
    const content = buildSubscriptionInvoiceContent({
      locale: "en",
      siteUrl: hostile,
    });

    expect(content.html).not.toContain("<script>");
    expect(content.html).toContain("&lt;script&gt;");
  });

  test("reuses the same neutral template for resubscription (no welcome fork)", () => {
    // A resubscription (new `subscription_create` after `INACTIVE`) reuses this
    // same builder — neutral "active" wording, no welcome/welcome-back copy.
    for (const locale of ["en", "de"] as const) {
      const content = buildSubscriptionInvoiceContent({
        locale,
        siteUrl: INVOICE_SITE_URL,
      });
      for (const body of [content.text, content.html]) {
        expect(body).not.toMatch(/welcome/i);
        expect(body).not.toContain("Willkommen");
      }
    }
  });
});

describe("sendSubscriptionInvoice", () => {
  test("posts to Resend with caller-supplied PDF without live network", async () => {
    const pdfBase64 = "JVBERi0xLjQK";
    const calls: Array<{ url: string; body: string }> = [];
    const result = await sendSubscriptionInvoice({
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      toEmail: "member@example.com",
      locale: "en",
      siteUrl: INVOICE_SITE_URL,
      pdfBase64,
      pdfFilename: "invoice-in_test.pdf",
      fetchImpl: async (url, init) => {
        calls.push({ url, body: String(init?.body ?? "") });
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "email_invoice" }),
        };
      },
    });

    expect(result.ok).toBe(true);
    expect(result.id).toBe("email_invoice");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(calls[0]?.body ?? "{}") as {
      attachments: Array<{ filename: string; content: string; content_type?: string }>;
      subject: string;
      to: string[];
    };
    expect(body.subject).toBe("Your Unveiled Berlin invoice");
    expect(body.to).toEqual(["member@example.com"]);
    expect(body.attachments).toHaveLength(1);
    expect(body.attachments[0]?.filename).toBe("invoice-in_test.pdf");
    expect(body.attachments[0]?.content).toBe(pdfBase64);
    expect(body.attachments[0]?.content_type).toBe("application/pdf");
  });

  test("forwards Idempotency-Key when provided", async () => {
    const headers: Array<Record<string, string> | undefined> = [];
    const result = await sendSubscriptionInvoice({
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      toEmail: "member@example.com",
      locale: "en",
      siteUrl: INVOICE_SITE_URL,
      pdfBase64: "JVBERi0xLjQK",
      pdfFilename: "invoice-in_test.pdf",
      idempotencyKey: "in_test",
      fetchImpl: async (_url, init) => {
        headers.push(init?.headers);
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "email_idem" }),
        };
      },
    });

    expect(result.ok).toBe(true);
    expect(headers[0]?.["Idempotency-Key"]).toBe("in_test");
  });
});

const CANCELLATION_EVENT = {
  id: "evt-1",
  title: "Tonight Show",
  address: "Rosa-Luxemburg-Platz, Berlin",
  dateTime: new Date("2030-06-01T18:00:00.000Z"),
  partnerName: "Volksbühne",
};

describe("booking cancellation content", () => {
  test("paid cancellation includes voided ticket and credit-return sentences", () => {
    const de = buildBookingCancellationContent({
      locale: "de",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
      ticketsCount: 1,
      totalCredits: 2,
    });
    expect(de.subject).toBe("Buchung storniert: Tonight Show");
    expect(de.text).toContain("ungültig");
    expect(de.text).toContain("2 Credits wurden dir zurückgegeben");
    expect(de.html).toContain("ungültig");
    expect(de.html).toContain("2 Credits wurden dir zurückgegeben");

    const en = buildBookingCancellationContent({
      locale: "en",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
      ticketsCount: 1,
      totalCredits: 2,
    });
    expect(en.subject).toBe("Booking cancelled: Tonight Show");
    expect(en.text).toContain("is void");
    expect(en.text).toContain("2 credits were returned to you");
    expect(en.html).toContain("is void");
    expect(en.html).toContain("2 credits were returned to you");
  });

  test("comp cancellation includes voided ticket and no credit-return sentence", () => {
    const en = buildBookingCancellationContent({
      locale: "en",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
      ticketsCount: 1,
      totalCredits: 0,
    });
    expect(en.text).toContain("is void");
    expect(en.text).not.toContain("credits were returned");
    expect(en.html).not.toContain("credits were returned");

    const de = buildBookingCancellationContent({
      locale: "de",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
      ticketsCount: 1,
      totalCredits: 0,
    });
    expect(de.text).toContain("ungültig");
    expect(de.text).not.toContain("Credits wurden dir zurückgegeben");
  });
});

describe("waitlist-closed content", () => {
  test("states the waitlist is closed and has no credit sentence", () => {
    const de = buildWaitlistClosedContent({
      locale: "de",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
    });
    expect(de.subject).toBe("Warteliste geschlossen: Tonight Show");
    expect(de.text).toContain("Warteliste");
    expect(de.text).toContain("geschlossen");
    expect(de.text).not.toContain("Credits");
    expect(de.html).not.toContain("Credits");

    const en = buildWaitlistClosedContent({
      locale: "en",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
    });
    expect(en.subject).toBe("Waitlist closed: Tonight Show");
    expect(en.text).toContain("waitlist");
    expect(en.text).toContain("closed");
    expect(en.text).not.toContain("credits were returned");
    expect(en.html).not.toContain("credits were returned");
  });
});

describe("sendBookingCancellation", () => {
  test("posts to Resend without ICS and returns ok false on HTTP error without throwing", async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const ok = await sendBookingCancellation({
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      locale: "en",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
      ticketsCount: 1,
      totalCredits: 2,
      fetchImpl: async (url, init) => {
        calls.push({ url, body: String(init?.body ?? "") });
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "email_cancel" }),
        };
      },
    });
    expect(ok.ok).toBe(true);
    expect(ok.id).toBe("email_cancel");
    expect(calls).toHaveLength(1);
    const body = JSON.parse(calls[0]?.body ?? "{}") as {
      subject: string;
      attachments?: unknown[];
    };
    expect(body.subject).toBe("Booking cancelled: Tonight Show");
    expect(body.attachments).toBeUndefined();

    const failed = await sendBookingCancellation({
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      locale: "en",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
      ticketsCount: 1,
      totalCredits: 2,
      fetchImpl: async () => ({
        ok: false,
        status: 500,
        json: async () => ({ message: "Resend down" }),
      }),
    });
    expect(failed.ok).toBe(false);
    expect(failed.status).toBe(500);
    expect(failed.error).toBe("Resend down");
  });
});

describe("sendWaitlistClosed", () => {
  test("posts to Resend without ICS and returns ok false on HTTP error without throwing", async () => {
    const ok = await sendWaitlistClosed({
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      locale: "de",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ id: "email_wait_closed" }),
      }),
    });
    expect(ok.ok).toBe(true);
    expect(ok.id).toBe("email_wait_closed");

    const failed = await sendWaitlistClosed({
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      locale: "en",
      toEmail: "member@example.com",
      event: CANCELLATION_EVENT,
      fetchImpl: async () => ({
        ok: false,
        status: 429,
        json: async () => ({ message: "rate limited" }),
      }),
    });
    expect(failed.ok).toBe(false);
    expect(failed.status).toBe(429);
  });
});

const CANCELLATION_SITE_URL = "https://example.test";
const CANCELLATION_END_DATE = new Date("2030-09-30T21:59:59.000Z");

function cancellationInput(locale: "de" | "en") {
  return {
    locale,
    siteUrl: CANCELLATION_SITE_URL,
    endDate: CANCELLATION_END_DATE,
    resubscribeUrl: `${CANCELLATION_SITE_URL}/${locale}/membership`,
  };
}

describe("subscription cancellation content", () => {
  test("builds EN cancellation with end date, expiry note, and links", () => {
    const content = buildSubscriptionCancellationContent(cancellationInput("en"));
    const endDateLabel = formatCancellationEndDate(CANCELLATION_END_DATE, "en");

    expect(content.subject).toBe("Your Unveiled Berlin membership is ending");

    for (const body of [content.text, content.html]) {
      expect(body).toContain("membership is ending");
      expect(body).toContain(endDateLabel);
      expect(body).toContain("Unused credits expire");
      expect(body).toContain("tickets stay valid");
      expect(body).toContain(`${CANCELLATION_SITE_URL}/en/membership`);
      expect(body).toContain(`${CANCELLATION_SITE_URL}/en/profile/billing`);
      expect(body).toContain("support@unveiled.berlin");
    }

    expect(content.html).toContain(`href="${CANCELLATION_SITE_URL}/en/membership"`);
    expect(content.html).toContain(`href="${CANCELLATION_SITE_URL}/en/profile/billing"`);
    expect(content.html).toContain('href="mailto:support@unveiled.berlin"');
  });

  test("builds DE cancellation with end date, expiry note, and links", () => {
    const content = buildSubscriptionCancellationContent(cancellationInput("de"));
    const endDateLabel = formatCancellationEndDate(CANCELLATION_END_DATE, "de");

    expect(content.subject).toBe("Deine Unveiled Berlin Mitgliedschaft endet");

    for (const body of [content.text, content.html]) {
      expect(body).toContain("Mitgliedschaft endet");
      expect(body).toContain(endDateLabel);
      expect(body).toContain("Ungenutzte Credits verfallen");
      expect(body).toContain("Tickets bleiben");
      expect(body).toContain("gültig");
      expect(body).toContain(`${CANCELLATION_SITE_URL}/de/membership`);
      expect(body).toContain(`${CANCELLATION_SITE_URL}/de/profile/billing`);
      expect(body).toContain("support@unveiled.berlin");
    }

    expect(content.html).toContain(`href="${CANCELLATION_SITE_URL}/de/membership"`);
    expect(content.html).toContain(`href="${CANCELLATION_SITE_URL}/de/profile/billing"`);
    expect(content.html).toContain('href="mailto:support@unveiled.berlin"');
  });

  test("formats the Berlin end date per locale", () => {
    expect(formatCancellationEndDate(CANCELLATION_END_DATE, "de")).toContain("September 2030");
    expect(formatCancellationEndDate(CANCELLATION_END_DATE, "en")).toContain("September 2030");
  });

  test("uses a branded mail-client-safe layout with preheader in both locales", () => {
    const en = buildSubscriptionCancellationContent(cancellationInput("en"));
    const de = buildSubscriptionCancellationContent(cancellationInput("de"));

    for (const content of [en, de]) {
      expect(content.html).toContain("display:none");
      expect(content.html).toContain("mso-hide:all");
      expect(content.html).toContain("<table");
      expect(content.html).toContain("600");
      expect(content.html).toContain("#FAFF86");
      expect(content.html).not.toContain("<style");
      expect(content.html).toContain("Unveiled Berlin");
      for (const body of [content.text, content.html]) {
        expect(body).toContain("support@unveiled.berlin");
      }
    }

    expect(en.html).toContain("Your membership is ending");
    expect(de.html).toContain("Deine Mitgliedschaft endet");
  });

  test("keeps text free of markup while HTML anchors every link", () => {
    for (const locale of ["en", "de"] as const) {
      const content = buildSubscriptionCancellationContent(cancellationInput(locale));
      const links = [
        `${CANCELLATION_SITE_URL}/${locale}/membership`,
        `${CANCELLATION_SITE_URL}/${locale}/profile/billing`,
      ];

      expect(content.text).not.toContain("<a");
      expect(content.text).not.toContain("<table");
      for (const link of links) {
        expect(content.text).toContain(link);
        expect(content.html).toContain(`href="${link}"`);
      }
    }
  });

  test("escapes a hostile resubscribeUrl in HTML", () => {
    const hostile = 'https://example.test"><script>alert(1)</script>';
    const content = buildSubscriptionCancellationContent({
      locale: "en",
      siteUrl: CANCELLATION_SITE_URL,
      endDate: CANCELLATION_END_DATE,
      resubscribeUrl: hostile,
    });

    expect(content.html).not.toContain("<script>");
    expect(content.html).toContain("&lt;script&gt;");
  });
});

describe("sendSubscriptionCancellation", () => {
  test("posts to Resend without attachments and without live network", async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const result = await sendSubscriptionCancellation({
      ...cancellationInput("en"),
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      toEmail: "member@example.com",
      fetchImpl: async (url, init) => {
        calls.push({ url, body: String(init?.body ?? "") });
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "email_cancel_sub" }),
        };
      },
    });

    expect(result.ok).toBe(true);
    expect(result.id).toBe("email_cancel_sub");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(calls[0]?.body ?? "{}") as {
      attachments?: unknown;
      subject: string;
      to: string[];
    };
    expect(body.subject).toBe("Your Unveiled Berlin membership is ending");
    expect(body.to).toEqual(["member@example.com"]);
    expect(body.attachments).toBeUndefined();
  });

  test("forwards Idempotency-Key when provided", async () => {
    const headers: Array<Record<string, string> | undefined> = [];
    const result = await sendSubscriptionCancellation({
      ...cancellationInput("de"),
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      toEmail: "member@example.com",
      idempotencyKey: "evt_test",
      fetchImpl: async (_url, init) => {
        headers.push(init?.headers);
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "email_cancel_idem" }),
        };
      },
    });

    expect(result.ok).toBe(true);
    expect(headers[0]?.["Idempotency-Key"]).toBe("evt_test");
  });

  test("returns ok false on HTTP error without throwing", async () => {
    const result = await sendSubscriptionCancellation({
      ...cancellationInput("en"),
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      toEmail: "member@example.com",
      fetchImpl: async () => ({
        ok: false,
        status: 500,
        json: async () => ({ message: "Resend down" }),
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toBe("Resend down");
  });
});
