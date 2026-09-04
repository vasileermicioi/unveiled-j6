export type SubscriptionCancellationLocale = "de" | "en";

export type BuildSubscriptionCancellationInput = {
  locale: SubscriptionCancellationLocale;
  /** Public origin with no trailing slash (same contract as `getSiteUrl()`). */
  siteUrl: string;
  /** Access runs until this instant; rendered in Europe/Berlin per locale. */
  endDate: Date;
  /** Absolute resubscribe URL (e.g. `${siteUrl}/${locale}/membership`). */
  resubscribeUrl: string;
};

export type SubscriptionCancellationContent = {
  subject: string;
  text: string;
  html: string;
};

const SUPPORT_EMAIL = "support@unveiled.berlin";

/** App brand tokens for mail (mirrors the web theme: yellow page, dark ink). */
const BRAND_YELLOW = "#FAFF86";
const BRAND_INK = "#191919";
const FONT_STACK = 'Work Sans, -apple-system, "Segoe UI", Arial, sans-serif';

/** Locale-formatted Berlin date for the access-until line. */
export function formatCancellationEndDate(
  date: Date,
  locale: SubscriptionCancellationLocale,
): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    timeZone: "Europe/Berlin",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

type CancellationLinks = {
  resubscribe: string;
  billing: string;
};

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

type CancellationCopy = {
  preheader: string;
  brandLine: string;
  headline: string;
  greeting: string;
  accessLine: string;
  creditsLine: string;
  ticketsLine: string;
  resubscribeLabel: string;
  billingLabel: string;
  supportLabel: string;
};

function cancellationCopy(
  locale: SubscriptionCancellationLocale,
  endDateLabel: string,
): CancellationCopy {
  if (locale === "de") {
    return {
      preheader: `Deine Unveiled Berlin Mitgliedschaft endet am ${endDateLabel}.`,
      brandLine: "Unveiled Berlin",
      headline: "Deine Mitgliedschaft endet",
      greeting: `Deine Unveiled Berlin Mitgliedschaft endet am ${endDateLabel}.`,
      accessLine: `Du behältst bis dahin vollen Zugriff auf alle Events.`,
      creditsLine: `Ungenutzte Credits verfallen am ${endDateLabel}.`,
      ticketsLine: `Deine Tickets bleiben bis dahin gültig.`,
      resubscribeLabel: "Werde wieder Mitglied",
      billingLabel: "Abrechnung verwalten",
      supportLabel: "Support",
    };
  }

  return {
    preheader: `Your Unveiled Berlin membership is ending on ${endDateLabel}.`,
    brandLine: "Unveiled Berlin",
    headline: "Your membership is ending",
    greeting: `Your Unveiled Berlin membership is ending on ${endDateLabel}.`,
    accessLine: `You keep full access to all events until then.`,
    creditsLine: `Unused credits expire on ${endDateLabel}.`,
    ticketsLine: `Your tickets stay valid until then.`,
    resubscribeLabel: "Become a member again",
    billingLabel: "Manage billing",
    supportLabel: "Support",
  };
}

/**
 * Mail-client-safe branded HTML (tables + inline styles only, max-width 600,
 * no external CSS/JS/fonts). All interpolated values are escaped.
 */
function cancellationHtml(copy: CancellationCopy, links: CancellationLinks): string {
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
    `${escapeHtml(copy.accessLine)}<br/>${escapeHtml(copy.creditsLine)}<br/>${escapeHtml(copy.ticketsLine)}` +
    `</td></tr></table>` +
    `<p style="margin:0 0 16px 0;font-size:15px;line-height:22px;color:${BRAND_INK};"><a href="${escapeHtml(links.resubscribe)}" style="color:${BRAND_INK};font-weight:bold;text-decoration:underline;">${escapeHtml(copy.resubscribeLabel)}</a></p>` +
    `<p style="margin:0 0 16px 0;font-size:15px;line-height:22px;color:${BRAND_INK};">${escapeHtml(copy.billingLabel)}: ${linkHtml(links.billing)}</p>` +
    `<p style="margin:0;font-size:14px;line-height:20px;color:${BRAND_INK};">${escapeHtml(copy.supportLabel)}: <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_INK};text-decoration:underline;">${SUPPORT_EMAIL}</a></p>` +
    `</td></tr>` +
    `</table></td></tr></table>`
  );
}

/**
 * Scheduled-cancel unsubscribe content (DE + EN).
 *
 * Sent exactly once on the transition into `CANCELLED_PENDING`: states the
 * Berlin access-until date, that unused credits expire at period end, and that
 * tickets stay valid until end, with a resubscribe CTA. Subjects are fixed by
 * the subscription-emails step plan.
 */
export function buildSubscriptionCancellationContent(
  input: BuildSubscriptionCancellationInput,
): SubscriptionCancellationContent {
  const links: CancellationLinks = {
    resubscribe: input.resubscribeUrl,
    billing: `${input.siteUrl}/${input.locale}/profile/billing`,
  };
  const endDateLabel = formatCancellationEndDate(input.endDate, input.locale);
  const copy = cancellationCopy(input.locale, endDateLabel);

  if (input.locale === "de") {
    return {
      subject: "Deine Unveiled Berlin Mitgliedschaft endet",
      text: `Deine Unveiled Berlin Mitgliedschaft endet am ${endDateLabel}.

Du behältst bis dahin vollen Zugriff auf alle Events.
Ungenutzte Credits verfallen am ${endDateLabel}.
Deine Tickets bleiben bis dahin gültig.

Werde wieder Mitglied: ${links.resubscribe}
Abrechnung verwalten: ${links.billing}

Support: ${SUPPORT_EMAIL}`,
      html: cancellationHtml(copy, links),
    };
  }

  return {
    subject: "Your Unveiled Berlin membership is ending",
    text: `Your Unveiled Berlin membership is ending on ${endDateLabel}.

You keep full access to all events until then.
Unused credits expire on ${endDateLabel}.
Your tickets stay valid until then.

Become a member again: ${links.resubscribe}
Manage billing: ${links.billing}

Support: ${SUPPORT_EMAIL}`,
    html: cancellationHtml(copy, links),
  };
}
