import {
  addEventGalleryImages,
  countEventGalleryImages,
  getEventById,
  MAX_EVENT_GALLERY_IMAGES,
} from "@unveiled/db";
import { deleteImageRecord, persistPrebuiltImage } from "@unveiled/db/catalog/images";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminEventGalleryAddPage } from "../../../../../../components/admin/AdminEventGalleryAddPage";
import {
  adminEventGalleryAddPath,
  adminEventGalleryPath,
} from "../../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../../lib/admin-content";
import {
  type ParsedBody,
  parsePrebuiltImageVariantSets,
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

function isUploadBlob(value: unknown): value is File | Blob {
  return value instanceof File || value instanceof Blob;
}

function asFile(value: string | File | (string | File)[] | undefined): File | Blob | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return isUploadBlob(first) ? first : undefined;
  }
  return isUploadBlob(value) ? value : undefined;
}

async function renderAddPage(
  c: Context,
  options: {
    locale: Locale;
    eventId: string;
    eventTitle: string;
    remainingSlots: number;
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminEventGalleryAddPage
      error={options.error}
      eventId={options.eventId}
      eventTitle={options.eventTitle}
      locale={options.locale}
      remainingSlots={options.remainingSlots}
    />,
    {
      locale: options.locale,
      title: copy.galleryAddTitle,
      subtitle: copy.gallerySubtitle(options.eventTitle),
      canonicalPath: adminEventGalleryAddPath(options.locale, options.eventId),
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

  const currentCount = await countEventGalleryImages(db, eventId);
  const remainingSlots = Math.max(0, MAX_EVENT_GALLERY_IMAGES - currentCount);
  const copy = getAdminCopy(guard.locale);

  const body = (await c.req.parseBody({ all: true })) as ParsedBody;
  const sets = await parsePrebuiltImageVariantSets(body, asString, asFile);

  if (sets.length === 0) {
    return renderAddPage(c, {
      locale: guard.locale,
      eventId,
      eventTitle: event.title,
      remainingSlots,
      error: copy.galleryAddRequired,
    });
  }

  const persistedIds: string[] = [];
  try {
    for (const input of sets) {
      const imageId = await persistPrebuiltImage(db, input, {
        uploadedBy: guard.session.user.id,
      });
      persistedIds.push(imageId);
    }

    await addEventGalleryImages(db, eventId, persistedIds);
    return c.redirect(adminEventGalleryPath(guard.locale, eventId), 302);
  } catch (error) {
    for (const imageId of persistedIds) {
      try {
        await deleteImageRecord(db, imageId);
      } catch {
        // Best-effort orphan cleanup after failed gallery attach.
      }
    }

    return renderAddPage(c, {
      locale: guard.locale,
      eventId,
      eventTitle: event.title,
      remainingSlots,
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

  const currentCount = await countEventGalleryImages(db, eventId);
  const remainingSlots = Math.max(0, MAX_EVENT_GALLERY_IMAGES - currentCount);

  return renderAddPage(c, {
    locale: guard.locale,
    eventId,
    eventTitle: event.title,
    remainingSlots,
  });
});
