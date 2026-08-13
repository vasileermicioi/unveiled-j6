import {
  futureOccurrences,
  getPartnerById,
  getPublicEventById,
  isBookingEligibleStatus,
  listEventGalleryImages,
  maxBookableTickets,
} from "@unveiled/db";
import { buildVariantUrl } from "@unveiled/images/urls";
import { createRoute } from "honox/factory";

import {
  EventDetailPage,
  type EventDetailViewer,
} from "../../../components/catalog/EventDetailPage";
import { NotFoundPage } from "../../../components/NotFoundPage";
import { getAuthOptions, getSessionIfConfigured } from "../../../lib/auth";
import { getCatalogDb } from "../../../lib/catalog-db";
import { parseDateTimeParam } from "../../../lib/checkout-slot";
import type { Locale } from "../../../lib/locale";
import { isValidLocale, localizedPath } from "../../../lib/locale";
import { parseReturnTo } from "../../../lib/post-auth-redirect";
import { toPublicEventGalleryImages } from "../../../lib/public-event-gallery";
import { buildEventJsonLd, eventDetailPageMeta } from "../../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

function parseQtyParam(raw: string | undefined, maxQty: number): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  if (maxQty < 1) {
    return 1;
  }
  return Math.min(n, maxQty);
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
  let credits = 0;
  const session = await getSessionIfConfigured(c);
  if (session?.user) {
    const { db: authDb } = getAuthOptions();
    const [subscription, user] = await Promise.all([
      authDb.query.subscriptions.findFirst({
        where: (fields, { eq }) => eq(fields.userId, session.user.id),
      }),
      authDb.query.users.findFirst({
        where: (fields, { eq }) => eq(fields.id, session.user.id),
      }),
    ]);
    credits = user?.credits ?? 0;
    if (subscription?.status === "PAST_DUE") {
      viewer = { kind: "past_due" };
    } else if (isBookingEligibleStatus(subscription?.status)) {
      viewer = { kind: "eligible" };
    } else {
      viewer = { kind: "membership_required" };
    }
  }

  const future = futureOccurrences(event.dateTimes, event.occurrenceCreditPrices);
  const occurrences =
    viewer.kind === "eligible"
      ? future.map((occurrence) => ({
          startsAtIso: occurrence.startsAt.toISOString(),
          creditPrice: occurrence.creditPrice,
          maxQty: maxBookableTickets({
            viewerKind: "signed-in",
            credits,
            creditPrice: occurrence.creditPrice,
            remainingCapacity: event.remainingCapacity,
          }),
        }))
      : undefined;
  const defaultSlot = occurrences?.[0];
  const maxQty = maxBookableTickets({
    viewerKind: viewer.kind === "guest" ? "guest" : "signed-in",
    credits,
    creditPrice: defaultSlot?.creditPrice ?? event.creditPrice,
    remainingCapacity: event.remainingCapacity,
  });

  const url = new URL(c.req.url);
  const safeReturnTo = parseReturnTo(url.searchParams.get("returnTo") ?? undefined, locale);
  const closeHref =
    viewer.kind === "guest"
      ? localizedPath(locale, "")
      : (safeReturnTo ?? localizedPath(locale, "events"));
  const requestedDateTime = parseDateTimeParam(url.searchParams.get("dateTime") ?? undefined);
  const defaultDateTimeIso = requestedDateTime
    ? occurrences?.find((occurrence) => occurrence.startsAtIso === requestedDateTime.toISOString())
        ?.startsAtIso
    : defaultSlot?.startsAtIso;
  const defaultQty = parseQtyParam(
    url.searchParams.get("qty") ?? undefined,
    occurrences?.find((occurrence) => occurrence.startsAtIso === defaultDateTimeIso)?.maxQty ??
      maxQty,
  );

  const [galleryRows, partner] = await Promise.all([
    listEventGalleryImages(db, eventId),
    getPartnerById(db, event.partnerId),
  ]);
  const galleryImages = toPublicEventGalleryImages(galleryRows);

  let partnerLogoUrl: string | undefined;
  if (partner?.logoImageId) {
    try {
      partnerLogoUrl = buildVariantUrl(partner.logoImageId, "medium-640.webp");
    } catch {
      partnerLogoUrl = undefined;
    }
  }

  const meta = eventDetailPageMeta(event);
  const jsonLd = buildEventJsonLd(event);

  return c.render(
    <>
      <EventDetailPage
        closeHref={closeHref}
        defaultDateTimeIso={defaultDateTimeIso}
        defaultQty={defaultQty}
        event={event}
        galleryImages={galleryImages}
        locale={locale}
        maxQty={maxQty}
        occurrences={occurrences}
        partnerAttribution={{
          name: event.partnerName,
          logoUrl: partnerLogoUrl,
          hasOpeningHours: partner?.hasOpeningHours ?? false,
          openingHours: partner?.openingHours ?? null,
        }}
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
