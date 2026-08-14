import { type CapacityMode, cloneEvent, getEventById } from "@unveiled/db";
import { ensureImageVariantsUploaded } from "@unveiled/db/catalog/images";
import { buildVariantUrl } from "@unveiled/images/urls";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminPageShell, adminEventsPath } from "../../../../../components/admin/AdminPageShell";
import type { CloneEventFormSource } from "../../../../../components/admin/CloneEventForm";
import { eventListPath } from "../../../../../components/admin/EventAdminForm";
import type { EventDateTimeRow } from "../../../../../components/admin/event-admin-types";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import CloneEventForm from "../../../../../islands/CloneEventForm";
import { getAdminCopy } from "../../../../../lib/admin-content";
import {
  eventDateTimesToFormRows,
  eventFormValuesToOccurrenceLists,
  formatEventDateTime,
} from "../../../../../lib/admin-event-form";
import { renderAdminPage } from "../../../../../lib/admin-render";
import {
  guardAdminRoute,
  mapCatalogError,
  parseEventFormBodyFromRequest,
} from "../../../../../lib/admin-route";
import {
  assertCapacityMatchesInventory,
  voucherPayloadFromFormValues,
} from "../../../../../lib/admin-voucher-inventory";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";
import { localizedPath } from "../../../../../lib/locale";

function sourceFromEvent(
  event: NonNullable<Awaited<ReturnType<typeof getEventById>>>,
  locale: Locale,
): CloneEventFormSource {
  let imageUrl: string | null = null;
  try {
    imageUrl = buildVariantUrl(event.imageId, "small-320.webp");
  } catch {
    imageUrl = null;
  }

  return {
    id: event.id,
    title: event.title,
    partnerName: event.partnerName,
    ticketType: event.ticketType,
    timingMode: event.timingMode,
    capacityMode: event.capacityMode,
    totalCapacity: event.totalCapacity,
    dateTimeLabel: formatEventDateTime(event.dateTime, locale),
    imageUrl,
    dateTimeRows: eventDateTimesToFormRows(event),
  };
}

function renderClonePage(
  c: Context,
  options: {
    locale: Locale;
    sourceEventId: string;
    source: CloneEventFormSource;
    defaults?: {
      dateTimeRows?: EventDateTimeRow[];
      rangeStart?: string;
      rangeEnd?: string;
      rangeSlots?: { time: string; credits: string }[];
      capacityMode?: CapacityMode;
      totalCapacity?: number;
    };
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.eventsTitle, href: adminEventsPath(options.locale) },
        { label: copy.cloneEventTitle },
      ]}
      subtitle={copy.cloneEventSubtitle}
      title={copy.cloneEventTitle}
    >
      <CloneEventForm
        action={`/${options.locale}/admin/events/${options.sourceEventId}/clone`}
        cancelHref={eventListPath(options.locale)}
        defaults={options.defaults}
        error={options.error ?? null}
        locale={options.locale}
        source={options.source}
      />
    </AdminPageShell>,
    {
      locale: options.locale,
      title: copy.cloneEventTitle,
    },
  );
}

function notFound(c: Context, locale: Locale) {
  c.status(404);
  return c.render(<NotFoundPage locale={locale} />, {
    locale,
    robots: "noindex",
    title: "Not Found — Unveiled Berlin",
  });
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const eventId = c.req.param("id");
  if (!eventId) {
    return notFound(c, guard.locale);
  }

  const { db } = getAuthOptions();
  const existing = await getEventById(db, eventId);
  if (!existing) {
    return notFound(c, guard.locale);
  }

  const source = sourceFromEvent(existing, guard.locale);
  const body = (await c.req.parseBody({ all: true })) as Record<
    string,
    string | File | (string | File)[]
  >;

  try {
    const values = await parseEventFormBodyFromRequest(body);
    values.ticketType = existing.ticketType;

    const { dateTimes, occurrenceCreditPrices, occurrenceCapacities } =
      eventFormValuesToOccurrenceLists(values);
    const payload = voucherPayloadFromFormValues(values);
    assertCapacityMatchesInventory(values);

    const cloned = await cloneEvent(db, eventId, {
      dateTimes,
      occurrenceCreditPrices,
      timingMode: values.timingMode,
      capacityMode: values.capacityMode ?? "SHARED",
      totalCapacity: values.totalCapacity,
      occurrenceCapacities,
      voucherInventory: {
        promoCodes: payload.promoCodes,
        pdfItems: payload.pdfItems,
      },
    });

    return c.redirect(localizedPath(guard.locale, `admin/events/${cloned.id}/edit`), 302);
  } catch (error) {
    let defaults:
      | {
          dateTimeRows?: EventDateTimeRow[];
          rangeStart?: string;
          rangeEnd?: string;
          rangeSlots?: { time: string; credits: string }[];
          capacityMode?: CapacityMode;
          totalCapacity?: number;
        }
      | undefined;
    try {
      const values = await parseEventFormBodyFromRequest(body);
      defaults = {
        dateTimeRows: values.dateTimeRows,
        rangeStart: values.rangeStart,
        rangeEnd: values.rangeEnd,
        rangeSlots: values.rangeSlots,
        capacityMode: values.capacityMode,
        totalCapacity: values.totalCapacity,
      };
    } catch {
      defaults = undefined;
    }

    return renderClonePage(c, {
      locale: guard.locale,
      sourceEventId: eventId,
      source,
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
    return notFound(c, guard.locale);
  }

  const { db } = getAuthOptions();
  const event = await getEventById(db, eventId);
  if (!event) {
    return notFound(c, guard.locale);
  }

  await ensureImageVariantsUploaded(db, event.imageId);

  return renderClonePage(c, {
    locale: guard.locale,
    sourceEventId: eventId,
    source: sourceFromEvent(event, guard.locale),
  });
});
