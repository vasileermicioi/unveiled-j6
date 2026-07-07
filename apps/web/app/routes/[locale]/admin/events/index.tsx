import { countEvents, ensureImageVariantsUploaded, listEvents } from "@unveiled/db";
import { buildVariantUrl } from "@unveiled/images/urls";
import { createRoute } from "honox/factory";

import { AdminEventsListPage } from "../../../../components/admin/AdminEventsListPage";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import {
  buildAdminListQueryString,
  guardAdminRoute,
  parseAdminListQuery,
} from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

function buildEventImageUrls(
  events: Awaited<ReturnType<typeof listEvents>>,
): Record<string, string | undefined> {
  const imageUrls: Record<string, string | undefined> = {};

  for (const event of events) {
    try {
      imageUrls[event.id] = buildVariantUrl(event.imageId, "small-320.webp");
    } catch {
      imageUrls[event.id] = undefined;
    }
  }

  return imageUrls;
}

async function ensureEventImages(
  db: Parameters<typeof ensureImageVariantsUploaded>[0],
  events: Awaited<ReturnType<typeof listEvents>>,
): Promise<void> {
  const imageIds = [...new Set(events.map((event) => event.imageId))];
  await Promise.all(imageIds.map((imageId) => ensureImageVariantsUploaded(db, imageId)));
}

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const listQuery = parseAdminListQuery(new URL(c.req.url));
  const { db } = getAuthOptions();
  const [events, total] = await Promise.all([
    listEvents(db, {
      q: listQuery.q || undefined,
      limit: listQuery.limit,
      offset: listQuery.offset,
    }),
    countEvents(db, { q: listQuery.q || undefined }),
  ]);

  await ensureEventImages(db, events);

  const copy = getAdminCopy(guard.locale);
  const queryString = buildAdminListQueryString({
    q: listQuery.q || undefined,
    page: listQuery.page,
  });

  return renderAdminPage(
    c,
    <AdminEventsListPage
      events={events}
      imageUrls={buildEventImageUrls(events)}
      locale={guard.locale}
      query={{
        q: listQuery.q,
        page: listQuery.page,
        limit: listQuery.limit,
      }}
      total={total}
    />,
    {
      locale: guard.locale,
      title: copy.eventsTitle,
      subtitle: copy.eventsSubtitle,
      canonicalPath: `/${guard.locale}/admin/events${queryString}`,
    },
  );
});
