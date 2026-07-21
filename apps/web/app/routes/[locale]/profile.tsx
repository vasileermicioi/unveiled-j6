import { createRoute } from "honox/factory";

import { ProfilePage } from "../../components/profile/ProfilePage";
import { getProfileCopy } from "../../lib/profile-content";
import { guardProfileRoute } from "../../lib/profile-route";

export default createRoute(async (c) => {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getProfileCopy(guard.locale);
  const { user } = guard.session;

  return c.render(<ProfilePage copy={copy} credits={user.credits} locale={guard.locale} />, {
    locale: guard.locale,
    title: copy.title,
    robots: "noindex",
    canonicalPath: `/${guard.locale}/profile`,
  });
});
