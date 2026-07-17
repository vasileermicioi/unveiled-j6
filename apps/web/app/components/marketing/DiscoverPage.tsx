import { Paragraph, Surface } from "@heroui/react";
import { EventCard, type EventCardItem } from "@unveiled/ui";

import type { DiscoverPartnerTile } from "../../lib/catalog-mappers";
import type { DiscoverContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { PageSectionHeader } from "./PageSectionHeader";

const PARTNERS_HEADING_ID = "discover-partners-heading";

type DiscoverPageProps = {
  content: DiscoverContent;
  locale: Locale;
  events: EventCardItem[];
  partners: DiscoverPartnerTile[];
};

function PartnerLogoCell({
  partner,
  clone = false,
}: {
  partner: DiscoverPartnerTile;
  clone?: boolean;
}) {
  return (
    <Surface
      aria-hidden={clone || undefined}
      aria-label={clone ? undefined : partner.name}
      className={
        clone ? "discover-partners__item discover-partners__item--clone" : "discover-partners__item"
      }
      variant="transparent"
    >
      {partner.logoUrl ? (
        <img
          alt=""
          className="discover-partners__logo"
          decoding="async"
          loading="lazy"
          src={partner.logoUrl}
        />
      ) : (
        <Paragraph aria-hidden="true" className="discover-partners__initial">
          {partner.initial}
        </Paragraph>
      )}
    </Surface>
  );
}

export function DiscoverPage({ content, locale, events, partners }: DiscoverPageProps) {
  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8"
      variant="transparent"
    >
      <Surface className="flex flex-col gap-6" id="events" variant="transparent">
        <PageSectionHeader
          eyebrow={content.livePreview.eyebrow}
          headline={content.livePreview.headline}
        />

        {events.length > 0 ? (
          <Surface
            className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variant="transparent"
          >
            {events.map((event) => (
              <EventCard
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

      {partners.length > 0 ? (
        <Surface
          aria-labelledby={PARTNERS_HEADING_ID}
          className="discover-partners flex flex-col gap-6"
          role="region"
          variant="transparent"
        >
          <Paragraph
            className="uppercase tracking-wide"
            color="muted"
            id={PARTNERS_HEADING_ID}
            size="sm"
          >
            {content.partners.eyebrow}
          </Paragraph>

          <Surface className="discover-partners__viewport" variant="transparent">
            <Surface className="discover-partners__track" variant="transparent">
              {partners.map((partner) => (
                <PartnerLogoCell key={`${partner.id}-a`} partner={partner} />
              ))}
              {partners.map((partner) => (
                <PartnerLogoCell clone key={`${partner.id}-b`} partner={partner} />
              ))}
            </Surface>
          </Surface>
        </Surface>
      ) : null}
    </Surface>
  );
}
