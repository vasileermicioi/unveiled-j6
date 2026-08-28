import {
  cancelAllBookingsForEvent,
  getEventById,
  listEventsWithBookingStats,
  resolveEventCopy,
} from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminCancelAllBookingsPage } from "../../../../../../components/admin/AdminCancelAllBookingsPage";
import {
  adminEventBookingsCancelAllPath,
  adminEventBookingsPath,
} from "../../../../../../components/admin/admin-tabs";
import { NotFoundPage } from "../../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../../lib/admin-render";
import {
  guardAdminRoute,
  mapAdminOpsError,
  withAdminTxDb,
} from "../../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../../lib/auth";
import { sendCancelAllEmailsSafe } from "../../../../../../lib/cancel-all-emails";
import type { Locale } from "../../../../../../lib/locale";
import { resolveEnvVarFromContext } from "../../../../../../lib/runtime-env";

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

async function loadEvent(eventId: string) {
  const { db } = getAuthOptions();
  const event = await getEventById(db, eventId);
  if (!event) {
    return null;
  }
  const stats = await listEventsWithBookingStats(db, { eventId, page: 1, limit: 1 });
  return { event, stats: stats.items[0] ?? null };
}

function renderPage(
  c: Context,
  options: {
    locale: Locale;
    eventId: string;
    eventTitle: string;
    confirmedCount: number;
    refundableCredits: number;
    compConfirmedCount: number;
    usedCount: number;
    waitingCount: number;
    error?: string | null;
    defaultReason?: string;
  },
) {
  const copy = getAdminCopy(options.locale);
  return renderAdminPage(
    c,
    <AdminCancelAllBookingsPage
      action={adminEventBookingsCancelAllPath(options.locale, options.eventId)}
      confirmedCount={options.confirmedCount}
      compConfirmedCount={options.compConfirmedCount}
      defaultReason={options.defaultReason}
      error={options.error}
      eventId={options.eventId}
      eventTitle={options.eventTitle}
      locale={options.locale}
      refundableCredits={options.refundableCredits}
      usedCount={options.usedCount}
      waitingCount={options.waitingCount}
    />,
    {
      locale: options.locale,
      title: copy.cancelAllTitle,
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

  const loaded = await loadEvent(eventId);
  if (!loaded) {
    return notFound(c, guard.locale);
  }

  const eventTitle = resolveEventCopy(loaded.event, guard.locale).title;
  const counts = {
    confirmedCount: loaded.stats?.confirmedCount ?? 0,
    refundableCredits: loaded.stats?.refundableCredits ?? 0,
    compConfirmedCount: loaded.stats?.compConfirmedCount ?? 0,
    usedCount: loaded.stats?.usedCount ?? 0,
    waitingCount: loaded.stats?.waitingCount ?? 0,
  };

  const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
  const reason = asString(body.reason);

  try {
    const result = await withAdminTxDb(c, async (txDb) => {
      return cancelAllBookingsForEvent(txDb, {
        eventId,
        reason,
        adminUserId: guard.session.user.id,
      });
    });

    await sendCancelAllEmailsSafe({
      apiKey: resolveEnvVarFromContext(c, "RESEND_API_KEY"),
      from: resolveEnvVarFromContext(c, "DAILY_CODES_FROM_EMAIL"),
      event: {
        id: loaded.event.id,
        title: eventTitle,
        address: loaded.event.address,
        dateTime: loaded.event.dateTime,
        partnerName: loaded.event.partnerName,
      },
      cancelledMembers: result.cancelledMembers,
      closedWaitlistMembers: result.closedWaitlistMembers,
      eventTitleForLocale: (locale) => resolveEventCopy(loaded.event, locale).title,
    });

    return c.redirect(`${adminEventBookingsPath(guard.locale, eventId)}?ok=cancel-all`, 302);
  } catch (error) {
    return renderPage(c, {
      locale: guard.locale,
      eventId,
      eventTitle,
      ...counts,
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

  const eventId = c.req.param("id");
  if (!eventId) {
    return notFound(c, guard.locale);
  }

  const loaded = await loadEvent(eventId);
  if (!loaded) {
    return notFound(c, guard.locale);
  }

  return renderPage(c, {
    locale: guard.locale,
    eventId,
    eventTitle: resolveEventCopy(loaded.event, guard.locale).title,
    confirmedCount: loaded.stats?.confirmedCount ?? 0,
    refundableCredits: loaded.stats?.refundableCredits ?? 0,
    compConfirmedCount: loaded.stats?.compConfirmedCount ?? 0,
    usedCount: loaded.stats?.usedCount ?? 0,
    waitingCount: loaded.stats?.waitingCount ?? 0,
  });
});
