import { getEventById, listPartners, updateEvent } from "@unveiled/db";
import { ensureImageVariantsUploaded } from "@unveiled/db/catalog/images";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminPageShell, adminEventsPath } from "../../../../../components/admin/AdminPageShell";
import { eventListPath } from "../../../../../components/admin/EventAdminForm";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import EventAdminForm from "../../../../../islands/EventAdminForm";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { toUpdateEventInput } from "../../../../../lib/admin-event-input";
import {
  eventToFormDefaults,
  formValuesToDefaults,
  toPartnerOptions,
} from "../../../../../lib/admin-event-route-helpers";
import { renderAdminPage } from "../../../../../lib/admin-render";
import {
  guardAdminRoute,
  mapCatalogError,
  parseEventFormBodyFromRequest,
} from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";
import { resolveEnvVarFromContext } from "../../../../../lib/runtime-env";
import { maybeProcessWaitlistAfterCapacityIncrease } from "../../../../../lib/waitlist-capacity-hook";

function renderEditPage(
  c: Context,
  options: {
    locale: Locale;
    eventId: string;
    partners: ReturnType<typeof toPartnerOptions>;
    defaults?: ReturnType<typeof eventToFormDefaults>;
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminPageShell
      breadcrumbs={[
        { label: copy.eventsTitle, href: adminEventsPath(options.locale) },
        { label: copy.editEventTitle },
      ]}
      title={copy.editEventTitle}
    >
      <EventAdminForm
        action={`/${options.locale}/admin/events/${options.eventId}/edit`}
        cancelHref={eventListPath(options.locale)}
        defaults={options.defaults}
        error={options.error ?? null}
        isEdit
        locale={options.locale}
        partners={options.partners}
        submitLabel={copy.save}
      />
    </AdminPageShell>,
    {
      locale: options.locale,
      title: copy.editEventTitle,
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
  const existing = await getEventById(db, eventId);
  if (!existing) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const partners = await listPartners(db, { limit: 1000 });
  const partnerOptions = toPartnerOptions(partners);
  const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;

  try {
    const values = await parseEventFormBodyFromRequest(body);
    const previousRemaining = existing.remainingCapacity;
    const updated = await updateEvent(
      db,
      eventId,
      toUpdateEventInput(values, guard.session.user.id),
    );

    // Phase 7 demo trigger: capacity increase → processWaitlistForEvent + promotion email.
    // Phase 8 admin booking-cancel must call the same processor after capacity frees.
    const databaseUrl = resolveEnvVarFromContext(c, "DATABASE_URL");
    if (databaseUrl && updated.remainingCapacity > previousRemaining) {
      await maybeProcessWaitlistAfterCapacityIncrease({
        c,
        databaseUrl,
        eventId,
        previousRemaining,
        nextRemaining: updated.remainingCapacity,
        locale: guard.locale,
        event: {
          id: updated.id,
          title: updated.title,
          address: updated.address,
          dateTime: updated.dateTime,
          partnerName: updated.partnerName,
        },
        resolveToEmail: async (userId) => {
          const user = await db.query.users.findFirst({
            where: (fields, { eq }) => eq(fields.id, userId),
          });
          return user?.email;
        },
      });
    }

    return c.redirect(eventListPath(guard.locale), 302);
  } catch (error) {
    await ensureImageVariantsUploaded(db, existing.imageId);
    const existingDefaults = eventToFormDefaults(existing);
    let defaults = existingDefaults;
    try {
      defaults = {
        ...existingDefaults,
        ...formValuesToDefaults(await parseEventFormBodyFromRequest(body)),
        currentImageUrl: existingDefaults.currentImageUrl,
      };
    } catch {
      // keep existing defaults
    }

    return renderEditPage(c, {
      locale: guard.locale,
      eventId,
      partners: partnerOptions,
      defaults,
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

  await ensureImageVariantsUploaded(db, event.imageId);

  const partners = await listPartners(db, { limit: 1000 });

  return renderEditPage(c, {
    locale: guard.locale,
    eventId,
    partners: toPartnerOptions(partners),
    defaults: eventToFormDefaults(event),
  });
});
