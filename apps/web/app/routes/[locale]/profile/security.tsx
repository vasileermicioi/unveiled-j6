import { createRoute } from "honox/factory";

import { SecurityPage } from "../../../components/profile/SecurityPage";
import { getProfileCopy } from "../../../lib/profile-content";
import { guardProfileRoute } from "../../../lib/profile-route";

export default createRoute(async (c) => {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getProfileCopy(guard.locale);

  return c.render(<SecurityPage copy={copy} locale={guard.locale} />, {
    locale: guard.locale,
    title: copy.securityTitle,
    robots: "noindex",
    canonicalPath: `/${guard.locale}/profile/security`,
  });
});
