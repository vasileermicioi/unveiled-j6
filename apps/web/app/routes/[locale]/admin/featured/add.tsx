import { addFeaturedEvent, CatalogValidationError, searchEventsNotFeatured } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminFeaturedAddPage } from "../../../../components/admin/AdminFeaturedAddPage";
import { adminFeaturedAddPath, adminFeaturedPath } from "../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import { guardAdminRoute, mapCatalogError } from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";
import type { Locale } from "../../../../lib/locale";

async function renderAddPage(
  c: Context,
  options: {
    locale: Locale;
    query: string;
    error?: string | null;
  },
) {
  const { db } = getAuthOptions();
  const events = await searchEventsNotFeatured(db, {
    q: options.query || undefined,
    limit: 25,
  });
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminFeaturedAddPage
      error={options.error}
      events={events}
      locale={options.locale}
      query={options.query}
    />,
    {
      locale: options.locale,
      title: copy.featuredAddTitle,
      subtitle: copy.featuredAddSubtitle,
      canonicalPath: adminFeaturedAddPath(options.locale),
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

  if (!eventId) {
    return renderAddPage(c, {
      locale: guard.locale,
      query: "",
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
      query: "",
      error: mapCatalogError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(c.req.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  return renderAddPage(c, {
    locale: guard.locale,
    query,
  });
});
