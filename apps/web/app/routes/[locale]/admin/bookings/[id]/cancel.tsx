import { bookings, cancelBookingAsAdmin, eq, getEventById } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";
import { AdminCancelBookingPage } from "../../../../../components/admin/AdminCancelBookingPage";
import {
  adminBookingCancelPath,
  adminUserDetailPath,
} from "../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import { guardAdminRoute, mapAdminOpsError, withAdminTxDb } from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

function asString(value: string | File | (string | File)[] | undefined): string {
  if (value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : "";
  }
  return typeof value === "string" ? value : "";
}

async function loadBooking(bookingId: string) {
  const { db } = getAuthOptions();
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
  });
  if (!booking) {
    return null;
  }

  const event = await getEventById(db, booking.eventId);
  return {
    booking,
    eventTitle: event?.title ?? booking.eventId,
  };
}

function renderPage(
  c: Context,
  options: {
    locale: Locale;
    booking: NonNullable<Awaited<ReturnType<typeof loadBooking>>>["booking"];
    eventTitle: string;
    error?: string | null;
    defaultReason?: string;
  },
) {
  const copy = getAdminCopy(options.locale);
  return renderAdminPage(
    c,
    <AdminCancelBookingPage
      action={adminBookingCancelPath(options.locale, options.booking.id)}
      booking={options.booking}
      defaultReason={options.defaultReason}
      error={options.error}
      eventTitle={options.eventTitle}
      locale={options.locale}
    />,
    {
      locale: options.locale,
      title: copy.cancelBookingTitle,
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const bookingId = c.req.param("id");
  if (!bookingId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const loaded = await loadBooking(bookingId);
  if (!loaded) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
  const reason = asString(body.reason);

  try {
    await withAdminTxDb(c, async (txDb) => {
      await cancelBookingAsAdmin(txDb, {
        bookingId,
        reason,
        adminUserId: guard.session.user.id,
      });
    });
    return c.redirect(
      `${adminUserDetailPath(guard.locale, loaded.booking.userId)}?ok=cancel-booking`,
      302,
    );
  } catch (error) {
    return renderPage(c, {
      locale: guard.locale,
      booking: loaded.booking,
      eventTitle: loaded.eventTitle,
      error: mapAdminOpsError(error, guard.locale),
      defaultReason: reason,
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const bookingId = c.req.param("id");
  if (!bookingId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const loaded = await loadBooking(bookingId);
  if (!loaded) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  return renderPage(c, {
    locale: guard.locale,
    booking: loaded.booking,
    eventTitle: loaded.eventTitle,
  });
});
