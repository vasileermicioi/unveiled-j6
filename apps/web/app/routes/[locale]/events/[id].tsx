import {
  futureOccurrences,
  getPartnerById,
  getPublicEventById,
  isBookingEligibleStatus,
  isOccurrenceUpcoming,
  listActiveBookedOccurrenceInstants,
  listEventGalleryImages,
  maxBookableTickets,
} from "@unveiled/db";
import { getImageCredit } from "@unveiled/db/catalog/images";
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

  const future = futureOccurrences(
    event.dateTimes,
    event.occurrenceCreditPrices,
    new Date(),
    event.timingMode,
  );
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

  const slotStillOpen = isOccurrenceUpcoming(event.dateTime, new Date(), event.timingMode);
  const [galleryRows, partner, heroCredit, bookedInstants] = await Promise.all([
    listEventGalleryImages(db, eventId),
    getPartnerById(db, event.partnerId),
    getImageCredit(db, event.imageId).catch(() => null),
    viewer.kind === "eligible" && session?.user && slotStillOpen
      ? listActiveBookedOccurrenceInstants(db, session.user.id, event.id)
      : Promise.resolve([] as Date[]),
  ]);
  const bookedOccurrenceIsos =
    viewer.kind === "eligible" && slotStillOpen
      ? bookedInstants.map((instant) => instant.toISOString())
      : undefined;
  const galleryImages = toPublicEventGalleryImages(galleryRows);

  let partnerLogoUrl: string | undefined;
  let logoCredit: string | null = null;
  if (partner?.logoImageId) {
    try {
      partnerLogoUrl = buildVariantUrl(partner.logoImageId, "medium-640.webp");
    } catch {
      partnerLogoUrl = undefined;
    }
    try {
      logoCredit = await getImageCredit(db, partner.logoImageId);
    } catch {
      logoCredit = null;
    }
  }

  const meta = eventDetailPageMeta(event, locale);
  const jsonLd = buildEventJsonLd(event, locale);

  return c.render(
    <>
      <EventDetailPage
        closeHref={closeHref}
        defaultDateTimeIso={defaultDateTimeIso}
        event={event}
        galleryImages={galleryImages}
        heroCredit={heroCredit}
        locale={locale}
        maxQty={maxQty}
        occurrences={occurrences}
        bookedOccurrenceIsos={bookedOccurrenceIsos}
        partnerAttribution={{
          name: event.partnerName,
          logoUrl: partnerLogoUrl,
          hasOpeningHours: partner?.hasOpeningHours ?? false,
          openingHours: partner?.openingHours ?? null,
          barrierFree: partner?.barrierFree ?? null,
          logoCredit,
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
