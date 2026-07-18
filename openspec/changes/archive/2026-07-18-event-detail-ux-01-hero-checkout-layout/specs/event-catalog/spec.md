## MODIFIED Requirements

### Requirement: Public event detail page

The web app SHALL serve `/:locale/events/:id` without requiring authentication for guests and crawlers, presenting a checkout-focused layout: an identity column (category // partner, title, description, location, hero image) and a summary/action card showing ticket quantity affordance, total credit cost, contextual membership/auth messaging, and the primary next-step CTA. On large viewports the identity column and summary card SHALL share a common top alignment within the main content grid. The hero image SHALL span the identity column width and use responsive sizing appropriate to sm/md/lg viewports (not a permanently undersized inset box). Share/OG metadata SHALL continue to be rendered. Product docs under `docs/product/` (sitemap auth column, SEO indexability, authorization matrix) SHALL mark this route as public (`Auth` empty/`—`, not USER-required) — doc updates may lag until hardening. Bookable future events (`date_time` in the future and remaining capacity > 0) SHALL be indexable; sold-out and past events SHALL still render HTTP 200 with a clear state and `noindex, follow`. Booking, waitlist, and save mutations SHALL remain on dedicated authenticated routes; the detail page SHALL NOT create bookings or ledger entries. A close control SHALL navigate via Link to Discover or the member events feed (or a safe `returnTo`), not dismiss a client-only modal.

#### Scenario: Guest opens a shared event link

- **WHEN** a guest opens `/:locale/events/:id` for a published upcoming event
- **THEN** the SSR page renders event content and share/OG metadata without requiring login

#### Scenario: Guest sees checkout card

- **WHEN** a guest opens `/:locale/events/:id` for a bookable upcoming event
- **THEN** they see event identity content and a summary card with total credits and a login (or equivalent unlock) CTA
- **AND** they are not forced through auth before viewing the page

#### Scenario: Guest sees aligned checkout composition on large viewport

- **WHEN** a guest opens a valid upcoming event detail URL on a large viewport
- **THEN** the identity content and summary card begin at approximately the same vertical origin
- **AND** the hero image fills the identity column width

#### Scenario: Stacked layout on small viewport

- **WHEN** a guest opens the same page on a small viewport
- **THEN** identity content stacks above the summary card without overlapping the close control

#### Scenario: Eligible member continues to SSR book

- **WHEN** a booking-eligible member opens the same detail page
- **THEN** the primary CTA continues to the dedicated SSR book route `/:locale/events/:id/book`
- **AND** credit deduction still occurs only via the booking domain on that SSR flow

#### Scenario: Close returns to browse

- **WHEN** a visitor activates the detail page close control
- **THEN** they navigate to Discover or the member events feed (as appropriate) rather than dismissing a client-only modal

#### Scenario: Unauthenticated event detail

- **WHEN** a visitor opens a valid upcoming event detail URL
- **THEN** the page returns 200 with hero srcset, identity content, partner/location info, and a checkout summary card whose booking CTA links to login or membership — not an auth redirect

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
