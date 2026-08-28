import {
  getEventById,
  listEventBookings,
  listEventsWithBookingStats,
  resolveEventCopy,
} from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminEventBookingsListPage } from "../../../../../../components/admin/AdminEventBookingsListPage";
import { adminEventBookingsPath } from "../../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../../lib/admin-render";
import {
  adminEventBookingsListPageRedirectPath,
  guardAdminRoute,
  parseAdminEventBookingsListQuery,
} from "../../../../../../lib/admin-route";
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

  const listQuery = parseAdminEventBookingsListQuery(new URL(c.req.url));
  const [{ items, total }, statsResult] = await Promise.all([
    listEventBookings(db, {
      eventId,
      status: listQuery.status,
      page: listQuery.page,
      limit: listQuery.limit,
    }),
    listEventsWithBookingStats(db, { eventId, page: 1, limit: 1 }),
  ]);

  const listPath = adminEventBookingsPath(guard.locale, eventId);
  const redirectPath = adminEventBookingsListPageRedirectPath(listPath, listQuery, total);
  if (redirectPath) {
    return c.redirect(redirectPath, 302);
  }

  const copy = getAdminCopy(guard.locale);
  const eventTitle = resolveEventCopy(event, guard.locale).title;
  const confirmedCount = statsResult.items[0]?.confirmedCount ?? 0;
  const okParam = new URL(c.req.url).searchParams.get("ok");
  const successMessage = okParam === "cancel-all" ? copy.okCancelAll : null;

  return renderAdminPage(
    c,
    <AdminEventBookingsListPage
      confirmedCount={confirmedCount}
      eventId={eventId}
      eventTitle={eventTitle}
      items={items}
      locale={guard.locale}
      page={listQuery.page}
      pageSize={listQuery.limit}
      status={listQuery.status}
      successMessage={successMessage}
      total={total}
    />,
    {
      locale: guard.locale,
      title: copy.eventBookingsTitle,
      subtitle: eventTitle,
      canonicalPath: listPath,
    },
  );
});
