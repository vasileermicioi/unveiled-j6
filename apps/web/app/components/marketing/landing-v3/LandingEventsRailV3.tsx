import { Card, Chip, Link, Paragraph, Surface } from "@heroui/react";
import { Calendar, Lock, MapPin } from "lucide-react";

import type { LandingLiveTeaser, LandingV3EventsCopy } from "../../../lib/content/types";
import type { Locale } from "../../../lib/locale";
import { localizedPath } from "../../../lib/locale";
import { landingV3HeroImages } from "./assets";
import { LandingSectionHeaderV3 } from "./LandingSectionHeaderV3";

type LandingEventsRailV3Props = {
  locale: Locale;
  copy: LandingV3EventsCopy;
  teasers: LandingLiveTeaser[];
};

/**
 * Locked skeleton cards completing the rail (deleted-pages lock-overlay
 * pattern): blurred community photo behind a yellow wash, lock icon,
 * login CTA and short login button.
 */
const LOCKED_RAIL_CARDS = [
  { key: "locked-rail-card-a", image: landingV3HeroImages[1]?.src },
  { key: "locked-rail-card-b", image: landingV3HeroImages[4]?.src },
];

const META_ICON = 14;

export function LandingEventsRailV3({ locale, copy, teasers }: LandingEventsRailV3Props) {
  const loginHref = localizedPath(locale, "login");

  return (
    <Surface
      className="landing-events mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      id="experiences"
      variant="transparent"
    >
      <Surface className="flex max-w-3xl flex-col gap-4" variant="transparent">
        <LandingSectionHeaderV3 body={copy.body} eyebrow={copy.eyebrow} headline={copy.headline} />
      </Surface>

      <Surface
        className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variant="transparent"
      >
        {teasers.map((teaser) => (
          <LandingLiveTeaserCard
            key={teaser.id}
            loginCta={copy.loginCta}
            loginHref={loginHref}
            teaser={teaser}
          />
        ))}
        {LOCKED_RAIL_CARDS.map((card) => (
          <LandingLockedTeaserCard
            key={card.key}
            image={card.image}
            loginCta={copy.loginCta}
            loginHref={loginHref}
            loginShort={copy.loginShort}
          />
        ))}
      </Surface>
    </Surface>
  );
}

/**
 * Guest-safe teaser card. The card itself is never a link and exposes no
 * credit prices or event-detail URLs — the login CTA is the only click target.
 */
function LandingLiveTeaserCard({
  teaser,
  loginHref,
  loginCta,
}: {
  teaser: LandingLiveTeaser;
  loginHref: string;
  loginCta: string;
}) {
  return (
    <Card className="event-card landing-event">
      <Card.Header className="event-card__header">
        <Surface className="event-card__image" variant="transparent">
          {teaser.image ? (
            <img
              alt=""
              className="event-card__image-el"
              decoding="async"
              loading="lazy"
              src={teaser.image}
            />
          ) : null}
          <Chip className="event-card__category" size="sm">
            {teaser.dateLabel}
          </Chip>
        </Surface>
      </Card.Header>
      <Card.Content className="event-card__body flex flex-col gap-2">
        <Card.Title className="event-card__title">{teaser.title}</Card.Title>
        <Paragraph className="landing-event__desc" color="muted" size="sm">
          {teaser.description}
        </Paragraph>
        {teaser.time ? (
          <Surface className="event-card__meta" variant="transparent">
            <Calendar
              aria-hidden
              className="event-card__meta-icon"
              size={META_ICON}
              strokeWidth={2}
            />
            <Paragraph color="muted" size="sm">
              {teaser.time}
            </Paragraph>
          </Surface>
        ) : null}
        <Surface className="event-card__meta" variant="transparent">
          <MapPin aria-hidden className="event-card__meta-icon" size={META_ICON} strokeWidth={2} />
          <Paragraph color="muted" size="sm">
            {teaser.place}
          </Paragraph>
        </Surface>
      </Card.Content>
      <Card.Footer className="event-card__footer">
        <Surface className="event-card__actions" variant="transparent">
          <Link className="button button--secondary button--md" href={loginHref}>
            {loginCta}
          </Link>
        </Surface>
      </Card.Footer>
    </Card>
  );
}

/**
 * Locked skeleton card teasing more lineup behind login. The skeleton mirrors
 * the live card anatomy (image, title/text/meta bars, footer) so locked cards
 * end up the same height as live cards; the overlay carries the lock CTA.
 * Decorative content is hidden from assistive tech.
 */
function LandingLockedTeaserCard({
  image,
  loginHref,
  loginCta,
  loginShort,
}: {
  image: string | undefined;
  loginHref: string;
  loginCta: string;
  loginShort: string;
}) {
  return (
    <Card className="event-card landing-event landing-event--locked">
      <Surface aria-hidden="true" className="landing-event__locked-inner" variant="transparent">
        <Surface className="event-card__image" variant="transparent">
          {image ? (
            <img
              alt=""
              className="event-card__image-el"
              decoding="async"
              loading="lazy"
              src={image}
            />
          ) : null}
        </Surface>
        <Surface className="event-card__body flex flex-col gap-2" variant="transparent">
          <Surface
            className="landing-event__skeleton-bar landing-event__skeleton-bar--title"
            variant="transparent"
          />
          <Surface className="landing-event__skeleton-bar" variant="transparent" />
          <Surface
            className="landing-event__skeleton-bar landing-event__skeleton-bar--short"
            variant="transparent"
          />
          <Surface
            className="landing-event__skeleton-bar landing-event__skeleton-bar--meta"
            variant="transparent"
          />
        </Surface>
        <Surface className="event-card__footer" variant="transparent">
          <Surface className="event-card__actions" variant="transparent">
            <Surface className="landing-event__skeleton-button" variant="transparent" />
          </Surface>
        </Surface>
      </Surface>
      <Surface
        className="landing-event__lock-overlay flex flex-col items-center justify-center gap-3"
        variant="transparent"
      >
        <Surface className="landing-event__lock-icon" variant="transparent">
          <Lock aria-hidden size={22} strokeWidth={2.25} />
        </Surface>
        <Card.Title className="event-card__title">{loginCta}</Card.Title>
        <Link className="button button--primary button--md" href={loginHref}>
          {loginShort}
        </Link>
      </Surface>
    </Card>
  );
}
