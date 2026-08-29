import { type Event, getEventById } from "@unveiled/db";
import type { Context } from "hono";

import { notFoundAdmin } from "./admin-publish-http";
import { guardAdminRoute } from "./admin-route";
import { getAuthOptions } from "./auth";
import type { Locale } from "./locale";

export type AdminEventPreviewLoad =
  | { ok: false; response: Response }
  | { ok: true; locale: Locale; event: Event };

export async function loadAdminEventPreview(c: Context): Promise<AdminEventPreviewLoad> {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return { ok: false, response: guard.response };
  }

  const eventId = c.req.param("id");
  if (!eventId) {
    return { ok: false, response: await notFoundAdmin(c, guard.locale) };
  }

  const { db } = getAuthOptions();
  const event = await getEventById(db, eventId);
  if (!event) {
    return { ok: false, response: await notFoundAdmin(c, guard.locale) };
  }

  return { ok: true, locale: guard.locale, event };
}
