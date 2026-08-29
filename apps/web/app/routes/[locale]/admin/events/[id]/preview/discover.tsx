import { resolveEventCopy } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminEventPreviewCardFrame } from "../../../../../../components/admin/AdminEventPreviewCardFrame";
import { AdminEventPreviewChrome } from "../../../../../../components/admin/AdminEventPreviewChrome";
import { adminEventPreviewPath } from "../../../../../../components/admin/admin-tabs";
import { PageSectionHeader } from "../../../../../../components/marketing/PageSectionHeader";
import { getAdminCopy } from "../../../../../../lib/admin-content";
import { loadAdminEventPreview } from "../../../../../../lib/admin-event-preview";
import { toEventCardItem } from "../../../../../../lib/catalog-mappers";
import { getPageContent } from "../../../../../../lib/content";

export default createRoute(async (c) => {
  const loaded = await loadAdminEventPreview(c);
  if (!loaded.ok) {
    return loaded.response;
  }

  const { locale, event } = loaded;
  const copy = getAdminCopy(locale);
  const eventCopy = resolveEventCopy(event, locale);
  const card = toEventCardItem(event, locale);
  const discover = getPageContent(locale, "discover");

  return c.render(
    <>
      <AdminEventPreviewChrome
        eventId={event.id}
        locale={locale}
        published={event.published}
        surface="discover"
      />
      <AdminEventPreviewCardFrame
        ctaHref={adminEventPreviewPath(locale, event.id)}
        event={card}
        header={
          <PageSectionHeader
            eyebrow={discover.livePreview.eyebrow}
            headline={discover.livePreview.headline}
          />
        }
        locale={locale}
        viewer={{ kind: "guest" }}
      />
    </>,
    {
      locale,
      robots: "noindex",
      title: copy.previewDocumentTitle(eventCopy.title),
    },
  );
});
