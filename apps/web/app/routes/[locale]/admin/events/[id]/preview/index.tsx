import {
  futureOccurrences,
  getPartnerById,
  listEventGalleryImages,
  maxBookableTickets,
  resolveEventCopy,
} from "@unveiled/db";
import { getImageCredit } from "@unveiled/db/catalog/images";
import { buildVariantUrl } from "@unveiled/images/urls";
import { createRoute } from "honox/factory";

import { AdminEventPreviewChrome } from "../../../../../../components/admin/AdminEventPreviewChrome";
import {
  adminEventPreviewPath,
  adminEventsPath,
} from "../../../../../../components/admin/admin-tabs";
import {
  EventDetailPage,
  type EventDetailViewer,
} from "../../../../../../components/catalog/EventDetailPage";
import { getAdminCopy } from "../../../../../../lib/admin-content";
import { loadAdminEventPreview } from "../../../../../../lib/admin-event-preview";
import { getAuthOptions } from "../../../../../../lib/auth";
import { toPublicEventGalleryImages } from "../../../../../../lib/public-event-gallery";

const SYNTHETIC_MEMBER_CREDITS = 99;

function parsePreviewAudience(value: string | null): "guest" | "member" {
  return value === "member" ? "member" : "guest";
}

export default createRoute(async (c) => {
  const loaded = await loadAdminEventPreview(c);
  if (!loaded.ok) {
    return loaded.response;
  }

  const { locale, event } = loaded;
  const audience = parsePreviewAudience(new URL(c.req.url).searchParams.get("audience"));
  const copy = getAdminCopy(locale);
  const eventCopy = resolveEventCopy(event, locale);
  const viewer: EventDetailViewer =
    audience === "member" ? { kind: "eligible" } : { kind: "guest" };

  const future = futureOccurrences(event.dateTimes, event.occurrenceCreditPrices);
  const occurrences =
    viewer.kind === "eligible"
      ? future.map((occurrence) => ({
          startsAtIso: occurrence.startsAt.toISOString(),
          creditPrice: occurrence.creditPrice,
          maxQty: maxBookableTickets({
            viewerKind: "signed-in",
            credits: SYNTHETIC_MEMBER_CREDITS,
            creditPrice: occurrence.creditPrice,
            remainingCapacity: event.remainingCapacity,
          }),
        }))
      : undefined;

  const { db } = getAuthOptions();
  const [galleryRows, partner, heroCredit] = await Promise.all([
    listEventGalleryImages(db, event.id),
    getPartnerById(db, event.partnerId),
    getImageCredit(db, event.imageId).catch(() => null),
  ]);
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

  return c.render(
    <>
      <AdminEventPreviewChrome
        audience={audience}
        eventId={event.id}
        locale={locale}
        published={event.published}
        surface="detail"
      />
      <EventDetailPage
        closeHref={adminEventsPath(locale)}
        defaultDateTimeIso={occurrences?.[0]?.startsAtIso}
        event={event}
        galleryImages={galleryImages}
        heroCredit={heroCredit}
        locale={locale}
        occurrences={occurrences}
        partnerAttribution={{
          name: event.partnerName,
          logoUrl: partnerLogoUrl,
          hasOpeningHours: partner?.hasOpeningHours ?? false,
          openingHours: partner?.openingHours ?? null,
          barrierFree: partner?.barrierFree ?? null,
          logoCredit,
        }}
        preview={{
          primaryHref: adminEventPreviewPath(
            locale,
            event.id,
            audience === "member" ? "member" : undefined,
          ),
          primaryLabel: copy.previewOnlyCta,
        }}
        viewer={viewer}
      />
    </>,
    {
      locale,
      robots: "noindex",
      title: copy.previewDocumentTitle(eventCopy.title),
    },
  );
});
