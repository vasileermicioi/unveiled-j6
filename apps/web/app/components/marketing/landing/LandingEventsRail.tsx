import { Card, Chip, Link, Paragraph, Surface } from "@heroui/react";
import { Calendar, Lock, MapPin } from "lucide-react";

import LandingImageGallery from "../../../islands/LandingImageGallery";
import type { LandingContent, LandingEventTeaser } from "../../../lib/content/types";
import type { Locale } from "../../../lib/locale";
import { localizedPath } from "../../../lib/locale";
import { PageSectionHeader } from "../PageSectionHeader";
import { landingEventImages } from "./assets";

type LandingEventsRailProps = {
  locale: Locale;
  content: LandingContent["events"];
};

const META_ICON = 14;

export function LandingEventsRail({ locale, content }: LandingEventsRailProps) {
  const loginHref = localizedPath(locale, "login");

  return (
    <Surface
      className="landing-events mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      id="experiences"
      variant="transparent"
    >
      <Surface className="flex max-w-3xl flex-col gap-4" variant="transparent">
        <PageSectionHeader eyebrow={content.eyebrow} headline={content.headline} level={2} />
        <Paragraph color="muted">{content.body}</Paragraph>
      </Surface>

      <Surface
        className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variant="transparent"
      >
        {content.items.map((event) => (
          <LandingEventCard
            event={event}
            key={event.id}
            labels={{
              community: content.communityLabel,
              loginCta: content.loginCta,
              loginShort: content.loginShort,
              nextPhoto: content.nextPhoto,
              previousPhoto: content.previousPhoto,
            }}
            loginHref={loginHref}
          />
        ))}
      </Surface>
    </Surface>
  );
}

type EventLabels = {
  community: string;
  loginCta: string;
  loginShort: string;
  nextPhoto: string;
  previousPhoto: string;
};

function splitCredits(label: string): { value: string; unit: string } {
  const match = label.match(/^(\d+)\s*(.*)$/);
  return { value: match?.[1] ?? label, unit: match?.[2] ?? "" };
}

function LandingEventCard({
  event,
  loginHref,
  labels,
}: {
  event: LandingEventTeaser;
  loginHref: string;
  labels: EventLabels;
}) {
  const images = landingEventImages[event.id] ?? [];
  const firstImage = images[0];
  const credits = splitCredits(event.credits);
  const cardClass = event.locked
    ? "event-card landing-event landing-event--locked"
    : "event-card landing-event";

  const media = (
    <Card.Header className="event-card__header">
      <Surface className="event-card__image" variant="transparent">
        {event.locked ? (
          firstImage ? (
            <img
              alt=""
              className="event-card__image-el"
              decoding="async"
              loading="lazy"
              src={firstImage.src}
            />
          ) : null
        ) : images.length > 0 ? (
          <LandingImageGallery
            alt={event.title}
            images={images}
            nextLabel={labels.nextPhoto}
            previousLabel={labels.previousPhoto}
            showNav={images.length > 1}
          />
        ) : null}
        <Chip className="event-card__category" size="sm">
          {event.dateLabel}
        </Chip>
      </Surface>
    </Card.Header>
  );

  const body = (
    <>
      <Card.Content className="event-card__body flex flex-col gap-2">
        <Card.Title className="event-card__title">{event.title}</Card.Title>
        <Paragraph color="muted" size="sm">
          {labels.community}
        </Paragraph>
        <Paragraph className="landing-event__desc" color="muted" size="sm">
          {event.description}
        </Paragraph>
        {event.time ? (
          <Surface className="event-card__meta" variant="transparent">
            <Calendar
              aria-hidden
              className="event-card__meta-icon"
              size={META_ICON}
              strokeWidth={2}
            />
            <Paragraph color="muted" size="sm">
              {event.time}
            </Paragraph>
          </Surface>
        ) : null}
        <Surface className="event-card__meta" variant="transparent">
          <MapPin aria-hidden className="event-card__meta-icon" size={META_ICON} strokeWidth={2} />
          <Paragraph color="muted" size="sm">
            {event.place}
          </Paragraph>
        </Surface>
      </Card.Content>
      {event.locked ? null : (
        <Card.Footer className="event-card__footer">
          <Surface className="event-card__price" variant="transparent">
            <Paragraph className="event-card__price-value">{credits.value}</Paragraph>
            <Paragraph className="event-card__price-unit" color="muted" size="xs">
              {credits.unit}
            </Paragraph>
          </Surface>
          <Surface className="event-card__actions" variant="transparent">
            <Link className="button button--secondary button--md" href={loginHref}>
              {labels.loginCta}
            </Link>
          </Surface>
        </Card.Footer>
      )}
    </>
  );

  if (event.locked) {
    return (
      <Card className={cardClass}>
        <Surface aria-hidden="true" className="landing-event__locked-inner" variant="transparent">
          {media}
          {body}
        </Surface>
        <Surface
          className="landing-event__lock-overlay flex flex-col items-center justify-center gap-3"
          variant="transparent"
        >
          <Surface className="landing-event__lock-icon" variant="transparent">
            <Lock aria-hidden size={22} strokeWidth={2.25} />
          </Surface>
          <Card.Title className="event-card__title">{labels.loginCta}</Card.Title>
          <Link className="button button--primary button--md" href={loginHref}>
            {labels.loginShort}
          </Link>
        </Surface>
      </Card>
    );
  }

  return (
    <Card className={cardClass}>
      {media}
      {body}
    </Card>
  );
}
