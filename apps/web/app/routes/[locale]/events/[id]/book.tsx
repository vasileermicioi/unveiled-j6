import {
  BookingError,
  bookEvent,
  createTxDb,
  getPublicEventById,
  isBookingEligibleStatus,
} from "@unveiled/db";
import { sendBookingConfirmation } from "@unveiled/email";
import { createRoute } from "honox/factory";

import { BookEventPage } from "../../../../components/booking/BookEventPage";
import { NotFoundPage } from "../../../../components/NotFoundPage";
import { getAuthOptions, getSessionIfConfigured } from "../../../../lib/auth";
import { getBookPageCopy } from "../../../../lib/booking-content";
import { getCatalogDb } from "../../../../lib/catalog-db";
import type { Locale } from "../../../../lib/locale";
import { isValidLocale } from "../../../../lib/locale";
import { resolveEnvVarFromContext } from "../../../../lib/runtime-env";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

function loginRedirect(locale: Locale, returnPath: string): string {
  return `/${locale}/login?returnTo=${encodeURIComponent(returnPath)}`;
}

async function sendConfirmationSafe(options: {
  apiKey: string | undefined;
  from: string | undefined;
  locale: Locale;
  toEmail: string;
  event: {
    id: string;
    title: string;
    address: string;
    dateTime: Date;
    partnerName: string;
  };
  booking: {
    id: string;
    ticketsCount: number;
    redemptionInfo: string | null;
    redemptionUrl: string | null;
    redemptionType: "VOUCHER" | "SECRET_CODE" | null;
  };
  userId: string;
}): Promise<void> {
  if (!options.apiKey || !options.from) {
    console.warn("booking confirmation email skipped (RESEND env unset)", {
      bookingId: options.booking.id,
      userId: options.userId,
    });
    return;
  }

  try {
    const result = await sendBookingConfirmation({
      apiKey: options.apiKey,
      from: options.from,
      locale: options.locale,
      toEmail: options.toEmail,
      event: options.event,
      booking: options.booking,
    });
    if (!result.ok) {
      console.error("booking confirmation email failed", {
        bookingId: options.booking.id,
        userId: options.userId,
        error: result.error,
        status: result.status,
      });
    }
  } catch (error) {
    console.error("booking confirmation email threw", {
      bookingId: options.booking.id,
      userId: options.userId,
      error,
    });
  }
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const eventId = c.req.param("id");
  const copy = getBookPageCopy(locale);
  const bookPath = `/${locale}/events/${eventId}/book`;

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
    return c.redirect(loginRedirect(locale, bookPath), 302);
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

  const { db: authDb } = getAuthOptions();
  const [subscription, user] = await Promise.all([
    authDb.query.subscriptions.findFirst({
      where: (fields, { eq }) => eq(fields.userId, session.user.id),
    }),
    authDb.query.users.findFirst({
      where: (fields, { eq }) => eq(fields.id, session.user.id),
    }),
  ]);

  if (subscription?.status === "PAST_DUE") {
    return c.render(
      <BookEventPage
        copy={copy}
        event={event}
        idempotencyKey={crypto.randomUUID()}
        locale={locale}
        view="past_due"
      />,
      {
        locale,
        title: copy.pastDueTitle,
        robots: "noindex",
        canonicalPath: bookPath,
      },
    );
  }

  if (!isBookingEligibleStatus(subscription?.status)) {
    return c.redirect(`/${locale}/membership`, 302);
  }

  return c.render(
    <BookEventPage
      availableCredits={user?.credits}
      copy={copy}
      event={event}
      idempotencyKey={crypto.randomUUID()}
      locale={locale}
      view="form"
    />,
    {
      locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: bookPath,
    },
  );
});

