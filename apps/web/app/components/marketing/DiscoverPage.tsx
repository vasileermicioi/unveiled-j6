import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";

import type { DiscoverContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import {
  MOCK_DISCOVER_EVENTS,
  MOCK_DISCOVER_PARTNERS,
  MOCK_DISCOVER_STATS,
} from "../../lib/mock/discover-data";
import { EventCardPreview } from "./EventCardPreview";
import { SectionCard } from "./SectionCard";

type DiscoverPageProps = {
  content: DiscoverContent;
  locale: Locale;
};

export function DiscoverPage({ content, locale }: DiscoverPageProps) {
  const events = MOCK_DISCOVER_EVENTS.slice(0, 6);
  const partners = MOCK_DISCOVER_PARTNERS.slice(0, 8);

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8"
      variant="transparent"
    >
      <Card className="discover-hero">
        <Card.Content className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <Surface className="flex flex-col gap-4" variant="transparent">
            <Paragraph className="uppercase tracking-wide" color="muted" size="sm">
              {content.hero.eyebrow}
            </Paragraph>
            <Heading level={1}>{content.hero.headline}</Heading>
            <Paragraph color="muted">{content.hero.subheadline}</Paragraph>
            <Surface className="flex flex-col gap-3 sm:flex-row" variant="transparent">
              <Link
                className="button button--primary button--md"
                href={localizedPath(locale, "membership")}
              >
                {content.hero.ctaMembership}
              </Link>
              <Link className="button button--secondary button--md" href="#events">
                {content.hero.ctaBrowseEvents}
              </Link>
            </Surface>
          </Surface>

          <Surface className="flex flex-col gap-4" variant="transparent">
            <Surface
              className="discover-stat-tile discover-stat-tile--accent"
              variant="transparent"
            >
              <Paragraph className="uppercase tracking-wide" size="xs">
                {content.hero.stats.liveFeed.label}
              </Paragraph>
              <Paragraph className="discover-stat-tile__value">
                {MOCK_DISCOVER_STATS.eventCount}
              </Paragraph>
              <Paragraph color="muted" size="sm">
                {content.hero.stats.liveFeed.suffix}
              </Paragraph>
            </Surface>
            <Surface
              className="discover-stat-tile discover-stat-tile--surface"
              variant="transparent"
            >
              <Paragraph className="uppercase tracking-wide" size="xs">
                {content.hero.stats.partnerVenues.label}
              </Paragraph>
              <Paragraph className="discover-stat-tile__value">
                {MOCK_DISCOVER_STATS.partnerCount}
              </Paragraph>
              <Paragraph color="muted" size="sm">
                {content.hero.stats.partnerVenues.suffix}
              </Paragraph>
            </Surface>
            <Surface className="discover-stat-tile discover-stat-tile--muted" variant="transparent">
              <Paragraph className="uppercase tracking-wide" size="xs">
                {content.hero.stats.membership.label}
              </Paragraph>
              <Paragraph size="sm">{content.hero.stats.membership.body}</Paragraph>
            </Surface>
          </Surface>
        </Card.Content>
      </Card>

      <Surface className="grid gap-6 md:grid-cols-3" variant="transparent">
        {content.valueProps.map((item) => (
          <SectionCard description={item.body} key={item.title} title={item.title} />
        ))}
      </Surface>

      <Surface className="flex flex-col gap-6" id="events" variant="transparent">
        <Surface className="flex flex-col gap-2" variant="transparent">
          <Paragraph className="uppercase tracking-wide" color="muted" size="sm">
            {content.livePreview.eyebrow}
          </Paragraph>
          <Heading level={2}>{content.livePreview.headline}</Heading>
        </Surface>

        {events.length > 0 ? (
          <Surface className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" variant="transparent">
            {events.map((event) => (
              <EventCardPreview event={event} key={event.id} locale={locale} />
            ))}
          </Surface>
        ) : (
          <Surface className="discover-empty-state" variant="transparent">
            <Paragraph>{content.livePreview.emptyState}</Paragraph>
          </Surface>
        )}
      </Surface>

      <Surface className="flex flex-col gap-6" variant="transparent">
        <Surface className="flex flex-col gap-2" variant="transparent">
          <Paragraph className="uppercase tracking-wide" color="muted" size="sm">
            {content.categories.eyebrow}
          </Paragraph>
          <Heading level={2}>{content.categories.headline}</Heading>
          <Paragraph color="muted">{content.categories.subtext}</Paragraph>
        </Surface>

        <Surface className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" variant="transparent">
          {content.categories.items.map((label, index) => (
            <Surface className="discover-category-tile" key={label} variant="transparent">
              <Paragraph className="discover-category-tile__number">
                {String(index + 1).padStart(2, "0")}
              </Paragraph>
              <Paragraph className="font-semibold uppercase">{label}</Paragraph>
            </Surface>
          ))}
        </Surface>

        <Card className="discover-callout">
          <Card.Header>
            <Card.Title>
              <Heading level={3}>{content.categories.callout.title}</Heading>
            </Card.Title>
            <Card.Description>{content.categories.callout.body}</Card.Description>
          </Card.Header>
          <Card.Content>
            <Link
              className="discover-callout__email"
              href={`mailto:${content.categories.callout.email}`}
            >
              {content.categories.callout.cta}
            </Link>
          </Card.Content>
        </Card>
      </Surface>

      <Surface className="flex flex-col gap-6" variant="transparent">
        <Paragraph className="uppercase tracking-wide" color="muted" size="sm">
          {content.partners.eyebrow}
        </Paragraph>

        <Surface className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variant="transparent">
          {partners.map((partner) => (
            <Surface className="discover-partner-tile" key={partner.id} variant="transparent">
              <Paragraph aria-hidden="true" className="discover-partner-tile__initial">
                {partner.initial}
              </Paragraph>
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
