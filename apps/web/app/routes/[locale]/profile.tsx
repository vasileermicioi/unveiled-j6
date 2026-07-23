import { createRoute } from "honox/factory";

import { ProfilePage } from "../../components/profile/ProfilePage";
import { handleBillingPortalPost, loadUserSubscription } from "../../lib/billing-route";
import { getProfileCopy } from "../../lib/profile-content";
import { guardProfileRoute } from "../../lib/profile-route";

export const POST = createRoute(async (c) => {
  const body = await c.req.parseBody();
  const intent = typeof body.intent === "string" ? body.intent : "";

  if (intent !== "portal") {
    const guard = await guardProfileRoute(c);
    if (!guard.ok) {
      return guard.response;
    }
    return c.redirect(`/${guard.locale}/profile`, 302);
  }

  const result = await handleBillingPortalPost(c, { returnPath: "profile" });

  if (result instanceof Response) {
    return result;
  }

  if (result.kind === "redirect") {
    return c.redirect(result.location, 302);
  }

  const copy = getProfileCopy(result.locale);

  return c.render(
    <ProfilePage
      copy={copy}
      error={result.message}
      locale={result.locale}
      subscription={result.subscription}
    />,
    {
      locale: result.locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: `/${result.locale}/profile`,
    },
  );
});

export default createRoute(async (c) => {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getProfileCopy(guard.locale);
  const subscription = await loadUserSubscription(guard.session.user.id);

  return c.render(<ProfilePage copy={copy} locale={guard.locale} subscription={subscription} />, {
    locale: guard.locale,
    title: copy.title,
    robots: "noindex",
    canonicalPath: `/${guard.locale}/profile`,
  });
});
