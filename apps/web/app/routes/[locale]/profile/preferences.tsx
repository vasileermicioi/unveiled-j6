import { createRoute } from "honox/factory";

import { PreferencesPage } from "../../../components/profile/PreferencesPage";
import { getProfileCopy } from "../../../lib/profile-content";
import { guardProfileRoute, handleProfilePreferencesPost } from "../../../lib/profile-route";

export const POST = createRoute(async (c) => {
  const result = await handleProfilePreferencesPost(c);

  if (result instanceof Response) {
    return result;
  }

  if (result.kind === "redirect") {
    return c.redirect(result.location, 302);
  }

  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getProfileCopy(guard.locale);

  return c.render(
    <PreferencesPage
      copy={copy}
      error={result.message}
      locale={guard.locale}
      profile={guard.session.user.profile}
    />,
    {
      locale: guard.locale,
      title: copy.preferencesTitle,
      robots: "noindex",
      canonicalPath: `/${guard.locale}/profile/preferences`,
    },
  );
});

export default createRoute(async (c) => {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getProfileCopy(guard.locale);
  const saved = c.req.query("saved") === "1" ? copy.successPreferences : null;

  return c.render(
    <PreferencesPage
      copy={copy}
      locale={guard.locale}
      profile={guard.session.user.profile}
      success={saved}
    />,
    {
      locale: guard.locale,
      title: copy.preferencesTitle,
      robots: "noindex",
      canonicalPath: `/${guard.locale}/profile/preferences`,
    },
  );
});
