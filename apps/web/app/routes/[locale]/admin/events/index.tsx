import { countEvents, listEvents } from "@unveiled/db";
import { ensureImageVariantsUploaded } from "@unveiled/db/catalog/images";
import { createRoute } from "honox/factory";

import { AdminEventsListPage } from "../../../../components/admin/AdminEventsListPage";
import { getAdminCopy } from "../../../../lib/admin-content";
import { buildEventImageUrls } from "../../../../lib/admin-event-image-urls";
import { renderAdminPage } from "../../../../lib/admin-render";
import {
  adminListPageRedirectPath,
  buildAdminListQueryString,
  guardAdminRoute,
  parseAdminEventsListQuery,
} from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

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

  const listQuery = parseAdminEventsListQuery(new URL(c.req.url));
  const { db } = getAuthOptions();
  const total = await countEvents(db, {
    title: listQuery.title || undefined,
    partner: listQuery.partner || undefined,
    language: listQuery.language || undefined,
  });
  const listPath = `/${guard.locale}/admin/events`;
  const redirectPath = adminListPageRedirectPath(listPath, listQuery, total);
  if (redirectPath) {
    return c.redirect(redirectPath, 302);
  }

  const events = await listEvents(db, {
    title: listQuery.title || undefined,
    partner: listQuery.partner || undefined,
    language: listQuery.language || undefined,
    limit: listQuery.limit,
    offset: listQuery.offset,
    sort: listQuery.sort,
    desc: listQuery.dir === "desc",
  });

  await ensureEventImages(db, events);

  const copy = getAdminCopy(guard.locale);
  const queryString = buildAdminListQueryString({
    title: listQuery.title || undefined,
    partner: listQuery.partner || undefined,
    language: listQuery.language || undefined,
    page: listQuery.page,
    sort: listQuery.sort,
    dir: listQuery.dir,
  });

  return renderAdminPage(
    c,
    <AdminEventsListPage
      events={events}
      imageUrls={buildEventImageUrls(events)}
      locale={guard.locale}
      query={{
        title: listQuery.title,
        partner: listQuery.partner,
        language: listQuery.language,
        page: listQuery.page,
        limit: listQuery.limit,
        sort: listQuery.sort,
        dir: listQuery.dir,
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
