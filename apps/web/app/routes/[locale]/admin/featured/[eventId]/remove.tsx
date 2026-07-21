import { getEventById, removeFeaturedEvent } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminFeaturedRemovePage } from "../../../../../components/admin/AdminFeaturedRemovePage";
import { adminFeaturedPath } from "../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import {
  formatEventDateTime,
  guardAdminRoute,
  mapCatalogError,
} from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

function renderRemovePage(
  c: Context,
  options: {
    locale: Locale;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminFeaturedRemovePage
      error={options.error}
      eventDate={options.eventDate}
      eventId={options.eventId}
      eventTitle={options.eventTitle}
      locale={options.locale}
    />,
    {
      locale: options.locale,
      title: copy.featuredRemoveTitle,
    },
  );
}

export const POST = createRoute(async (c) => {
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
  try {
    await removeFeaturedEvent(db, eventId);
    return c.redirect(adminFeaturedPath(guard.locale), 302);
  } catch (error) {
    const existing = await getEventById(db, eventId);
    if (!existing) {
      return c.redirect(adminFeaturedPath(guard.locale), 302);
    }

    return renderRemovePage(c, {
      locale: guard.locale,
      eventId,
      eventTitle: existing.title,
      eventDate: formatEventDateTime(existing.dateTime, guard.locale),
      error: mapCatalogError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
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
  const event = await getEventById(db, eventId);
  if (!event) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  return renderRemovePage(c, {
    locale: guard.locale,
    eventId,
    eventTitle: event.title,
    eventDate: formatEventDateTime(event.dateTime, guard.locale),
  });
});
