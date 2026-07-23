import { Paragraph, Surface } from "@heroui/react";
import { EventCard, type EventCardItem } from "@unveiled/ui";

import type { DiscoverPartnerTile } from "../../lib/catalog-mappers";
import type { DiscoverContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { PageSectionHeader } from "./PageSectionHeader";

const PARTNERS_HEADING_ID = "discover-partners-heading";

/** Enough tiles per marquee group to fill wide viewports (item ≈ 13rem with gap). */
const MARQUEE_MIN_ITEMS_PER_GROUP = 10;

type DiscoverPageProps = {
  content: DiscoverContent;
  locale: Locale;
  events: EventCardItem[];
  partners: DiscoverPartnerTile[];
};

type MarqueeSlot = {
  partner: DiscoverPartnerTile;
  /** Stable key across duplicate partner rows in the padded sequence. */
  slotKey: string;
  announce: boolean;
};

function buildMarqueeSlots(partners: DiscoverPartnerTile[]): MarqueeSlot[] {
  if (partners.length === 0) {
    return [];
  }
  // Always include every partner once; pad with repeats so the strip fills wide viewports.
  const target = Math.max(MARQUEE_MIN_ITEMS_PER_GROUP, partners.length);
  const slots: MarqueeSlot[] = [];
  let cycle = 0;
  while (slots.length < target) {
    for (const partner of partners) {
      slots.push({
        partner,
        slotKey: `${partner.id}-c${cycle}`,
        announce: cycle === 0,
      });
      if (slots.length >= target) {
        break;
      }
    }
    cycle += 1;
  }
  return slots;
}

function PartnerLogoCell({
  partner,
  announce = false,
}: {
  partner: DiscoverPartnerTile;
  /** Only the first group’s first pass of each partner is announced. */
  announce?: boolean;
}) {
  return (
    <Surface
      aria-hidden={announce ? undefined : true}
      aria-label={announce ? partner.name : undefined}
      className="discover-partners__item"
      variant="transparent"
    >
      {partner.logoUrl ? (
        <img
          alt=""
          className="discover-partners__logo"
          decoding="async"
          // Eager: clones start off-screen; lazy leaves blank cells as they scroll in.
          loading="eager"
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
  const marqueeSlots = buildMarqueeSlots(partners);

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
            className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
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
              {/* Two identical groups: translateX(-50%) loops without a seam. */}
              <Surface className="discover-partners__group" variant="transparent">
                {marqueeSlots.map((slot) => (
                  <PartnerLogoCell
                    announce={slot.announce}
                    key={`a-${slot.slotKey}`}
                    partner={slot.partner}
                  />
                ))}
              </Surface>
              <Surface
                aria-hidden="true"
                className="discover-partners__group discover-partners__group--clone"
                variant="transparent"
              >
                {marqueeSlots.map((slot) => (
                  <PartnerLogoCell key={`b-${slot.slotKey}`} partner={slot.partner} />
                ))}
              </Surface>
            </Surface>
          </Surface>
        </Surface>
      ) : null}
    </Surface>
  );
}
