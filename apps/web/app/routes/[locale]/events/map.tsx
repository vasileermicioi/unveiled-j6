import { listMemberFeedMapEvents } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { EventMapPage } from "../../../components/discovery/EventMapPage";
import type { EventMapMarker } from "../../../islands/EventMap";
import { getAuthOptions } from "../../../lib/auth";
import { buildEventFeedQueryString, parseEventFeedQuery } from "../../../lib/event-feed";
import { guardMemberFeedRoute } from "../../../lib/event-feed-route";
import { getEventMapCopy } from "../../../lib/event-map-content";

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

  const mapResult = await listMemberFeedMapEvents(db, {
    category: feedQuery.category,
    partnerId: feedQuery.partnerId,
    from: feedQuery.from,
    to: feedQuery.to,
  });

  const markers: EventMapMarker[] = [];
  for (const event of mapResult.items) {
    const lat = parseCoordinate(event.lat);
    const lng = parseCoordinate(event.lng);
    if (lat == null || lng == null) {
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
  });

  return c.render(
    <EventMapPage
      filteredTotal={mapResult.total}
      locale={guard.locale}
      mapItemCount={mapResult.items.length}
      markers={markers}
      query={{
        category: feedQuery.category,
        partnerId: feedQuery.partnerId,
        from: feedQuery.from,
        to: feedQuery.to,
      }}
    />,
    {
      locale: guard.locale,
      title: copy.title,
      robots: "noindex",
      canonicalPath: `${mapPath}${queryString}`,
    },
  );
});
