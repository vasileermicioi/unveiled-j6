## MODIFIED Requirements

### Requirement: Public event detail page

The web app SHALL serve `/:locale/events/:id` without requiring authentication for guests and crawlers, presenting a checkout-focused layout: an identity column (category // partner, title, description, location, hero image) and a summary/action card showing ticket quantity affordance (when applicable), contextual membership/auth messaging, and the primary next-step CTA. Membership credit cost/total and event date/time chrome SHALL be visible only to booking-eligible viewers (SSR `EventDetailViewer.kind === "eligible"` / `ACTIVE` + `CANCELLED_PENDING`); guests and other non–booking-eligible signed-in viewers SHALL NOT see those fields in the page UI. On large viewports the identity column and summary card SHALL share a common top alignment within the main content grid. The hero image SHALL span the identity column width and use responsive sizing appropriate to sm/md/lg viewports (not a permanently undersized inset box). Share/OG metadata SHALL continue to be rendered. JSON-LD `schema.org/Event` MAY still include `startDate` for crawlers even when UI date chrome is gated. Product docs under `docs/product/` (sitemap auth column, SEO indexability, authorization matrix) SHALL mark this route as public (`Auth` empty/`—`, not USER-required). Bookable future events (`date_time` in the future and remaining capacity > 0) SHALL be indexable; sold-out and past events SHALL still render HTTP 200 with a clear state and `noindex, follow`. Booking, waitlist, and save mutations SHALL remain on dedicated authenticated routes; the detail page SHALL NOT create bookings or ledger entries. A close control SHALL navigate via Link to Discover or the member events feed (or a safe `returnTo`), not dismiss a client-only modal.

#### Scenario: Guest opens a shared event link

- **WHEN** a guest opens `/:locale/events/:id` for a published upcoming event
- **THEN** the SSR page renders event content and share/OG metadata without requiring login

#### Scenario: Guest sees checkout card

- **WHEN** a guest opens `/:locale/events/:id` for a bookable upcoming event
- **THEN** they see event identity content and a summary card with a login (or equivalent unlock) CTA
- **AND** they do not see membership credit totals or event date/time chrome
- **AND** they are not forced through auth before viewing the page

#### Scenario: Booking-eligible member sees credits and date

- **WHEN** a booking-eligible member opens the same bookable event detail
- **THEN** membership credit total and event date/time chrome remain visible
- **AND** the primary CTA continues to support booking

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

### Requirement: Public event detail below-fold metadata

The public event detail page SHALL present below-the-fold DETAILS metadata in a dense, scannable layout that uses horizontal space on medium and large viewports (multi-column label/value grid), rather than a single sparse vertical list inside a wide empty card. The date/time (“when”) metadata cell SHALL be included only for booking-eligible viewers; other applicable DETAILS fields remain for all viewers. LOCATION SHALL show the address and embedded map with chrome that does not leave large unused bands beside the map content. Visual language SHALL remain consistent with Discover EventCard density (uppercase labels, clear hierarchy) while staying on the event-detail surface.

#### Scenario: DETAILS uses horizontal space on large viewport

- **WHEN** a user views an event detail page with multiple metadata fields on a large viewport
- **THEN** DETAILS fields appear in a multi-column grid
- **AND** large empty horizontal regions inside the DETAILS card are avoided

#### Scenario: Guest DETAILS omits date/time cell

- **WHEN** a guest (or other non–booking-eligible viewer) opens public event detail
- **THEN** the DETAILS block does not show the date/time metadata cell
- **AND** other applicable DETAILS fields may still render

#### Scenario: LOCATION shows address and full-width map

- **WHEN** the event has coordinates
- **THEN** the LOCATION block shows the address and a map that spans the content width of its card
