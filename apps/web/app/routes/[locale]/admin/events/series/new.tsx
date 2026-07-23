import { CatalogValidationError, createEventSeries, listPartners } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminPageShell, adminEventsPath } from "../../../../../components/admin/AdminPageShell";
import { eventListPath } from "../../../../../components/admin/EventAdminForm";
import EventSeriesForm from "../../../../../islands/EventSeriesForm";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { toSeriesCreateInput } from "../../../../../lib/admin-event-input";
import {
  formValuesToDefaults,
  toPartnerOptions,
} from "../../../../../lib/admin-event-route-helpers";
import { renderAdminPage } from "../../../../../lib/admin-render";
import {
  guardAdminRoute,
  mapCatalogError,
  parseEventFormBodyFromRequest,
  parseSeriesSlotsFromBody,
} from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";

function renderSeriesPage(
  c: Context,
  options: {
    locale: "de" | "en";
    partners: ReturnType<typeof toPartnerOptions>;
    error?: string | null;
    defaults?: ReturnType<typeof formValuesToDefaults>;
    previewSlots?: Date[];
    slotMode?: "manual" | "builder";
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.eventsTitle, href: adminEventsPath(options.locale) },
        { label: copy.newEventSeriesTitle },
      ]}
      title={copy.newEventSeriesTitle}
    >
      <EventSeriesForm
        action={`/${options.locale}/admin/events/series/new`}
        cancelHref={eventListPath(options.locale)}
        defaults={options.defaults}
        error={options.error ?? null}
        locale={options.locale}
        partners={options.partners}
        previewSlots={options.previewSlots}
        slotMode={options.slotMode}
      />
    </AdminPageShell>,
    {
      locale: options.locale,
      title: copy.newEventSeriesTitle,
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const partners = await listPartners(db, { limit: 1000 });
  const partnerOptions = toPartnerOptions(partners);
  const body = (await c.req.parseBody({ all: true })) as Record<
    string,
    string | File | (string | File)[]
  >;
  const action = typeof body.action === "string" ? body.action : "preview";

  try {
    const values = await parseEventFormBodyFromRequest(body);
    const defaults = formValuesToDefaults(values);
    const slotMode =
      typeof body.slot_mode === "string" && body.slot_mode === "builder" ? "builder" : "manual";

    if (action === "confirm") {
      const slots = parseSeriesSlotsFromBody(body);
      await createEventSeries(db, toSeriesCreateInput(values, slots, guard.session.user.id));
      return c.redirect(eventListPath(guard.locale), 302);
    }

    const slots = parseSeriesSlotsFromBody(body);
    if (slots.length === 0) {
      throw new CatalogValidationError("EMPTY_SERIES_SLOTS", "At least one slot is required");
    }

    return renderSeriesPage(c, {
      locale: guard.locale,
      partners: partnerOptions,
      defaults,
      previewSlots: slots,
      slotMode,
    });
  } catch (error) {
    let defaults: ReturnType<typeof formValuesToDefaults> | undefined;
    let slotMode: "manual" | "builder" = "manual";
    try {
      const values = await parseEventFormBodyFromRequest(body);
      defaults = formValuesToDefaults(values);
      slotMode =
        typeof body.slot_mode === "string" && body.slot_mode === "builder" ? "builder" : "manual";
    } catch {
      defaults = undefined;
    }

    return renderSeriesPage(c, {
      locale: guard.locale,
      partners: partnerOptions,
      defaults,
      error: mapCatalogError(error, guard.locale),
      slotMode,
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const partners = await listPartners(db, { limit: 1000 });

  return renderSeriesPage(c, {
    locale: guard.locale,
    partners: toPartnerOptions(partners),
  });
});
