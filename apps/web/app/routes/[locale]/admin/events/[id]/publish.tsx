import { getEventById, setEventPublished } from "@unveiled/db";

import { adminEventPublishPath, adminEventsPath } from "../../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { createAdminPublishRoute } from "../../../../../lib/admin-publish-http";
import { formatEventDateTime } from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";

const routes = createAdminPublishRoute({
  load: async (c, _locale) => {
    const eventId = c.req.param("id");
    if (!eventId) {
      return { ok: false, missing: true };
    }
    const { db } = getAuthOptions();
    const event = await getEventById(db, eventId);
    if (!event) {
      return { ok: false, missing: true };
    }
    return { ok: true, resource: event };
  },
  page: (event, locale, error) => {
    const copy = getAdminCopy(locale);
    return {
      locale,
      breadcrumbs: [
        { label: copy.eventsTitle, href: adminEventsPath(locale) },
        { label: copy.publishEventTitle },
      ],
      copy: {
        title: copy.publishEventTitle,
        body: copy.publishEventBody(event.title, formatEventDateTime(event.dateTime, locale)),
        submitLabel: copy.publishConfirm,
      },
      action: adminEventPublishPath(locale, event.id),
      cancelHref: adminEventsPath(locale),
      error,
    };
  },
  persist: async (event) => {
    const { db } = getAuthOptions();
    await setEventPublished(db, event.id, true);
  },
  successHref: (_event, locale) => `${adminEventsPath(locale)}?ok=publish`,
});

export const POST = routes.POST;
export default routes.GET;
