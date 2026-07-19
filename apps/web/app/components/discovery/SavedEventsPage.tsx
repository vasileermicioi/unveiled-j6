import { Card, Link, Paragraph, Surface } from "@heroui/react";
import { EventCard, type EventCardItem } from "@unveiled/ui";

import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { eventUnsavePath } from "../../lib/saved-events";
import { getSavedEventsCopy } from "../../lib/saved-events-content";
import { PageSectionHeader } from "../marketing/PageSectionHeader";
import { resolveEventFeedCtaHref } from "./EventFeedPage";

export type SavedEventsPageProps = {
  locale: Locale;
  events: EventCardItem[];
  subscriptionActive: boolean;
};

export function SavedEventsPage({ locale, events, subscriptionActive }: SavedEventsPageProps) {
  const copy = getSavedEventsCopy(locale);
  const returnTo = `/${locale}/saved`;

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <PageSectionHeader eyebrow={copy.eyebrow} headline={copy.title} />

      {events.length === 0 ? (
        <Card>
          <Card.Content className="flex flex-col items-start gap-4">
            <Paragraph>{copy.empty}</Paragraph>
            <Link
              className="button button--secondary button--md"
              href={localizedPath(locale, "events")}
            >
              {copy.browseEvents}
            </Link>
          </Card.Content>
        </Card>
      ) : (
        <Surface
          className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variant="transparent"
        >
          {events.map((event) => (
            <EventCard
              bookmarkFormAction={eventUnsavePath(locale, event.id)}
              bookmarkReturnTo={returnTo}
              ctaHref={resolveEventFeedCtaHref(locale, event)}
              event={event}
              key={event.id}
              locale={locale}
              viewer={{
                kind: "member",
                subscriptionActive,
                saved: true,
              }}
            />
          ))}
        </Surface>
      )}
    </Surface>
  );
}
