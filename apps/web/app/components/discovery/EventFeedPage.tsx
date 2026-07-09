import { Alert, Card, Heading, Link, Paragraph, Surface } from "@heroui/react";
import { EventCard, type EventCardItem, type EventCardViewerState } from "@unveiled/ui";

import {
  buildEventFeedQueryString,
  type EventFeedQuery,
  MEMBER_FEED_PAGE_SIZE,
} from "../../lib/event-feed";
import { getEventFeedCopy } from "../../lib/event-feed-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { AdminFormSelectOption } from "../admin/AdminFormSelect";

import { EventFeedFilters } from "./EventFeedFilters";
import { EventFeedPagination } from "./EventFeedPagination";

export type EventFeedPageProps = {
  locale: Locale;
  query: EventFeedQuery;
  events: EventCardItem[];
  total: number;
  subscriptionActive: boolean;
  categoryOptions: AdminFormSelectOption[];
  partnerOptions: AdminFormSelectOption[];
};

export function resolveEventFeedCtaHref(
  locale: Locale,
  event: EventCardItem,
  subscriptionActive: boolean,
): string {
  const soldOut = event.remainingCapacity <= 0;
  if (soldOut || subscriptionActive) {
    return localizedPath(locale, `events/${event.id}`);
  }

  return localizedPath(locale, "membership");
}

export function EventFeedPage({
  locale,
  query,
  events,
  total,
  subscriptionActive,
  categoryOptions,
  partnerOptions,
}: EventFeedPageProps) {
  const copy = getEventFeedCopy(locale);
  const feedPath = `/${locale}/events`;
  const queryString = buildEventFeedQueryString({
    category: query.category,
    partnerId: query.partnerId,
    from: query.from,
    to: query.to,
    page: query.page,
  });
  const viewer: EventCardViewerState = {
    kind: "member",
    subscriptionActive,
    saved: false,
  };

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface className="flex flex-col gap-2" variant="transparent">
        <Heading level={1}>{copy.title}</Heading>
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
      ) : (
        <Alert status="accent">
          <Alert.Content>
            <Alert.Title>{copy.bookingComingTitle}</Alert.Title>
            <Alert.Description>{copy.bookingComingBody}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

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
        <Surface className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" variant="transparent">
          {events.map((event) => (
            <EventCard
              ctaHref={resolveEventFeedCtaHref(locale, event, subscriptionActive)}
              event={event}
              key={event.id}
              locale={locale}
              viewer={viewer}
            />
          ))}
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
