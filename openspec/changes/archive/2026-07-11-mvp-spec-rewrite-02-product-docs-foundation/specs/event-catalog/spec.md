## MODIFIED Requirements

### Requirement: Public event detail page

The web app SHALL serve `/:locale/events/:id` without requiring authentication for guests and crawlers, rendering full event details and share/OG metadata. Product docs under `docs/product/` (sitemap auth column, SEO indexability, authorization matrix) SHALL mark this route as public (`Auth` empty/`—`, not USER-required). Bookable future events (`date_time` in the future and remaining capacity > 0) SHALL be indexable; sold-out and past events SHALL still render HTTP 200 with a clear state and `noindex, follow`. Booking, waitlist, and save actions SHALL remain behind member (and subscription/credits) gates on dedicated routes.

#### Scenario: Guest opens a shared event link

- **WHEN** a guest opens `/:locale/events/:id` for a published upcoming event
- **THEN** the SSR page renders event content and share/OG metadata without requiring login

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

#### Scenario: Product sitemap marks detail public

- **WHEN** an agent reads `docs/product/sitemap/sitemap.md` after this change
- **THEN** `/events/:id` has Auth empty/`—` (not USER-required) while `/events/:id/book` and waitlist remain gated
