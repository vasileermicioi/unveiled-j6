## ADDED Requirements

### Requirement: EventCard public component

The `@unveiled/ui` package SHALL export an `EventCard` component matching `docs/migration/ui/ui-component-map.md`, using image variants `medium-640` and `small-320` via srcset, and applying guest-first CTA precedence so unauthenticated viewers always see a "See details" action.

#### Scenario: Guest CTA on discover

- **WHEN** EventCard renders without a signed-in user
- **THEN** the primary CTA label corresponds to "See details" regardless of remaining capacity

#### Scenario: Bookmark control accessibility

- **WHEN** EventCard renders a save toggle
- **THEN** the control exposes an `aria-label` describing save/unsaved state

### Requirement: Discover page live event preview

The public `/:locale/discover` route SHALL render up to six upcoming events from the database using EventCard components instead of static placeholder content.

#### Scenario: Discover shows upcoming catalog events

- **WHEN** at least one future event exists in the catalog
- **THEN** `/discover` displays up to six EventCards ordered by ascending `date_time`

### Requirement: Public event detail page

The web app SHALL serve `/:locale/events/:id` without requiring authentication, rendering full event details and indexable metadata per `docs/migration/extras/seo-and-metadata.md`.

#### Scenario: Unauthenticated event detail

- **WHEN** a visitor opens a valid upcoming event detail URL
- **THEN** the page returns 200 with hero srcset, description, partner info, and booking CTA linking to login or membership — not an auth redirect

#### Scenario: Event detail Open Graph image

- **WHEN** the event detail HTML is rendered
- **THEN** `og:image` and `twitter:image` reference the event's `og-1200x630` variant URL

#### Scenario: Event JSON-LD stub

- **WHEN** the event detail HTML is rendered
- **THEN** a `schema.org/Event` JSON-LD block includes at minimum name, startDate, location, image (hero-1920 URL), description, and organizer

#### Scenario: Unknown event id

- **WHEN** the id does not exist
- **THEN** the server renders a locale-aware 404 page
