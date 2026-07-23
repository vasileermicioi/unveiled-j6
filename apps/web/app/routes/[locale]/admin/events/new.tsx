import { createEvent, listPartners } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminPageShell, adminEventsPath } from "../../../../components/admin/AdminPageShell";
import { eventListPath } from "../../../../components/admin/EventAdminForm";
import type { EventFormDefaults } from "../../../../components/admin/event-admin-types";
import EventAdminForm from "../../../../islands/EventAdminForm";
import { getAdminCopy } from "../../../../lib/admin-content";
import { toCreateEventInput } from "../../../../lib/admin-event-input";
import { formValuesToDefaults, toPartnerOptions } from "../../../../lib/admin-event-route-helpers";
import { renderAdminPage } from "../../../../lib/admin-render";
import {
  guardAdminRoute,
  mapCatalogError,
  parseEventFormBodyFromRequest,
} from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getAdminCopy(guard.locale);
  const { db } = getAuthOptions();
  const partners = await listPartners(db, { limit: 1000 });
  const partnerOptions = toPartnerOptions(partners);
  const body = (await c.req.parseBody({ all: true })) as Record<
    string,
    string | File | (string | File)[]
  >;

  try {
    const values = await parseEventFormBodyFromRequest(body);
    await createEvent(db, toCreateEventInput(values, guard.session.user.id));
    return c.redirect(eventListPath(guard.locale), 302);
  } catch (error) {
    let defaults: EventFormDefaults | undefined;
    try {
      defaults = formValuesToDefaults(await parseEventFormBodyFromRequest(body));
    } catch {
      defaults = undefined;
    }

    return renderAdminPage(
      c,
      <AdminPageShell
        eyebrow={copy.pageEyebrow}
        breadcrumbs={[
          { label: copy.eventsTitle, href: adminEventsPath(guard.locale) },
          { label: copy.newEventTitle },
        ]}
        title={copy.newEventTitle}
      >
        <EventAdminForm
          action={`/${guard.locale}/admin/events/new`}
          cancelHref={eventListPath(guard.locale)}
          defaults={defaults}
          error={mapCatalogError(error, guard.locale)}
          locale={guard.locale}
          partners={partnerOptions}
          submitLabel={copy.create}
        />
      </AdminPageShell>,
      {
        locale: guard.locale,
        title: copy.newEventTitle,
      },
    );
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getAdminCopy(guard.locale);
  const { db } = getAuthOptions();
  const partners = await listPartners(db, { limit: 1000 });

  return renderAdminPage(
    c,
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.eventsTitle, href: adminEventsPath(guard.locale) },
        { label: copy.newEventTitle },
      ]}
      title={copy.newEventTitle}
    >
      <EventAdminForm
        action={`/${guard.locale}/admin/events/new`}
        cancelHref={eventListPath(guard.locale)}
        locale={guard.locale}
        partners={toPartnerOptions(partners)}
        submitLabel={copy.create}
      />
    </AdminPageShell>,
    {
      locale: guard.locale,
      title: copy.newEventTitle,
    },
  );
});
