import { listFeaturedEventIds } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import {
  adminFeaturedPath,
  adminFeaturedRemovePath,
} from "../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { guardAdminRoute } from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";

async function redirectLegacyRemove(c: Context) {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const eventId = c.req.param("eventId");
  if (!eventId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const { db } = getAuthOptions();
  const featuredIds = await listFeaturedEventIds(db);
  if (featuredIds.includes(eventId)) {
    return c.redirect(adminFeaturedRemovePath(guard.locale, [eventId]), 302);
  }

  return c.redirect(adminFeaturedPath(guard.locale), 302);
}

export const POST = createRoute(async (c) => redirectLegacyRemove(c));

export default createRoute(async (c) => redirectLegacyRemove(c));
