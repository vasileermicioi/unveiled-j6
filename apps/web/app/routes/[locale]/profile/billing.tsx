import { createRoute } from "honox/factory";

import { BillingPage } from "../../../components/profile/BillingPage";
import { getBillingCopy } from "../../../lib/billing-content";
import { handleBillingPortalPost, loadUserSubscription } from "../../../lib/billing-route";
import { guardProfileRoute } from "../../../lib/profile-route";

export const POST = createRoute(async (c) => {
  const body = await c.req.parseBody();
  const intent = typeof body.intent === "string" ? body.intent : "";

  if (intent !== "portal") {
    const guard = await guardProfileRoute(c);
    if (!guard.ok) {
      return guard.response;
    }
    return c.redirect(`/${guard.locale}/profile/billing`, 302);
  }

  const result = await handleBillingPortalPost(c);

  if (result instanceof Response) {
    return result;
  }

  if (result.kind === "redirect") {
    return c.redirect(result.location, 302);
  }

  const copy = getBillingCopy(result.locale);

  return c.render(
    <BillingPage
      copy={copy}
      error={result.message}
      locale={result.locale}
      subscription={result.subscription}
    />,
    {
      locale: result.locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: `/${result.locale}/profile/billing`,
    },
  );
});

export default createRoute(async (c) => {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getBillingCopy(guard.locale);
  const subscription = await loadUserSubscription(guard.session.user.id);
  const cancelled = c.req.query("cancelled") === "1" ? copy.successCancelled : null;

  return c.render(
    <BillingPage
      copy={copy}
      locale={guard.locale}
      subscription={subscription}
      success={cancelled}
    />,
    {
      locale: guard.locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: `/${guard.locale}/profile/billing`,
    },
  );
});