export const POST = createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const eventId = c.req.param("id");
  const copy = getBookPageCopy(locale);
  const bookPath = `/${locale}/events/${eventId}/book`;

  if (!eventId) {
    return c.redirect(`/${locale}/events`, 302);
  }

  const session = await getSessionIfConfigured(c);
  if (!session?.user) {
    return c.redirect(loginRedirect(locale, bookPath), 302);
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
  const subscription = await authDb.query.subscriptions.findFirst({
    where: (fields, { eq }) => eq(fields.userId, session.user.id),
  });

  if (subscription?.status === "PAST_DUE") {
    return c.render(
      <BookEventPage
        copy={copy}
        event={event}
        idempotencyKey={crypto.randomUUID()}
        locale={locale}
        view="past_due"
      />,
      {
        locale,
        title: copy.pastDueTitle,
        robots: "noindex",
        canonicalPath: bookPath,
      },
    );
  }

  if (!isBookingEligibleStatus(subscription?.status)) {
    return c.redirect(`/${locale}/membership`, 302);
  }

  const form = await c.req.parseBody();
  const ticketsRaw = typeof form.ticketsCount === "string" ? form.ticketsCount : "1";
  const ticketsCount = Number.parseInt(ticketsRaw, 10);
  const idempotencyKey =
    typeof form.idempotencyKey === "string" && form.idempotencyKey.trim()
      ? form.idempotencyKey.trim()
      : crypto.randomUUID();

  const databaseUrl = resolveEnvVarFromContext(c, "DATABASE_URL");
  if (!databaseUrl) {
    return c.render(
      <BookEventPage
        copy={copy}
        defaultTickets={ticketsRaw}
        errorMessage={copy.errorGeneric}
        event={event}
        idempotencyKey={idempotencyKey}
        locale={locale}
        view="form"
      />,
      {
        locale,
        title: copy.title,
        robots: "noindex",
        canonicalPath: bookPath,
      },
    );
  }

  const txDb = createTxDb(databaseUrl);
  try {
    const result = await bookEvent(txDb, {
      userId: session.user.id,
      eventId,
      ticketsCount,
      idempotencyKey,
    });

    if (result.created) {
      await sendConfirmationSafe({
        apiKey: resolveEnvVarFromContext(c, "RESEND_API_KEY"),
        from: resolveEnvVarFromContext(c, "DAILY_CODES_FROM_EMAIL"),
        locale,
        toEmail: session.user.email,
        event: {
          id: event.id,
          title: event.title,
          address: event.address,
          dateTime: event.dateTime,
          partnerName: event.partnerName,
        },
        booking: {
          id: result.booking.id,
          ticketsCount: result.booking.ticketsCount,
          redemptionInfo: result.booking.redemptionInfo,
          redemptionUrl: result.booking.redemptionUrl,
          redemptionType: result.booking.redemptionType,
        },
        userId: session.user.id,
      });
    }

    return c.redirect(
      `/${locale}/events/${eventId}/book/confirm?booking=${encodeURIComponent(result.booking.id)}`,
      302,
    );
  } catch (error) {
    let errorMessage = copy.errorGeneric;
    if (error instanceof BookingError) {
      if (error.code === "INSUFFICIENT_CREDITS") {
        errorMessage = copy.errorInsufficientCredits;
      } else if (error.code === "SOLD_OUT") {
        errorMessage = copy.errorSoldOut;
      } else if (error.code === "PAST_DUE") {
        errorMessage = copy.errorPastDue;
      } else if (error.code === "INELIGIBLE_SUBSCRIPTION") {
        return c.redirect(`/${locale}/membership`, 302);
      }
    }

    const user = await authDb.query.users.findFirst({
      where: (fields, { eq }) => eq(fields.id, session.user.id),
    });

    return c.render(
      <BookEventPage
        availableCredits={user?.credits}
        copy={copy}
        defaultTickets={Number.isFinite(ticketsCount) ? String(ticketsCount) : "1"}
        errorMessage={errorMessage}
        event={event}
        idempotencyKey={idempotencyKey}
        locale={locale}
        view="form"
      />,
      {
        locale,
        title: copy.title,
        robots: "noindex",
        canonicalPath: bookPath,
      },
    );
  } finally {
    await txDb.pool.end().catch(() => undefined);
  }
});
