import { addFeaturedEvent, CatalogValidationError, searchEventsNotFeatured } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminFeaturedAddPage } from "../../../../components/admin/AdminFeaturedAddPage";
import { adminFeaturedAddPath, adminFeaturedPath } from "../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../lib/admin-content";
import { buildEventImageUrls } from "../../../../lib/admin-event-image-urls";
import type { AdminEventsListQuery } from "../../../../lib/admin-list";
import { buildAdminListQueryString, parseAdminEventsListQuery } from "../../../../lib/admin-list";
import { renderAdminPage } from "../../../../lib/admin-render";
import { guardAdminRoute, mapCatalogError } from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";
import type { Locale } from "../../../../lib/locale";

async function renderAddPage(
  c: Context,
  options: {
    locale: Locale;
    query: AdminEventsListQuery;
    error?: string | null;
  },
) {
  const { db } = getAuthOptions();
  const events = await searchEventsNotFeatured(db, {
    title: options.query.title || undefined,
    partner: options.query.partner || undefined,
    language: options.query.language || undefined,
    limit: 25,
    sort: options.query.sort,
    desc: options.query.dir === "desc",
  });
  const imageUrls = buildEventImageUrls(events);
  const copy = getAdminCopy(options.locale);
  const queryString = buildAdminListQueryString({
    title: options.query.title || undefined,
    partner: options.query.partner || undefined,
    language: options.query.language || undefined,
    sort: options.query.sort,
    dir: options.query.dir,
  });

  return renderAdminPage(
    c,
    <AdminFeaturedAddPage
      error={options.error}
      events={events}
      imageUrls={imageUrls}
      locale={options.locale}
      query={{
        title: options.query.title,
        partner: options.query.partner,
        language: options.query.language,
        sort: options.query.sort,
        dir: options.query.dir,
      }}
    />,
    {
      locale: options.locale,
      title: copy.featuredAddTitle,
      subtitle: copy.featuredAddSubtitle,
      canonicalPath: `${adminFeaturedAddPath(options.locale)}${queryString}`,
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
  const eventIdValue = body.eventId;
  const eventId = typeof eventIdValue === "string" ? eventIdValue.trim() : "";
  const emptyQuery: AdminEventsListQuery = {
    q: "",
    title: "",
    partner: "",
    language: "",
    page: 1,
    offset: 0,
    limit: 25,
  };

  if (!eventId) {
    return renderAddPage(c, {
      locale: guard.locale,
      query: emptyQuery,
      error: mapCatalogError(
        new CatalogValidationError("EVENT_NOT_FOUND", "Event id is required"),
        guard.locale,
      ),
    });
  }

  const { db } = getAuthOptions();
  try {
    await addFeaturedEvent(db, eventId);
    return c.redirect(adminFeaturedPath(guard.locale), 302);
  } catch (error) {
    return renderAddPage(c, {
      locale: guard.locale,
      query: emptyQuery,
      error: mapCatalogError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const query = parseAdminEventsListQuery(new URL(c.req.url));

  return renderAddPage(c, {
    locale: guard.locale,
    query,
  });
});
