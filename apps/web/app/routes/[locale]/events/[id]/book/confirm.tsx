import { bookings, createDb, eq, getPublicEventById } from "@unveiled/db";
import { buildEventIcs } from "@unveiled/email";
import { createRoute } from "honox/factory";

import { BookConfirmPage } from "../../../../../components/booking/BookConfirmPage";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getSessionIfConfigured } from "../../../../../lib/auth";
import { getBookConfirmCopy } from "../../../../../lib/booking-content";
import { getCatalogDb } from "../../../../../lib/catalog-db";
import type { Locale } from "../../../../../lib/locale";
import { isValidLocale } from "../../../../../lib/locale";
import { resolveEnvVarFromContext } from "../../../../../lib/runtime-env";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const eventId = c.req.param("id");
  const copy = getBookConfirmCopy(locale);
  const url = new URL(c.req.url);
  const bookingId = url.searchParams.get("booking");
  const downloadIcs = url.searchParams.get("download") === "ics";
  const confirmPath = `/${locale}/events/${eventId}/book/confirm`;

  if (!eventId || !bookingId) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  const session = await getSessionIfConfigured(c);
  if (!session?.user) {
    return c.redirect(
      `/${locale}/login?returnTo=${encodeURIComponent(`${confirmPath}?booking=${bookingId}`)}`,
      302,
    );
  }

  const databaseUrl = resolveEnvVarFromContext(c, "DATABASE_URL");
  const catalogDb = getCatalogDb();
  if (!databaseUrl || !catalogDb) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  const event = await getPublicEventById(catalogDb, eventId);
  if (!event) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  const db = createDb(databaseUrl);
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
  });

  if (!booking || booking.userId !== session.user.id || booking.eventId !== eventId) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  if (downloadIcs) {
    const ics = buildEventIcs({
      event: {
        id: event.id,
        title: event.title,
        address: event.address,
        dateTime: event.dateTime,
        partnerName: event.partnerName,
      },
      bookingId: booking.id,
    });
    return c.body(ics, 200, {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="unveiled-${event.id}.ics"`,
    });
  }

  const icsHref = `${confirmPath}?booking=${encodeURIComponent(booking.id)}&download=ics`;

  return c.render(
    <BookConfirmPage
      booking={booking}
      copy={copy}
      event={event}
      icsHref={icsHref}
      locale={locale}
    />,
    {
      locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: `${confirmPath}?booking=${booking.id}`,
    },
  );
});
