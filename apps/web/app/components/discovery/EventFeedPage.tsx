import { Alert, Card, Link, Paragraph, Surface } from "@heroui/react";
import { EventCard, type EventCardItem, type EventCardViewerState } from "@unveiled/ui";

import {
  buildEventFeedQueryString,
  type EventFeedQuery,
  MEMBER_FEED_PAGE_SIZE,
} from "../../lib/event-feed";
import { getEventFeedCopy } from "../../lib/event-feed-content";
import { getEventMapCopy } from "../../lib/event-map-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { eventSavePath, eventUnsavePath } from "../../lib/saved-events";
import type { AdminFormSelectOption } from "../admin/AdminFormSelect";
import { PageSectionHeader } from "../marketing/PageSectionHeader";

import { EventFeedFilters } from "./EventFeedFilters";
import { EventFeedPagination } from "./EventFeedPagination";

export type EventFeedPageProps = {
  locale: Locale;
  query: EventFeedQuery;
  events: EventCardItem[];
  total: number;
  subscriptionActive: boolean;
  savedEventIds: ReadonlySet<string>;
  categoryOptions: AdminFormSelectOption[];
  partnerOptions: AdminFormSelectOption[];
};

export function resolveEventFeedCtaHref(locale: Locale, event: EventCardItem): string {
  return localizedPath(locale, `events/${event.id}`);
}

export function EventFeedPage({
  locale,
  query,
  events,
  total,
  subscriptionActive,
  savedEventIds,
  categoryOptions,
  partnerOptions,
}: EventFeedPageProps) {
  const copy = getEventFeedCopy(locale);
  const mapCopy = getEventMapCopy(locale);
  const feedPath = `/${locale}/events`;
  const queryString = buildEventFeedQueryString({
    category: query.category,
    partnerId: query.partnerId,
    from: query.from,
    to: query.to,
    page: query.page,
  });
  const mapQueryString = buildEventFeedQueryString({
    category: query.category,
    partnerId: query.partnerId,
    from: query.from,
    to: query.to,
  });
  const mapHref = `/${locale}/events/map${mapQueryString}`;
  const returnTo = `${feedPath}${queryString}`;

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        variant="transparent"
      >
        <PageSectionHeader
          className="min-w-0 flex-1"
          eyebrow={copy.eyebrow}
          headline={copy.title}
        />
        <Link className="button button--secondary button--md" href={mapHref}>
          {mapCopy.mapView}
        </Link>
      </Surface>

      {!subscriptionActive ? (
        <Alert status="warning">
          <Alert.Content>
            <Alert.Title>{copy.subscriptionGateTitle}</Alert.Title>
            <Alert.Description>{copy.subscriptionGateBody}</Alert.Description>
          </Alert.Content>
          <Link
            className="button button--primary button--md"
            href={localizedPath(locale, "membership")}
          >
            {copy.subscriptionGateCta}
          </Link>
        </Alert>
      ) : null}

      <Card>
        <Card.Content>
          <EventFeedFilters
            action={feedPath}
            categoryOptions={categoryOptions}
            locale={locale}
            partnerOptions={partnerOptions}
            query={query}
          />
        </Card.Content>
      </Card>

      {events.length === 0 ? (
        <Card>
          <Card.Content className="flex flex-col items-start gap-4">
            <Paragraph>{copy.noResults}</Paragraph>
            <Link className="button button--secondary button--md" href={feedPath}>
              {copy.reset}
            </Link>
          </Card.Content>
        </Card>
      ) : (
        <Surface
          className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variant="transparent"
        >
          {events.map((event) => {
            const saved = savedEventIds.has(event.id);
            const viewer: EventCardViewerState = {
              kind: "member",
              subscriptionActive,
              saved,
            };

            return (
              <EventCard
                bookmarkFormAction={
                  saved ? eventUnsavePath(locale, event.id) : eventSavePath(locale, event.id)
                }
                bookmarkReturnTo={returnTo}
                ctaHref={resolveEventFeedCtaHref(locale, event)}
                event={event}
                key={event.id}
                locale={locale}
                viewer={viewer}
              />
            );
          })}
        </Surface>
      )}

      <EventFeedPagination
        basePath={feedPath}
        locale={locale}
        page={query.page}
        pageSize={MEMBER_FEED_PAGE_SIZE}
        queryString={queryString}
        total={total}
      />
    </Surface>
  );
}
