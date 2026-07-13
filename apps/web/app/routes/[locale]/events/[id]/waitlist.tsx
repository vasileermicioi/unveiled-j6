import {
  getPublicEventById,
  getWaitlistQueuePosition,
  isWaitlistError,
  joinWaitlist,
} from "@unveiled/db";
import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../../../components/NotFoundPage";
import { WaitlistJoinPage } from "../../../../components/waitlist/WaitlistJoinPage";
import { getAuthOptions, getSessionIfConfigured } from "../../../../lib/auth";
import { buildLoginRedirectUrl } from "../../../../lib/auth-middleware";
import { getCatalogDb } from "../../../../lib/catalog-db";
import type { Locale } from "../../../../lib/locale";
import { isValidLocale } from "../../../../lib/locale";
import { getWaitlistJoinCopy } from "../../../../lib/waitlist-content";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const eventId = c.req.param("id");
  const copy = getWaitlistJoinCopy(locale);
  const waitlistPath = `/${locale}/events/${eventId}/waitlist`;
  const qtyParam = c.req.query("qty");
  const defaultTickets = qtyParam === "1" || qtyParam === "2" || qtyParam === "3" ? qtyParam : "1";

  if (!eventId) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  const session = await getSessionIfConfigured(c);
  if (!session?.user) {
    return c.redirect(buildLoginRedirectUrl(locale, waitlistPath), 302);
  }

  const db = getCatalogDb();
  if (!db) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  const event = await getPublicEventById(db, eventId);
  if (!event) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  const existing = await db.query.waitlistEntries.findFirst({
    where: (fields, { and: andOp, eq: eqOp }) =>
      andOp(
        eqOp(fields.userId, session.user.id),
        eqOp(fields.eventId, eventId),
        eqOp(fields.status, "WAITING"),
      ),
  });

  if (existing) {
    const position = await getWaitlistQueuePosition(db, eventId, existing.createdAt);
    return c.render(
      <WaitlistJoinPage
        copy={copy}
        created={false}
        entryId={existing.id}
        event={event}
        locale={locale}
        queuePosition={position}
        requestedQty={existing.requestedQty}
        view="status"
      />,
      {
        locale,
        title: copy.confirmTitle,
        robots: "noindex",
        canonicalPath: waitlistPath,
      },
    );
  }

  return c.render(
    <WaitlistJoinPage
      copy={copy}
      defaultTickets={defaultTickets}
      event={event}
      locale={locale}
      view="form"
    />,
    {
      locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: waitlistPath,
    },
  );
});

export const POST = createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const eventId = c.req.param("id");
  const copy = getWaitlistJoinCopy(locale);
  const waitlistPath = `/${locale}/events/${eventId}/waitlist`;

  if (!eventId) {
    return c.redirect(`/${locale}/events`, 302);
  }

  const session = await getSessionIfConfigured(c);
  if (!session?.user) {
    return c.redirect(buildLoginRedirectUrl(locale, waitlistPath), 302);
  }

  const db = getCatalogDb();
  if (!db) {
    return c.redirect(`/${locale}/events`, 302);
  }

  const event = await getPublicEventById(db, eventId);
  if (!event) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  const form = await c.req.parseBody();
  const qtyRaw = typeof form.requestedQty === "string" ? form.requestedQty : "1";
  const requestedQty = Number.parseInt(qtyRaw, 10);

  try {
    const { db: authDb } = getAuthOptions();
    const result = await joinWaitlist(authDb, {
      userId: session.user.id,
      eventId,
      requestedQty,
    });
    const position = await getWaitlistQueuePosition(authDb, eventId, result.entry.createdAt);

    return c.render(
      <WaitlistJoinPage
        copy={copy}
        created={result.created}
        entryId={result.entry.id}
        event={event}
        locale={locale}
        queuePosition={position}
        requestedQty={result.entry.requestedQty}
        view="status"
      />,
      {
        locale,
        title: copy.confirmTitle,
        robots: "noindex",
        canonicalPath: waitlistPath,
      },
    );
  } catch (error) {
    let errorMessage = copy.errorGeneric;
    if (isWaitlistError(error) && error.code === "INVALID_QTY") {
      errorMessage = copy.errorInvalidQty;
    }

    return c.render(
      <WaitlistJoinPage
        copy={copy}
        defaultTickets={Number.isFinite(requestedQty) ? String(requestedQty) : "1"}
        errorMessage={errorMessage}
        event={event}
        locale={locale}
        view="form"
      />,
      {
        locale,
        title: copy.title,
        robots: "noindex",
        canonicalPath: waitlistPath,
      },
    );
  }
});
