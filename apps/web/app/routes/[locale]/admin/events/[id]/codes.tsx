import { exportRedemptionCodesCsv, getEventById } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { guardAdminRoute } from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";

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

  const csv = exportRedemptionCodesCsv(eventId);

  return c.body(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="event-${eventId}-codes.csv"`,
  });
});
