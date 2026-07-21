import { createRoute } from "honox/factory";

import { ProfileDetailsPage } from "../../../components/profile/ProfileDetailsPage";
import { getProfileCopy } from "../../../lib/profile-content";
import { guardProfileRoute, handleProfileIdentityPost } from "../../../lib/profile-route";

export const POST = createRoute(async (c) => {
  const result = await handleProfileIdentityPost(c);

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
  const { user } = guard.session;

  return c.render(
    <ProfileDetailsPage
      copy={copy}
      email={result.values.email || user.email}
      error={result.message}
      firstName={result.values.first_name || (user.profile.first_name ?? "")}
      lastName={result.values.last_name || (user.profile.last_name ?? "")}
      locale={guard.locale}
    />,
    {
      locale: guard.locale,
      title: copy.identityTitle,
      robots: "noindex",
      canonicalPath: `/${guard.locale}/profile/details`,
    },
  );
});

export default createRoute(async (c) => {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getProfileCopy(guard.locale);
  const { user } = guard.session;
  const saved = c.req.query("saved") === "identity" ? copy.successIdentity : null;

  return c.render(
    <ProfileDetailsPage
      copy={copy}
      email={user.email}
      firstName={user.profile.first_name ?? ""}
      lastName={user.profile.last_name ?? ""}
      locale={guard.locale}
      success={saved}
    />,
    {
      locale: guard.locale,
      title: copy.identityTitle,
      robots: "noindex",
      canonicalPath: `/${guard.locale}/profile/details`,
    },
  );
});
