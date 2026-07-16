import { Heading, Paragraph, Surface } from "@heroui/react";
import { EventCard, type EventCardItem } from "@unveiled/ui";

import type { DiscoverPartnerTile } from "../../lib/catalog-mappers";
import type { DiscoverContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

type DiscoverPageProps = {
  content: DiscoverContent;
  locale: Locale;
  events: EventCardItem[];
  partners: DiscoverPartnerTile[];
};

export function DiscoverPage({ content, locale, events, partners }: DiscoverPageProps) {
  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8"
      variant="transparent"
    >
      <Surface className="flex flex-col gap-6" id="events" variant="transparent">
        <Surface className="discover-events-heading flex flex-col gap-2" variant="transparent">
          <Paragraph className="uppercase tracking-wide" color="muted" size="sm">
            {content.livePreview.eyebrow}
          </Paragraph>
          <Heading level={1}>{content.livePreview.headline}</Heading>
        </Surface>

        {events.length > 0 ? (
          <Surface
            className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variant="transparent"
          >
            {events.map((event) => (
              <EventCard
                bookmarkReturnTo={localizedPath(locale, `events/${event.id}`)}
                ctaHref={localizedPath(locale, `events/${event.id}`)}
                event={event}
                key={event.id}
                locale={locale}
              />
            ))}
          </Surface>
        ) : (
          <Surface className="discover-empty-state" variant="transparent">
            <Paragraph>{content.livePreview.emptyState}</Paragraph>
          </Surface>
        )}
      </Surface>

      <Surface className="flex flex-col gap-6" variant="transparent">
        <Paragraph className="uppercase tracking-wide" color="muted" size="sm">
          {content.partners.eyebrow}
        </Paragraph>

        <Surface className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variant="transparent">
          {partners.map((partner) => (
            <Surface className="discover-partner-tile" key={partner.id} variant="transparent">
              {partner.logoUrl ? (
                <img
                  alt=""
                  className="discover-partner-tile__logo"
                  decoding="async"
                  loading="lazy"
                  src={partner.logoUrl}
                />
              ) : (
                <Paragraph aria-hidden="true" className="discover-partner-tile__initial">
                  {partner.initial}
                </Paragraph>
              )}
              <Paragraph className="font-semibold uppercase">{partner.name}</Paragraph>
              <Paragraph color="muted" size="sm">
                {partner.address}
              </Paragraph>
            </Surface>
          ))}
        </Surface>
      </Surface>
    </Surface>
  );
}
