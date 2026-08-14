import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../../../../../components/NotFoundPage";
import {
  getEventEditWizard,
  postEventEditWizard,
} from "../../../../../../lib/admin-event-wizard-http";
import { guardAdminRoute } from "../../../../../../lib/admin-route";

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

  return postEventEditWizard(c, guard.locale, eventId, guard.session.user.id);
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

  return getEventEditWizard(c, guard.locale, eventId, 1);
});
