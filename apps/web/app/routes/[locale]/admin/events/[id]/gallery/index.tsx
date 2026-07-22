import { getEventById, listEventGalleryImages } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminEventGalleryListPage } from "../../../../../../components/admin/AdminEventGalleryListPage";
import { adminEventGalleryPath } from "../../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../../lib/admin-content";
import { toAdminGalleryListItems } from "../../../../../../lib/admin-gallery";
import { renderAdminPage } from "../../../../../../lib/admin-render";
import { guardAdminRoute } from "../../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../../lib/auth";

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
  const copy = getAdminCopy(guard.locale);

  return renderAdminPage(
    c,
    <AdminEventGalleryListPage
      eventId={eventId}
      eventTitle={event.title}
      images={images}
      locale={guard.locale}
    />,
    {
      locale: guard.locale,
      title: copy.galleryTitle,
      subtitle: copy.gallerySubtitle(event.title),
      canonicalPath: adminEventGalleryPath(guard.locale, eventId),
    },
  );
});
