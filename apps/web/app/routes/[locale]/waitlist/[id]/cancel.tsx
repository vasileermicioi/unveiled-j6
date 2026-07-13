import { cancelWaitlistEntry, getPublicEventById, isWaitlistError } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../../../components/NotFoundPage";
import { WaitlistCancelPage } from "../../../../components/waitlist/WaitlistCancelPage";
import { getAuthOptions, getSessionIfConfigured } from "../../../../lib/auth";
import { buildLoginRedirectUrl } from "../../../../lib/auth-middleware";
import { getCatalogDb } from "../../../../lib/catalog-db";
import type { Locale } from "../../../../lib/locale";
import { isValidLocale } from "../../../../lib/locale";
import { getWaitlistCancelCopy } from "../../../../lib/waitlist-content";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const entryId = c.req.param("id");
  const copy = getWaitlistCancelCopy(locale);
  const cancelPath = `/${locale}/waitlist/${entryId}/cancel`;

  if (!entryId) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  const session = await getSessionIfConfigured(c);
  if (!session?.user) {
    return c.redirect(buildLoginRedirectUrl(locale, cancelPath), 302);
  }

  const { db } = getAuthOptions();
  const entry = await db.query.waitlistEntries.findFirst({
    where: (fields, { eq: eqOp }) => eqOp(fields.id, entryId),
  });

  if (!entry || entry.userId !== session.user.id) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: copy.notFoundTitle,
      robots: "noindex",
    });
  }

  const catalogDb = getCatalogDb();
  const event = catalogDb ? await getPublicEventById(catalogDb, entry.eventId) : null;
  const eventTitle = event?.title ?? entry.eventId;

  if (entry.status !== "WAITING") {
    return c.render(
      <WaitlistCancelPage
        copy={copy}
        entryId={entry.id}
        eventId={entry.eventId}
        eventTitle={eventTitle}
        locale={locale}
        view="success"
      />,
      {
        locale,
        title: copy.successTitle,
        robots: "noindex",
        canonicalPath: cancelPath,
      },
    );
  }

  return c.render(
    <WaitlistCancelPage
      copy={copy}
      entryId={entry.id}
      eventId={entry.eventId}
      eventTitle={eventTitle}
      locale={locale}
      view="confirm"
    />,
    {
      locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: cancelPath,
    },
  );
});

export const POST = createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const entryId = c.req.param("id");
  const copy = getWaitlistCancelCopy(locale);
  const cancelPath = `/${locale}/waitlist/${entryId}/cancel`;

  if (!entryId) {
    return c.redirect(`/${locale}/events`, 302);
  }

  const session = await getSessionIfConfigured(c);
  if (!session?.user) {
    return c.redirect(buildLoginRedirectUrl(locale, cancelPath), 302);
  }

  const { db } = getAuthOptions();
  const entry = await db.query.waitlistEntries.findFirst({
    where: (fields, { eq: eqOp }) => eqOp(fields.id, entryId),
  });

  if (!entry || entry.userId !== session.user.id) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: copy.notFoundTitle,
      robots: "noindex",
    });
  }

  const catalogDb = getCatalogDb();
  const event = catalogDb ? await getPublicEventById(catalogDb, entry.eventId) : null;
  const eventTitle = event?.title ?? entry.eventId;

  try {
    await cancelWaitlistEntry(db, {
      entryId,
      userId: session.user.id,
    });

    return c.render(
      <WaitlistCancelPage
        copy={copy}
        entryId={entryId}
        eventId={entry.eventId}
        eventTitle={eventTitle}
        locale={locale}
        view="success"
      />,
      {
        locale,
        title: copy.successTitle,
        robots: "noindex",
        canonicalPath: cancelPath,
      },
    );
  } catch (error) {
    let errorMessage = copy.errorGeneric;
    if (isWaitlistError(error)) {
      if (error.code === "FORBIDDEN") {
        errorMessage = copy.errorForbidden;
      } else if (error.code === "NOT_WAITING") {
        errorMessage = copy.errorNotWaiting;
      } else if (error.code === "NOT_FOUND") {
        c.status(404);
        return c.render(<NotFoundPage locale={locale} />, {
          locale,
          title: copy.notFoundTitle,
          robots: "noindex",
        });
      }
    }

    return c.render(
      <WaitlistCancelPage
        copy={copy}
        entryId={entryId}
        errorMessage={errorMessage}
        eventId={entry.eventId}
        eventTitle={eventTitle}
        locale={locale}
        view="confirm"
      />,
      {
        locale,
        title: copy.title,
        robots: "noindex",
        canonicalPath: cancelPath,
      },
    );
  }
});
