import { getPublicEventById, isBookingEligibleStatus } from "@unveiled/db";
import { createRoute } from "honox/factory";

import {
  EventDetailPage,
  type EventDetailViewer,
} from "../../../components/catalog/EventDetailPage";
import { NotFoundPage } from "../../../components/NotFoundPage";
import { getAuthOptions, getSessionIfConfigured } from "../../../lib/auth";
import { getCatalogDb } from "../../../lib/catalog-db";
import type { Locale } from "../../../lib/locale";
import { isValidLocale, localizedPath } from "../../../lib/locale";
import { parseReturnTo } from "../../../lib/post-auth-redirect";
import { buildEventJsonLd, eventDetailPageMeta } from "../../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

function parseQtyParam(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  if (n > 3) {
    return 3;
  }
  return n;
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const eventId = c.req.param("id");
  if (!eventId) {
    c.status(404);
    return c.render(<NotFoundPage locale={locale} />, {
      locale,
      title: "Not found",
      robots: "noindex",
    });
  }

  const pathname = new URL(c.req.url).pathname;

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

  let viewer: EventDetailViewer = { kind: "guest" };
  const session = await getSessionIfConfigured(c);
  if (session?.user) {
    const { db: authDb } = getAuthOptions();
    const subscription = await authDb.query.subscriptions.findFirst({
      where: (fields, { eq }) => eq(fields.userId, session.user.id),
    });
    if (subscription?.status === "PAST_DUE") {
      viewer = { kind: "past_due" };
    } else if (isBookingEligibleStatus(subscription?.status)) {
      viewer = { kind: "eligible" };
    } else {
      viewer = { kind: "membership_required" };
    }
  }

  const url = new URL(c.req.url);
  const safeReturnTo = parseReturnTo(url.searchParams.get("returnTo") ?? undefined, locale);
  const closeHref =
    viewer.kind === "guest"
      ? localizedPath(locale, "")
      : (safeReturnTo ?? localizedPath(locale, "events"));
  const defaultQty = parseQtyParam(url.searchParams.get("qty") ?? undefined);

  const meta = eventDetailPageMeta(event);
  const jsonLd = buildEventJsonLd(event);

  return c.render(
    <>
      <EventDetailPage
        closeHref={closeHref}
        defaultQty={defaultQty}
        event={event}
        locale={locale}
        viewer={viewer}
      />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </>,
    {
      locale,
      title: meta.title,
      description: meta.description,
      canonicalPath: pathname,
      ogImage: meta.ogImage,
      robots: meta.robots,
    },
  );
});
