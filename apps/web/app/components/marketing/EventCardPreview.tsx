import { Card, Heading, Link, Paragraph } from "@heroui/react";
import type { Locale } from "../../lib/locale";
import type { MockDiscoverEvent } from "../../lib/mock/discover-data";

type EventCardPreviewProps = {
  event: MockDiscoverEvent;
  locale: Locale;
  ctaHref?: string;
};

function formatEventDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(isoDate));
}

function guestCtaLabel(locale: Locale): string {
  return locale === "de" ? "Mehr sehen" : "See details";
}

export function EventCardPreview({ event, locale, ctaHref = "#" }: EventCardPreviewProps) {
  const creditLabel =
    locale === "de"
      ? `${event.creditPrice} Credit${event.creditPrice === 1 ? "" : "s"}`
      : `${event.creditPrice} credit${event.creditPrice === 1 ? "" : "s"}`;

  return (
    <Card className="event-card-preview">
      <Card.Header
        aria-hidden="true"
        className={`event-card-preview__header event-card-preview__image event-card-preview__image--${event.imageVariant}`}
      />
      <Card.Content className="flex flex-col gap-2">
        <Card.Title>
          <Heading level={3}>{event.title}</Heading>
        </Card.Title>
        <Paragraph color="muted" size="sm">
          {event.partnerName}
        </Paragraph>
        <Paragraph size="sm">{formatEventDate(event.date, locale)}</Paragraph>
      </Card.Content>
      <Card.Footer className="flex items-center justify-between gap-3">
        <Paragraph className="font-semibold uppercase" size="sm">
          {creditLabel}
        </Paragraph>
        <Link className="button button--secondary button--md" href={ctaHref}>
          {guestCtaLabel(locale)}
        </Link>
      </Card.Footer>
    </Card>
  );
}
