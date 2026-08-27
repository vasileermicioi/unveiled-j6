export type SubscriptionInvoiceLocale = "de" | "en";

export type BuildSubscriptionInvoiceInput = {
  locale: SubscriptionInvoiceLocale;
  /** Public origin with no trailing slash (same contract as `getSiteUrl()`). */
  siteUrl: string;
};

export type SubscriptionInvoiceContent = {
  subject: string;
  text: string;
  html: string;
};

const SUPPORT_EMAIL = "support@unveiled.berlin";

type InvoiceLinks = {
  events: string;
  bookings: string;
  billing: string;
  howItWorks: string;
  faq: string;
};

function invoiceLinks(siteUrl: string, locale: SubscriptionInvoiceLocale): InvoiceLinks {
  return {
    events: `${siteUrl}/${locale}/events`,
    bookings: `${siteUrl}/${locale}/bookings`,
    billing: `${siteUrl}/${locale}/profile/billing`,
    howItWorks: `${siteUrl}/${locale}/how-it-works`,
    faq: `${siteUrl}/${locale}/faq`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function linkHtml(url: string): string {
  const escaped = escapeHtml(url);
  return `<a href="${escaped}">${escaped}</a>`;
}

export function buildSubscriptionInvoiceContent(
  input: BuildSubscriptionInvoiceInput,
): SubscriptionInvoiceContent {
  const links = invoiceLinks(input.siteUrl, input.locale);

  if (input.locale === "de") {
    return {
      subject: "Deine Unveiled Berlin Rechnung",
      text: `Deine Unveiled Berlin Mitgliedschaft ist aktiv.

Abo: Basic Berlin — 29€/Monat
Credits: 17 pro Monat (ungenutzte Credits verfallen)

Deine Rechnung ist als PDF angehängt.

Nächste Schritte:
1. Events entdecken: ${links.events}
2. Mit Credits buchen — Tickets und Einlassdetails findest du unter Meine Tickets: ${links.bookings}
3. Abrechnung verwalten: ${links.billing}
4. So funktioniert's: ${links.howItWorks}
5. FAQ: ${links.faq}

Support: ${SUPPORT_EMAIL}`,
      html: `<p>Deine Unveiled Berlin Mitgliedschaft ist aktiv.</p>
<p>Abo: <strong>Basic Berlin</strong> — 29€/Monat<br/>
Credits: 17 pro Monat (ungenutzte Credits verfallen)</p>
<p>Deine Rechnung ist als PDF angehängt.</p>
<p>Nächste Schritte:<br/>
1. Events entdecken: ${linkHtml(links.events)}<br/>
2. Mit Credits buchen — Tickets und Einlassdetails findest du unter Meine Tickets: ${linkHtml(links.bookings)}<br/>
3. Abrechnung verwalten: ${linkHtml(links.billing)}<br/>
4. So funktioniert's: ${linkHtml(links.howItWorks)}<br/>
5. FAQ: ${linkHtml(links.faq)}</p>
<p>Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>`,
    };
  }

  return {
    subject: "Your Unveiled Berlin invoice",
    text: `Your Unveiled Berlin membership is active.

Plan: Basic Berlin — 29€/month
Credits: 17 per month (unused credits do not roll over)

Your invoice is attached as a PDF.

What to do next:
1. Browse events: ${links.events}
2. Book with your credits — tickets and door details land in My Tickets: ${links.bookings}
3. Manage billing: ${links.billing}
4. How it works: ${links.howItWorks}
5. FAQ: ${links.faq}

Support: ${SUPPORT_EMAIL}`,
    html: `<p>Your Unveiled Berlin membership is active.</p>
<p>Plan: <strong>Basic Berlin</strong> — 29€/month<br/>
Credits: 17 per month (unused credits do not roll over)</p>
<p>Your invoice is attached as a PDF.</p>
<p>What to do next:<br/>
1. Browse events: ${linkHtml(links.events)}<br/>
2. Book with your credits — tickets and door details land in My Tickets: ${linkHtml(links.bookings)}<br/>
3. Manage billing: ${linkHtml(links.billing)}<br/>
4. How it works: ${linkHtml(links.howItWorks)}<br/>
5. FAQ: ${linkHtml(links.faq)}</p>
<p>Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>`,
  };
}
