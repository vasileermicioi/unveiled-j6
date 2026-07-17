## ADDED Requirements

### Requirement: Discover preview CTA

Discover EventCard CTAs SHALL use Book Now / Bin dabei for bookable events (Waitlist / Warteliste when sold out) and SHALL navigate to the public event detail page `/:locale/events/:id`. Documentation under `docs/product/` and BDD scenarios SHALL describe this path (not “See details” / “Mehr sehen” as the sole guest CTA). Playwright covering Discover preview SHALL assert the Book Now / Bin dabei (or Waitlist) label via proximity role/name selectors.

#### Scenario: Discover preview links to public event detail

- **WHEN** a guest follows the event card CTA (Book Now / Bin dabei)
- **THEN** they land on the public event detail page (`/events/:id`) without being forced to log in

#### Scenario: Product docs describe Book Now guest CTA

- **WHEN** an implementer reads `docs/product/ui/ui-component-map.md`, `static-pages-content.md`, `CHARTER.md`, and `sitemap/sitemap.md` after this change
- **THEN** guest Discover EventCard CTAs are documented as Book Now / Bin dabei (or Waitlist when sold out) linking to public `/events/:id`, not as “See details” alone

### Requirement: Checkout-focused detail documented

Product UI docs and Gherkin for public event detail SHALL describe the checkout-focused layout shipped for `/:locale/events/:id`: event identity (category, partner, title, description, location, prominent image) plus a summary/action card (ticket quantity affordance, total credits, auth/membership messaging, primary next-step CTA) with a Link close control. Docs SHALL state that the detail page does not create bookings or ledger entries.

#### Scenario: Component map describes checkout detail

- **WHEN** an implementer reads the Event Detail entry in `docs/product/ui/ui-component-map.md` after this change
- **THEN** they can identify the identity column, dark summary/action card, close Link, and that credit booking remains on the dedicated SSR book route

#### Scenario: Guest sees checkout card on public detail

- **WHEN** a guest opens a bookable upcoming event detail page
- **THEN** Playwright (or an equivalent proximity assertion) can find the summary/total and login (or equivalent unlock) CTA without requiring authentication to view the page

## MODIFIED Requirements

### Requirement: Public event detail without authentication

The system SHALL render `/events/:id` for guests without requiring login, using the checkout-focused public detail surface (identity + summary/action card). Booking, waitlist, and save actions remain authentication-gated. Playwright SHALL prove guest access with a test titled exactly `Scenario: Guest can view public event detail without authentication` in `e2e/specs/event-discovery.spec.ts`. Product docs SHALL mark the route as public and describe the checkout layout. Phase 5.5 release spot-checks SHALL reconfirm public access on staging (or document already-aligned).

#### Scenario: Guest can view public event detail without authentication

- **WHEN** a guest opens a valid upcoming event detail URL
- **THEN** event content and the checkout summary card render without login and gated actions require authentication
