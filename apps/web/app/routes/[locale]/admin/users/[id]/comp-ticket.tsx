import {
  createCompTicket,
  getMemberDetail,
  isAdminMemberError,
  listUpcomingEvents,
} from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";
import { AdminCompTicketForm } from "../../../../../components/admin/AdminCompTicketForm";
import {
  adminUserCompTicketPath,
  adminUserDetailPath,
} from "../../../../../components/admin/admin-tabs";
import { memberDisplayName } from "../../../../../components/admin/member-display";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import {
  formatEventDateTime,
  guardAdminRoute,
  mapAdminOpsError,
  withAdminTxDb,
} from "../../../../../lib/admin-route";
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

async function loadMemberLabel(userId: string): Promise<string | null> {
  const { db } = getAuthOptions();
  try {
    const detail = await getMemberDetail(db, userId);
    return memberDisplayName(detail.user.profile, detail.user.email);
  } catch (error) {
    if (isAdminMemberError(error) && error.code === "USER_NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

async function loadEventOptions(locale: Locale) {
  const { db } = getAuthOptions();
  const events = await listUpcomingEvents(db, { limit: 100 });
  return events.map((event) => ({
    id: event.id,
    label: `${event.title} — ${formatEventDateTime(event.dateTime, locale)}`,
  }));
}

function renderPage(
  c: Context,
  options: {
    locale: Locale;
    userId: string;
    memberLabel: string;
    events: { id: string; label: string }[];
    error?: string | null;
    defaultEventId?: string;
    defaultTickets?: string;
  },
) {
  const copy = getAdminCopy(options.locale);
  return renderAdminPage(
    c,
    <AdminCompTicketForm
      action={adminUserCompTicketPath(options.locale, options.userId)}
      defaultEventId={options.defaultEventId}
      defaultTickets={options.defaultTickets}
      error={options.error}
      events={options.events}
      locale={options.locale}
      memberLabel={options.memberLabel}
      userId={options.userId}
    />,
    {
      locale: options.locale,
      title: copy.compTicketTitle,
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const userId = c.req.param("id");
  if (!userId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const memberLabel = await loadMemberLabel(userId);
  if (!memberLabel) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const events = await loadEventOptions(guard.locale);
  const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
  const eventId = asString(body.eventId).trim();
  const ticketsRaw = asString(body.ticketsCount).trim() || "1";
  const ticketsCount = Number.parseInt(ticketsRaw, 10);
  const idempotencyKey = `admin-comp:${userId}:${eventId}:${crypto.randomUUID()}`;

  try {
    await withAdminTxDb(c, async (txDb) => {
      await createCompTicket(txDb, {
        userId,
        eventId,
        ticketsCount: Number.isFinite(ticketsCount) ? ticketsCount : 1,
        idempotencyKey,
        adminUserId: guard.session.user.id,
      });
    });
    return c.redirect(`${adminUserDetailPath(guard.locale, userId)}?ok=comp-ticket`, 302);
  } catch (error) {
    return renderPage(c, {
      locale: guard.locale,
      userId,
      memberLabel,
      events,
      error: mapAdminOpsError(error, guard.locale),
      defaultEventId: eventId,
      defaultTickets: ticketsRaw,
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const userId = c.req.param("id");
  if (!userId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const memberLabel = await loadMemberLabel(userId);
  if (!memberLabel) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const events = await loadEventOptions(guard.locale);
  return renderPage(c, {
    locale: guard.locale,
    userId,
    memberLabel,
    events,
  });
});
