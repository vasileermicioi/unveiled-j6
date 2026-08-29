import { resolveEventCopy } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminEventPreviewCardFrame } from "../../../../../../components/admin/AdminEventPreviewCardFrame";
import { AdminEventPreviewChrome } from "../../../../../../components/admin/AdminEventPreviewChrome";
import { adminEventPreviewPath } from "../../../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../../../lib/admin-content";
import { loadAdminEventPreview } from "../../../../../../lib/admin-event-preview";
import { toEventCardItem } from "../../../../../../lib/catalog-mappers";

export default createRoute(async (c) => {
  const loaded = await loadAdminEventPreview(c);
  if (!loaded.ok) {
    return loaded.response;
  }

  const { locale, event } = loaded;
  const copy = getAdminCopy(locale);
  const eventCopy = resolveEventCopy(event, locale);
  const card = toEventCardItem(event, locale);

  return c.render(
    <>
      <AdminEventPreviewChrome
        eventId={event.id}
        locale={locale}
        published={event.published}
        surface="browse"
      />
      <AdminEventPreviewCardFrame
        ctaHref={adminEventPreviewPath(locale, event.id)}
        event={card}
        locale={locale}
        note={copy.previewBrowseNote}
        viewer={{ kind: "member", subscriptionActive: true, saved: false }}
      />
    </>,
    {
      locale,
      robots: "noindex",
      title: copy.previewDocumentTitle(eventCopy.title),
    },
  );
});
