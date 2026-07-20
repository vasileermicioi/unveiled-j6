import { Card, Link, Paragraph, Surface } from "@heroui/react";
import { EventCard, type EventCardItem, type EventCardViewerState } from "@unveiled/ui";

import { buildEventFeedQueryString, type EventFeedQuery } from "../../lib/event-feed";
import { getEventFeedCopy } from "../../lib/event-feed-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { eventSavePath, eventUnsavePath } from "../../lib/saved-events";
import type { AdminFormSelectOption } from "../admin/AdminFormSelect";

import { EventDiscoveryShell } from "./EventDiscoveryShell";

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
  const feedPath = `/${locale}/events`;
  const queryString = buildEventFeedQueryString({
    category: query.category,
    partnerId: query.partnerId,
    from: query.from,
    to: query.to,
    page: query.page,
  });
  const returnTo = `${feedPath}${queryString}`;

  return (
    <EventDiscoveryShell
      categoryOptions={categoryOptions}
      locale={locale}
      partnerOptions={partnerOptions}
      query={query}
      subscriptionActive={subscriptionActive}
      total={total}
      view="list"
    >
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
          className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
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
    </EventDiscoveryShell>
  );
}
