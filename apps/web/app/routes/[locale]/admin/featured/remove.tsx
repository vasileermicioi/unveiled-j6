import { listFeaturedEvents, removeFeaturedEvents } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminFeaturedRemovePage } from "../../../../components/admin/AdminFeaturedRemovePage";
import {
  adminFeaturedPath,
  adminFeaturedRemovePath,
} from "../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../lib/admin-content";
import { buildEventImageUrls } from "../../../../lib/admin-event-image-urls";
import {
  type ParsedBody,
  parseFeaturedEventIds,
  parseFeaturedEventIdsFromQuery,
} from "../../../../lib/admin-prebuilt-image";
import { renderAdminPage } from "../../../../lib/admin-render";
import { guardAdminRoute, mapCatalogError } from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";
import type { Locale } from "../../../../lib/locale";

function asString(value: string | File | (string | File)[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

async function renderRemovePage(
  c: Context,
  options: {
    locale: Locale;
    selectedEventIds: string[];
    error?: string | null;
  },
) {
  const { db } = getAuthOptions();
  const events = await listFeaturedEvents(db);
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminFeaturedRemovePage
      error={options.error}
      events={events}
      imageUrls={buildEventImageUrls(events)}
      locale={options.locale}
      selectedEventIds={options.selectedEventIds}
    />,
    {
      locale: options.locale,
      title: copy.featuredRemoveTitle,
      canonicalPath: adminFeaturedRemovePath(options.locale),
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const body = (await c.req.parseBody({ all: true })) as ParsedBody;
  const eventIds = parseFeaturedEventIds(body, asString);

  if (eventIds.length === 0) {
    return c.redirect(adminFeaturedPath(guard.locale), 302);
  }

  const { db } = getAuthOptions();
  try {
    await removeFeaturedEvents(db, eventIds);
    return c.redirect(adminFeaturedPath(guard.locale), 302);
  } catch (error) {
    return renderRemovePage(c, {
      locale: guard.locale,
      selectedEventIds: eventIds,
      error: mapCatalogError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const events = await listFeaturedEvents(db);
  const queryIds = c.req.queries("eventIds") ?? [];
  const selectedEventIds = parseFeaturedEventIdsFromQuery(
    queryIds.length > 0 ? queryIds : c.req.query("eventIds"),
  ).filter((eventId) => events.some((event) => event.id === eventId));

  if (selectedEventIds.length === 0) {
    return c.redirect(adminFeaturedPath(guard.locale), 302);
  }

  return renderRemovePage(c, {
    locale: guard.locale,
    selectedEventIds,
  });
});
