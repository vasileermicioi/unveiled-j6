import { listMemberFeedEvents, listPartners, listSavedEventIds } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { EventFeedPage } from "../../../components/discovery/EventFeedPage";
import { getEventCategoryOptions } from "../../../lib/admin-content";
import { getAuthOptions } from "../../../lib/auth";
import { toEventCardItem } from "../../../lib/catalog-mappers";
import {
  buildEventFeedQueryString,
  eventFeedPageRedirectPath,
  parseEventFeedQuery,
} from "../../../lib/event-feed";
import { getEventFeedCopy } from "../../../lib/event-feed-content";
import { guardMemberFeedRoute } from "../../../lib/event-feed-route";

const PARTNER_FILTER_LIMIT = 500;

export default createRoute(async (c) => {
  const guard = await guardMemberFeedRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const feedQuery = parseEventFeedQuery(new URL(c.req.url));
  const feedPath = `/${guard.locale}/events`;
  const userId = guard.session.user.id;

  const [subscription, feed, partners, savedIds] = await Promise.all([
    db.query.subscriptions.findFirst({
      where: (fields, { eq }) => eq(fields.userId, userId),
    }),
    listMemberFeedEvents(db, {
      category: feedQuery.category,
      partnerId: feedQuery.partnerId,
      from: feedQuery.from,
      to: feedQuery.to,
      page: feedQuery.page,
    }),
    listPartners(db, { limit: PARTNER_FILTER_LIMIT }),
    listSavedEventIds(db, userId),
  ]);

  const redirectPath = eventFeedPageRedirectPath(feedPath, feedQuery, feed.total);
  if (redirectPath) {
    return c.redirect(redirectPath, 302);
  }

  const subscriptionActive =
    subscription?.status === "ACTIVE" || subscription?.status === "CANCELLED_PENDING";
  const copy = getEventFeedCopy(guard.locale);
  const queryString = buildEventFeedQueryString({
    category: feedQuery.category,
    partnerId: feedQuery.partnerId,
    from: feedQuery.from,
    to: feedQuery.to,
    page: feedQuery.page,
  });

  return c.render(
    <EventFeedPage
      categoryOptions={getEventCategoryOptions(guard.locale)}
      events={feed.items.map(toEventCardItem)}
      locale={guard.locale}
      partnerOptions={partners.map((partner) => ({
        id: partner.id,
        label: partner.name,
      }))}
      query={feedQuery}
      savedEventIds={new Set(savedIds)}
      subscriptionActive={subscriptionActive}
      total={feed.total}
    />,
    {
      locale: guard.locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: `${feedPath}${queryString}`,
    },
  );
});
