import { createRoute } from "honox/factory";

import { BillingCancelPage } from "../../../../components/profile/BillingCancelPage";
import { getBillingCopy } from "../../../../lib/billing-content";
import { handleBillingCancelPost, loadUserSubscription } from "../../../../lib/billing-route";
import { guardProfileRoute } from "../../../../lib/profile-route";

export const POST = createRoute(async (c) => {
  const result = await handleBillingCancelPost(c);

  if (result instanceof Response) {
    return result;
  }

  if (result.kind === "redirect") {
    return c.redirect(result.location, 302);
  }

  const copy = getBillingCopy(result.locale);

  return c.render(<BillingCancelPage copy={copy} error={result.message} locale={result.locale} />, {
    locale: result.locale,
    title: copy.cancelPageTitle,
    robots: "noindex",
    canonicalPath: `/${result.locale}/profile/billing/cancel`,
  });
});

export default createRoute(async (c) => {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getBillingCopy(guard.locale);
  const subscription = await loadUserSubscription(guard.session.user.id);

  if (subscription?.status !== "ACTIVE" || !subscription.stripeSubscriptionId) {
    return c.redirect(`/${guard.locale}/profile/billing`, 302);
  }

  return c.render(<BillingCancelPage copy={copy} locale={guard.locale} />, {
    locale: guard.locale,
    title: copy.cancelPageTitle,
    robots: "noindex",
    canonicalPath: `/${guard.locale}/profile/billing/cancel`,
  });
});
