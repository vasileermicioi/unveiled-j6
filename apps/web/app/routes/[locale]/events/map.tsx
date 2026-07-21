import { listMemberFeedEvents, listPartners } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { EventMapPage } from "../../../components/discovery/EventMapPage";
import type { EventMapMarker } from "../../../islands/EventMap";
import { getEventCategoryOptions } from "../../../lib/admin-content";
import { getAuthOptions } from "../../../lib/auth";
import {
  buildEventFeedQueryString,
  eventFeedPageRedirectPath,
  parseEventFeedQuery,
} from "../../../lib/event-feed";
import { guardMemberFeedRoute } from "../../../lib/event-feed-route";
import { getEventMapCopy } from "../../../lib/event-map-content";

const PARTNER_FILTER_LIMIT = 500;

function parseCoordinate(value: string | null | undefined): number | null {
  if (value == null || !String(value).trim()) {
    return null;
  }
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export default createRoute(async (c) => {
  const guard = await guardMemberFeedRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const feedQuery = parseEventFeedQuery(new URL(c.req.url));
  const mapPath = `/${guard.locale}/events/map`;
  const copy = getEventMapCopy(guard.locale);

  const [feed, partners] = await Promise.all([
    listMemberFeedEvents(db, {
      category: feedQuery.category,
      partnerId: feedQuery.partnerId,
      from: feedQuery.from,
      to: feedQuery.to,
      page: feedQuery.page,
    }),
    listPartners(db, { limit: PARTNER_FILTER_LIMIT }),
  ]);

  const redirectPath = eventFeedPageRedirectPath(mapPath, feedQuery, feed.total);
  if (redirectPath) {
    return c.redirect(redirectPath, 302);
  }

  const markers: EventMapMarker[] = [];
  for (const event of feed.items) {
    const lat = parseCoordinate(event.lat);
    const lng = parseCoordinate(event.lng);
    if (lat == null || lng == null) {
      continue;
    }
    // Skip Null Island (0,0) — often a missing geocode placeholder.
    if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) {
      continue;
    }

    markers.push({
      id: event.id,
      title: event.title,
      partnerName: event.partnerName,
      address: event.address,
      lat,
      lng,
      href: `/${guard.locale}/events/${event.id}`,
    });
  }

  const queryString = buildEventFeedQueryString({
    category: feedQuery.category,
    partnerId: feedQuery.partnerId,
    from: feedQuery.from,
    to: feedQuery.to,
    page: feedQuery.page,
  });

  return c.render(
    <EventMapPage
      categoryOptions={getEventCategoryOptions(guard.locale)}
      filteredTotal={feed.total}
      locale={guard.locale}
      markers={markers}
      partnerOptions={partners.map((partner) => ({
        id: partner.id,
        label: partner.name,
      }))}
      query={feedQuery}
    />,
    {
      locale: guard.locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: `${mapPath}${queryString}`,
    },
  );
});
