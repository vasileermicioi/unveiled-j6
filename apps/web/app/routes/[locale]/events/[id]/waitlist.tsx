import {
  getPublicEventById,
  getWaitlistQueuePosition,
  isWaitlistError,
  joinWaitlist,
  maxBookableTickets,
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

/**
 * Waitlist is typically used when remaining capacity is 0, so capacity must not
 * collapse the Select to empty — bind by credits only in that case.
 */
function computeWaitlistMaxQty(
  credits: number,
  creditPrice: number,
  remainingCapacity: number,
): number {
  const capacityBound = remainingCapacity > 0 ? remainingCapacity : Number.MAX_SAFE_INTEGER;
  return Math.max(
    1,
    maxBookableTickets({
      viewerKind: "signed-in",
      credits,
      creditPrice,
      remainingCapacity: capacityBound,
    }),
  );
}

function parseQtyParam(raw: string | undefined, maxQty: number): string {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) {
    return "1";
  }
  return String(Math.min(n, maxQty));
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const eventId = c.req.param("id");
  const copy = getWaitlistJoinCopy(locale);
  const waitlistPath = `/${locale}/events/${eventId}/waitlist`;

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

  const { db: authDb } = getAuthOptions();
  const user = await authDb.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.id, session.user.id),
  });
  const maxQty = computeWaitlistMaxQty(
    user?.credits ?? 0,
    event.creditPrice,
    event.remainingCapacity,
  );
  const defaultTickets = parseQtyParam(c.req.query("qty"), maxQty);

  return c.render(
    <WaitlistJoinPage
      copy={copy}
      defaultTickets={defaultTickets}
      event={event}
      locale={locale}
      maxQty={maxQty}
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

  const { db: authDb } = getAuthOptions();
  const user = await authDb.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.id, session.user.id),
  });
  const maxQty = computeWaitlistMaxQty(
    user?.credits ?? 0,
    event.creditPrice,
    event.remainingCapacity,
  );

  const form = await c.req.parseBody();
  const qtyRaw = typeof form.requestedQty === "string" ? form.requestedQty : "1";
  const requestedQty = Number.parseInt(qtyRaw, 10);
  const defaultTickets = parseQtyParam(
    Number.isFinite(requestedQty) ? String(requestedQty) : "1",
    maxQty,
  );

  try {
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
        defaultTickets={defaultTickets}
        errorMessage={errorMessage}
        event={event}
        locale={locale}
        maxQty={maxQty}
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
