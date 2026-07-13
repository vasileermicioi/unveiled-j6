import { isGdprError } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../../components/NotFoundPage";
import { DataExportPage } from "../../../components/profile/DataExportPage";
import { getGdprMemberCopy } from "../../../lib/gdpr-content";
import { buildExportDownloadResponse } from "../../../lib/gdpr-route";
import { guardProfileRoute } from "../../../lib/profile-route";

export default createRoute(async (c) => {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const download = new URL(c.req.url).searchParams.get("download");
  if (download === "1") {
    try {
      return await buildExportDownloadResponse(guard.session.user.id);
    } catch (error) {
      if (isGdprError(error)) {
        c.status(404);
        return c.render(<NotFoundPage locale={guard.locale} />, {
          locale: guard.locale,
          robots: "noindex",
          title: "Not Found — Unveiled Berlin",
        });
      }
      throw error;
    }
  }

  const copy = getGdprMemberCopy(guard.locale);
  return c.render(<DataExportPage copy={copy} locale={guard.locale} />, {
    locale: guard.locale,
    title: copy.exportTitle,
    robots: "noindex",
    canonicalPath: `/${guard.locale}/profile/data-export`,
  });
});
