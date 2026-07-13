import { createRoute } from "honox/factory";

import { DeleteAccountPage } from "../../../components/profile/DeleteAccountPage";
import { getGdprMemberCopy } from "../../../lib/gdpr-content";
import { handleMemberDeleteAccountPost, redirectWithClearedSession } from "../../../lib/gdpr-route";
import { guardProfileRoute } from "../../../lib/profile-route";

export const POST = createRoute(async (c) => {
  const result = await handleMemberDeleteAccountPost(c);

  if (result instanceof Response) {
    return result;
  }

  if (result.kind === "redirect") {
    return redirectWithClearedSession(result.location, result.setCookies);
  }

  const copy = getGdprMemberCopy(result.locale);
  const rendered = await c.render(
    <DeleteAccountPage copy={copy} error={result.message} locale={result.locale} />,
    {
      locale: result.locale,
      title: copy.deleteTitle,
      robots: "noindex",
      canonicalPath: `/${result.locale}/profile/delete-account`,
    },
  );

  if (result.setCookies?.length && rendered instanceof Response) {
    for (const cookie of result.setCookies) {
      rendered.headers.append("Set-Cookie", cookie);
    }
  }

  return rendered;
});

export default createRoute(async (c) => {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getGdprMemberCopy(guard.locale);
  return c.render(<DeleteAccountPage copy={copy} locale={guard.locale} />, {
    locale: guard.locale,
    title: copy.deleteTitle,
    robots: "noindex",
    canonicalPath: `/${guard.locale}/profile/delete-account`,
  });
});
