import { Alert, Heading, Link, Paragraph, Surface } from "@heroui/react";
import { MEMBER_FEED_MAP_MAX } from "@unveiled/db";

import EventMap, { type EventMapMarker } from "../../islands/EventMap";
import { buildEventFeedQueryString, type EventFeedQuery } from "../../lib/event-feed";
import { getEventMapCopy } from "../../lib/event-map-content";
import type { Locale } from "../../lib/locale";

export type EventMapPageProps = {
  locale: Locale;
  query: Pick<EventFeedQuery, "category" | "partnerId" | "from" | "to">;
  markers: EventMapMarker[];
  /** Total matching feed filters (before coord filter / map cap). */
  filteredTotal: number;
  /** Events returned by map query before coord filter (may be capped). */
  mapItemCount: number;
};

export function EventMapPage({
  locale,
  query,
  markers,
  filteredTotal,
  mapItemCount,
}: EventMapPageProps) {
  const copy = getEventMapCopy(locale);
  const filterQueryString = buildEventFeedQueryString({
    category: query.category,
    partnerId: query.partnerId,
    from: query.from,
    to: query.to,
  });
  const listHref = `/${locale}/events${filterQueryString}`;
  const showCapWarning = filteredTotal > MEMBER_FEED_MAP_MAX;
  const showEmptyFiltered = filteredTotal === 0;
  const showEmptyMarkers = filteredTotal > 0 && markers.length === 0;

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        variant="transparent"
      >
        <Heading level={1}>{copy.title}</Heading>
        <Link className="button button--secondary button--md" href={listHref}>
          {copy.listView}
        </Link>
      </Surface>

      {showCapWarning ? (
        <Alert status="warning">
          <Alert.Content>
            <Alert.Description>
              {copy.capWarning(Math.min(mapItemCount, MEMBER_FEED_MAP_MAX), filteredTotal)}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {showEmptyFiltered ? (
        <Alert status="accent">
          <Alert.Content>
            <Alert.Description>{copy.emptyFiltered}</Alert.Description>
          </Alert.Content>
          <Link className="button button--secondary button--md" href={listHref}>
            {copy.listView}
          </Link>
        </Alert>
      ) : null}

      {showEmptyMarkers ? <Paragraph>{copy.emptyMarkers}</Paragraph> : null}

      {!showEmptyFiltered ? <EventMap locale={locale} markers={markers} /> : null}
    </Surface>
  );
}
