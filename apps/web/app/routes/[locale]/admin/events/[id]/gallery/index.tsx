import { getEventById, listEventGalleryImages, reorderEventGalleryImages } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminEventGalleryListPage } from "../../../../../../components/admin/AdminEventGalleryListPage";
import { adminEventGalleryPath } from "../../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../../lib/admin-content";
import { toAdminGalleryListItems } from "../../../../../../lib/admin-gallery";
import { type ParsedBody, parseGalleryImageIds } from "../../../../../../lib/admin-prebuilt-image";
import { renderAdminPage } from "../../../../../../lib/admin-render";
import { guardAdminRoute, mapCatalogError } from "../../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../../lib/auth";
import type { Locale } from "../../../../../../lib/locale";

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

async function renderGalleryList(
  c: Context,
  options: {
    locale: Locale;
    eventId: string;
    eventTitle: string;
    error?: string | null;
  },
) {
  const { db } = getAuthOptions();
  const rows = await listEventGalleryImages(db, options.eventId);
  const images = toAdminGalleryListItems(rows);
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminEventGalleryListPage
      error={options.error}
      eventId={options.eventId}
      eventTitle={options.eventTitle}
      images={images}
      locale={options.locale}
    />,
    {
      locale: options.locale,
      title: copy.galleryTitle,
      subtitle: copy.gallerySubtitle(options.eventTitle),
      canonicalPath: adminEventGalleryPath(options.locale, options.eventId),
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const eventId = c.req.param("id");
  if (!eventId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const { db } = getAuthOptions();
  const event = await getEventById(db, eventId);
  if (!event) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const body = (await c.req.parseBody({ all: true })) as ParsedBody;
  const imageIds = parseGalleryImageIds(body, asString);

  try {
    await reorderEventGalleryImages(db, eventId, imageIds);
    return c.redirect(adminEventGalleryPath(guard.locale, eventId), 302);
  } catch (error) {
    return renderGalleryList(c, {
      locale: guard.locale,
      eventId,
      eventTitle: event.title,
      error: mapCatalogError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const eventId = c.req.param("id");
  if (!eventId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const { db } = getAuthOptions();
  const event = await getEventById(db, eventId);
  if (!event) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  return renderGalleryList(c, {
    locale: guard.locale,
    eventId,
    eventTitle: event.title,
  });
});
