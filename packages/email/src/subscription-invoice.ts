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

/** App brand tokens for mail (mirrors the web theme: yellow page, dark ink). */
const BRAND_YELLOW = "#FAFF86";
const BRAND_INK = "#191919";
const FONT_STACK = 'Work Sans, -apple-system, "Segoe UI", Arial, sans-serif';

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
  return `<a href="${escaped}" style="color:${BRAND_INK};text-decoration:underline;">${escaped}</a>`;
}

type InvoiceCopy = {
  preheader: string;
  brandLine: string;
  headline: string;
  greeting: string;
  planLine: string;
  creditsLine: string;
  pdfNote: string;
  stepsHeading: string;
  steps: Array<{ label: string; url: string }>;
  supportLabel: string;
};

function invoiceCopy(locale: SubscriptionInvoiceLocale, links: InvoiceLinks): InvoiceCopy {
  if (locale === "de") {
    return {
      preheader: "Deine Unveiled Berlin Mitgliedschaft ist aktiv — Rechnung im Anhang.",
      brandLine: "Unveiled Berlin",
      headline: "Deine Mitgliedschaft ist aktiv",
      greeting: "Deine Unveiled Berlin Mitgliedschaft ist aktiv.",
      planLine: "Abo: Basic Berlin — 29€/Monat",
      creditsLine: "Credits: 17 pro Monat (ungenutzte Credits verfallen)",
      pdfNote: "Deine Rechnung ist als PDF angehängt.",
      stepsHeading: "Nächste Schritte",
      steps: [
        { label: "Events entdecken", url: links.events },
        {
          label: "Mit Credits buchen — Tickets und Einlassdetails findest du unter Meine Tickets",
          url: links.bookings,
        },
        { label: "Abrechnung verwalten", url: links.billing },
        { label: "So funktioniert's", url: links.howItWorks },
        { label: "FAQ", url: links.faq },
      ],
      supportLabel: "Support",
    };
  }

  return {
    preheader: "Your Unveiled Berlin membership is active — invoice attached.",
    brandLine: "Unveiled Berlin",
    headline: "Your membership is active",
    greeting: "Your Unveiled Berlin membership is active.",
    planLine: "Plan: Basic Berlin — 29€/month",
    creditsLine: "Credits: 17 per month (unused credits do not roll over)",
    pdfNote: "Your invoice is attached as a PDF.",
    stepsHeading: "What to do next",
    steps: [
      { label: "Browse events", url: links.events },
      {
        label: "Book with your credits — tickets and door details land in My Tickets",
        url: links.bookings,
      },
      { label: "Manage billing", url: links.billing },
      { label: "How it works", url: links.howItWorks },
      { label: "FAQ", url: links.faq },
    ],
    supportLabel: "Support",
  };
}

function invoiceStepsText(copy: InvoiceCopy): string {
  return copy.steps.map((step, index) => `${index + 1}. ${step.label}: ${step.url}`).join("\n");
}

function invoiceStepsHtml(copy: InvoiceCopy): string {
  return copy.steps
    .map(
      (step) =>
        `<li style="margin:0 0 8px 0;">${escapeHtml(step.label)}: ${linkHtml(step.url)}</li>`,
    )
    .join("");
}

/**
 * Mail-client-safe branded HTML (tables + inline styles only, max-width 600,
 * no external CSS/JS/fonts). All interpolated values are escaped.
 */
function invoiceHtml(copy: InvoiceCopy): string {
  return (
    `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(copy.preheader)}</div>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND_YELLOW};margin:0;padding:24px 0;font-family:${FONT_STACK};">` +
    `<tr><td align="center" style="padding:0 16px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid ${BRAND_INK};">` +
    `<tr><td style="background-color:${BRAND_INK};padding:20px 24px;">` +
    `<p style="margin:0 0 4px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_YELLOW};">${escapeHtml(copy.brandLine)}</p>` +
    `<p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;">${escapeHtml(copy.headline)}</p>` +
    `</td></tr>` +
    `<tr><td style="padding:24px;">` +
    `<p style="margin:0 0 16px 0;font-size:15px;line-height:22px;color:${BRAND_INK};">${escapeHtml(copy.greeting)}</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND_YELLOW};border:1px solid ${BRAND_INK};margin:0 0 16px 0;">` +
    `<tr><td style="padding:16px 20px;font-size:15px;line-height:24px;color:${BRAND_INK};">` +
    `${escapeHtml(copy.planLine)}<br/>${escapeHtml(copy.creditsLine)}` +
    `</td></tr></table>` +
    `<p style="margin:0 0 16px 0;font-size:15px;line-height:22px;color:${BRAND_INK};">${escapeHtml(copy.pdfNote)}</p>` +
    `<p style="margin:0 0 8px 0;font-size:15px;font-weight:bold;color:${BRAND_INK};">${escapeHtml(copy.stepsHeading)}:</p>` +
    `<ol style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:15px;line-height:22px;color:${BRAND_INK};">${invoiceStepsHtml(copy)}</ol>` +
    `<p style="margin:0;font-size:14px;line-height:20px;color:${BRAND_INK};">${escapeHtml(copy.supportLabel)}: <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_INK};text-decoration:underline;">${SUPPORT_EMAIL}</a></p>` +
    `</td></tr>` +
    `</table></td></tr></table>`
  );
}

/**
 * Professional subscribe/resub invoice content (DE + EN).
 *
 * Resub-reuse contract: a resubscription (a new `subscription_create` invoice
 * after `INACTIVE`) reuses this same neutral-active template — there is no
 * welcome / welcome-back copy fork, so the webhook orchestrator needs no
 * prior-status plumbing. Subjects, the 5 locale links, and the single-PDF
 * attachment contract are unchanged.
 */
export function buildSubscriptionInvoiceContent(
  input: BuildSubscriptionInvoiceInput,
): SubscriptionInvoiceContent {
  const links = invoiceLinks(input.siteUrl, input.locale);
  const copy = invoiceCopy(input.locale, links);

  if (input.locale === "de") {
    return {
      subject: "Deine Unveiled Berlin Rechnung",
      text: `Deine Unveiled Berlin Mitgliedschaft ist aktiv.

Abo: Basic Berlin — 29€/Monat
Credits: 17 pro Monat (ungenutzte Credits verfallen)

Deine Rechnung ist als PDF angehängt.

Nächste Schritte:
${invoiceStepsText(copy)}

Support: ${SUPPORT_EMAIL}`,
      html: invoiceHtml(copy),
    };
  }

  return {
    subject: "Your Unveiled Berlin invoice",
    text: `Your Unveiled Berlin membership is active.

Plan: Basic Berlin — 29€/month
Credits: 17 per month (unused credits do not roll over)

Your invoice is attached as a PDF.

What to do next:
${invoiceStepsText(copy)}

Support: ${SUPPORT_EMAIL}`,
    html: invoiceHtml(copy),
  };
}
