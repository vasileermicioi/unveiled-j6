import { listFeaturedEvents, reorderFeaturedEvents } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminFeaturedListPage } from "../../../../components/admin/AdminFeaturedListPage";
import { adminFeaturedPath } from "../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../lib/admin-content";
import { buildEventImageUrls } from "../../../../lib/admin-event-image-urls";
import { type ParsedBody, parseFeaturedEventIds } from "../../../../lib/admin-prebuilt-image";
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

async function renderList(
  c: Context,
  options: {
    locale: Locale;
    error?: string | null;
    successMessage?: string | null;
  },
) {
  const { db } = getAuthOptions();
  const events = await listFeaturedEvents(db);
  const copy = getAdminCopy(options.locale);
  const listPath = adminFeaturedPath(options.locale);

  return renderAdminPage(
    c,
    <AdminFeaturedListPage
      error={options.error}
      events={events}
      imageUrls={buildEventImageUrls(events)}
      locale={options.locale}
      successMessage={options.successMessage}
    />,
    {
      locale: options.locale,
      title: copy.featuredTitle,
      subtitle: copy.featuredSubtitle,
      canonicalPath: listPath,
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const body = (await c.req.parseBody({ all: true })) as ParsedBody;
  const eventIds = parseFeaturedEventIds(body, asString);

  try {
    await reorderFeaturedEvents(db, eventIds);
    return c.redirect(adminFeaturedPath(guard.locale), 302);
  } catch (error) {
    return renderList(c, {
      locale: guard.locale,
      error: mapCatalogError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const ok = new URL(c.req.url).searchParams.get("ok");
  const copy = getAdminCopy(guard.locale);
  const successMessage =
    ok === "publish" ? copy.okPublish : ok === "unpublish" ? copy.okUnpublish : null;

  return renderList(c, { locale: guard.locale, successMessage });
});
