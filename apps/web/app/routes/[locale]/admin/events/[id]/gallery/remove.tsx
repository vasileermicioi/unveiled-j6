import { getEventById, listEventGalleryImages, removeEventGalleryImages } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import type { AdminGalleryListItem } from "../../../../../../components/admin/AdminEventGalleryListPage";
import { AdminEventGalleryRemovePage } from "../../../../../../components/admin/AdminEventGalleryRemovePage";
import {
  adminEventGalleryPath,
  adminEventGalleryRemovePath,
} from "../../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../../lib/admin-content";
import { toAdminGalleryListItems } from "../../../../../../lib/admin-gallery";
import {
  type ParsedBody,
  parseGalleryImageIds,
  parseGalleryImageIdsFromQuery,
} from "../../../../../../lib/admin-prebuilt-image";
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

async function renderRemovePage(
  c: Context,
  options: {
    locale: Locale;
    eventId: string;
    eventTitle: string;
    images: AdminGalleryListItem[];
    defaultSelectedKeys?: string[];
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminEventGalleryRemovePage
      defaultSelectedKeys={options.defaultSelectedKeys}
      error={options.error}
      eventId={options.eventId}
      eventTitle={options.eventTitle}
      images={options.images}
      locale={options.locale}
    />,
    {
      locale: options.locale,
      title: copy.galleryRemoveTitle,
      subtitle: copy.gallerySubtitle(options.eventTitle),
      canonicalPath: adminEventGalleryRemovePath(options.locale, options.eventId),
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

  const rows = await listEventGalleryImages(db, eventId);
  const images = toAdminGalleryListItems(rows);
  const copy = getAdminCopy(guard.locale);
  const body = (await c.req.parseBody({ all: true })) as ParsedBody;
  const imageIds = parseGalleryImageIds(body, asString);

  if (imageIds.length === 0) {
    return renderRemovePage(c, {
      locale: guard.locale,
      eventId,
      eventTitle: event.title,
      images,
      error: copy.galleryRemoveSelectionRequired,
    });
  }

  try {
    await removeEventGalleryImages(db, eventId, imageIds);
    return c.redirect(adminEventGalleryPath(guard.locale, eventId), 302);
  } catch (error) {
    return renderRemovePage(c, {
      locale: guard.locale,
      eventId,
      eventTitle: event.title,
      images,
      defaultSelectedKeys: imageIds,
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

  const rows = await listEventGalleryImages(db, eventId);
  const images = toAdminGalleryListItems(rows);
  const queryIds = c.req.queries("imageIds") ?? [];
  const defaultSelectedKeys = parseGalleryImageIdsFromQuery(
    queryIds.length > 0 ? queryIds : c.req.query("imageIds"),
  );

  return renderRemovePage(c, {
    locale: guard.locale,
    eventId,
    eventTitle: event.title,
    images,
    defaultSelectedKeys,
  });
});
