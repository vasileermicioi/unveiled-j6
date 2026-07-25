## ADDED Requirements

### Requirement: Event description is Markdown at rest

The system SHALL store each event's `description` as Markdown text in `events.description` (existing text column; no separate HTML column).

#### Scenario: Plain text remains valid

- **WHEN** an event description contains only plain paragraphs without Markdown syntax
- **THEN** public rendering shows the same readable text as before

### Requirement: Public event detail renders Markdown with GFM

The system SHALL render the event description on the public event detail page using Markdown with GitHub-Flavored Markdown (GFM) extensions, without executing or embedding raw HTML from the description.

#### Scenario: Emphasis and lists render

- **WHEN** a guest opens `/:locale/events/:id` for an event whose description includes emphasis and a Markdown list
- **THEN** the identity column shows formatted emphasis and list structure rather than raw Markdown markers

### Requirement: SEO and JSON-LD use plain text from Markdown

The system SHALL derive meta description and `schema.org/Event` `description` from a plain-text extraction of the Markdown description (then truncate for meta as today).

#### Scenario: Meta description has no Markdown markers

- **WHEN** an event description contains Markdown markers such as `**bold**` or `# Heading`
- **THEN** the SSR `<meta name="description">` and JSON-LD `description` contain the readable plain text without those markers

## MODIFIED Requirements

### Requirement: Public event detail page

The web app SHALL serve `/:locale/events/:id` without requiring authentication for guests and crawlers, presenting a checkout-focused layout: an identity column (category // partner, title, **description rendered as Markdown/GFM** via the shared Markdown pipeline, location, hero image) and a summary/action card showing ticket quantity affordance (when applicable), contextual membership/auth messaging, and the primary next-step CTA. Membership credit cost/total and event date/time chrome SHALL be visible only to booking-eligible viewers (SSR `EventDetailViewer.kind === "eligible"` / `ACTIVE` + `CANCELLED_PENDING`); guests and other non–booking-eligible signed-in viewers SHALL NOT see those fields in the page UI. On large viewports the identity column and summary card SHALL share a common top alignment within the main content grid. The hero image SHALL span the identity column width and use responsive sizing appropriate to sm/md/lg viewports (not a permanently undersized inset box). Share/OG metadata SHALL continue to be rendered, with meta description and JSON-LD `description` derived from plain-text extraction of the Markdown description. JSON-LD `schema.org/Event` MAY still include `startDate` for crawlers even when UI date chrome is gated. Product docs under `docs/product/` (sitemap auth column, SEO indexability, authorization matrix) SHALL mark this route as public (`Auth` empty/`—`, not USER-required). Bookable future events (`date_time` in the future and remaining capacity > 0) SHALL be indexable; sold-out and past events SHALL still render HTTP 200 with a clear state and `noindex, follow`. Booking, waitlist, and save mutations SHALL remain on dedicated authenticated routes; the detail page SHALL NOT create bookings or ledger entries. A close control SHALL navigate via Link to Discover or the member events feed (or a safe `returnTo`), not dismiss a client-only modal.

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
- **THEN** a `schema.org/Event` JSON-LD block includes at minimum name, startDate, location, image (hero-1920 URL), description (plain text derived from Markdown), and organizer

#### Scenario: Unknown event id

- **WHEN** the id does not exist
- **THEN** the server renders a locale-aware 404 page

#### Scenario: Product sitemap marks detail public

- **WHEN** an agent reads `docs/product/sitemap/sitemap.md` after this change
- **THEN** `/events/:id` has Auth empty/`—` (not USER-required) while `/events/:id/book` and waitlist remain gated

#### Scenario: Identity description renders Markdown

- **WHEN** a guest opens `/:locale/events/:id` for an event whose description includes Markdown emphasis or a list
- **THEN** the identity column presents rendered Markdown/GFM rather than a single unparsed plain-text paragraph
