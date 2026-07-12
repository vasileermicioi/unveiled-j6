import { createCheckoutSession, createStripeClient } from "@unveiled/billing";
import type { Subscription } from "@unveiled/db";
import { createRoute } from "honox/factory";

import {
  MembershipInfoPage,
  type MembershipViewState,
} from "../../components/marketing/MembershipInfoPage";
import { getAuthOptions, getSessionIfConfigured } from "../../lib/auth";
import { getPageContent } from "../../lib/content";
import { getCopy } from "../../lib/copy";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { resolveEnvVarFromContext } from "../../lib/runtime-env";
import { membershipPageMeta } from "../../lib/seo";
import { getSiteUrl } from "../../lib/site-config";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

function membershipViewFromSubscription(
  subscription: Subscription | null | undefined,
  signedIn: boolean,
): MembershipViewState {
  if (!signedIn) {
    return "guest";
  }
  if (!subscription) {
    return "checkout";
  }
  if (subscription.status === "UNPAID") {
    return "frozen";
  }
  if (subscription.status === "ACTIVE" || subscription.status === "CANCELLED_PENDING") {
    return "active";
  }
  return "checkout";
}

export const POST = createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const content = getPageContent(locale, "membership");
  const copy = getCopy(locale);
  const pathname = new URL(c.req.url).pathname;
  const meta = membershipPageMeta(content, copy.nav.membership);

  const session = await getSessionIfConfigured(c);
  if (!session?.user) {
    return c.redirect(`/${locale}/login`, 302);
  }

  const { db } = getAuthOptions();
  const userId = session.user.id;
  const subscription = await db.query.subscriptions.findFirst({
    where: (fields, { eq }) => eq(fields.userId, userId),
  });

  if (subscription?.status === "UNPAID") {
    return c.render(<MembershipInfoPage content={content} locale={locale} view="frozen" />, {
      locale,
      title: meta.title,
      description: meta.description,
      canonicalPath: pathname,
    });
  }

  if (subscription?.status === "ACTIVE" || subscription?.status === "CANCELLED_PENDING") {
    return c.redirect(`/${locale}/events`, 302);
  }

  const secretKey = resolveEnvVarFromContext(c, "STRIPE_SECRET_KEY");
  const priceId = resolveEnvVarFromContext(c, "STRIPE_PRICE_ID_BASIC_BERLIN");
  if (!secretKey || !priceId) {
    return c.render(
      <MembershipInfoPage
        content={content}
        errorMessage={content.checkoutError}
        locale={locale}
        view="error"
      />,
      {
        locale,
        title: meta.title,
        description: meta.description,
        canonicalPath: pathname,
      },
    );
  }

  const siteUrl = getSiteUrl();
  const stripe = createStripeClient(secretKey);

  try {
    const checkoutSession = await createCheckoutSession({
      stripe,
      priceId,
      userId,
      customerEmail: session.user.email,
      stripeCustomerId: subscription?.stripeCustomerId,
      successUrl: `${siteUrl}/${locale}/events?checkout=success`,
      cancelUrl: `${siteUrl}/${locale}/membership?checkout=cancelled`,
    });

    if (!checkoutSession.url) {
      throw new Error("Checkout Session missing URL");
    }

    return c.redirect(checkoutSession.url, 302);
  } catch (error) {
    console.error("createCheckoutSession failed", error);
    return c.render(
      <MembershipInfoPage
        content={content}
        errorMessage={content.checkoutError}
        locale={locale}
        view="error"
      />,
      {
        locale,
        title: meta.title,
        description: meta.description,
        canonicalPath: pathname,
      },
    );
  }
});

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const content = getPageContent(locale, "membership");
  const copy = getCopy(locale);
  const pathname = new URL(c.req.url).pathname;
  const meta = membershipPageMeta(content, copy.nav.membership);

  const session = await getSessionIfConfigured(c);
  let subscription: Subscription | null | undefined;
  if (session?.user) {
    const { db } = getAuthOptions();
    subscription = await db.query.subscriptions.findFirst({
      where: (fields, { eq }) => eq(fields.userId, session.user.id),
    });
  }

  const cancelled = new URL(c.req.url).searchParams.get("checkout") === "cancelled";
  const view = membershipViewFromSubscription(subscription, Boolean(session?.user));

  return c.render(
    <MembershipInfoPage
      content={content}
      errorMessage={cancelled && view === "checkout" ? content.errorSubtitle : null}
      locale={locale}
      view={view}
    />,
    {
      locale,
      title: meta.title,
      description: meta.description,
      canonicalPath: pathname,
    },
  );
});
