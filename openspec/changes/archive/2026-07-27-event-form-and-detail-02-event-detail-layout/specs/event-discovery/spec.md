## ADDED Requirements

### Requirement: Public event detail layout
The public event detail page SHALL present a checkout-focused layout without requiring authentication. On large viewports it SHALL use two primary rows: (1) title and location on the left with the summary/checkout card on the right; (2) the primary event image on the left with the Markdown description on the right. Below those rows, DETAILS metadata, LOCATION map (when coordinates exist), and optional gallery behavior remain available. Booking, waitlist, and save mutations remain on authenticated routes; the detail page SHALL NOT create bookings or ledger entries.

#### Scenario: Guest can view public event detail without authentication
- **WHEN** a guest opens a valid upcoming event detail URL ("/events/:id")
- **THEN** the page renders checkout-focused event content (title/location + summary card, then image + description) without requiring login
- **AND** the summary card shows a login (or unlock) CTA without ticket quantity, credit cost, or date chrome
- **AND** DETAILS shows scannable metadata fields without date/time chrome (dense multi-column layout on md+)
- **AND** booking, waitlist, and save mutations remain on authenticated routes
- **AND** the detail page does not create bookings or ledger entries

#### Scenario: Large viewport uses two primary rows
- **WHEN** a guest or member views public event detail on a large viewport
- **THEN** row 1 places title and location beside the checkout/summary card
- **AND** row 2 places the primary event image beside the Markdown description
- **AND** DETAILS, LOCATION (when coordinates exist), and gallery remain below those rows

### Requirement: Partner attribution on event detail
The public event detail page SHALL show the hosting partner's name together with the partner logo image (from `partners.logo_image_id` variants) in a premium, non-floating attribution near the title. The attribution SHALL NOT overlay the event hero as a detached badge.

#### Scenario: Partner name and logo on detail
- **WHEN** a guest or member opens a public event detail page for an event whose partner has a logo
- **THEN** they see the partner name and logo in the identity area of the page
- **AND** the logo is not rendered as a floating sticker on top of the event hero image

#### Scenario: Partner attribution without logo URL falls back gracefully
- **WHEN** partner attribution data has a name but no resolvable logo URL
- **THEN** the page still shows the partner name near the title
- **AND** it does not render a broken image in the attribution strip

## MODIFIED Requirements

### Requirement: Checkout-focused detail documented
Product UI docs and Gherkin for public event detail SHALL describe: on large viewports, two primary rows (title + location | summary/action card; primary event image | Markdown description); partner name + logo attribution in the identity area (not overlaid on the hero); responsive media sizing across sm/md/lg; dense multi-column DETAILS metadata below the fold; LOCATION map with a recognizable pin marker icon (not a black square); ticket quantity affordance with guest max 3 and signed-in max from credits ∩ remaining capacity; and that membership credit totals and event date/time chrome are shown only to booking-eligible members (guests and other non–eligible viewers omit those fields). Docs SHALL continue to state that the detail page does not create bookings or ledger entries (credit charge stays on `/:locale/events/:id/book`). The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL mention these layout, partner attribution, qty, and gating notes. Playwright SHALL cover stable aspects (DETAILS presence without requiring guest date; guest qty cap; unlock CTA; optional marker DOM/CSS after consent) without flaky map-tile OCR.

#### Scenario: UI component map matches shipped detail page
- **WHEN** an agent reads `docs/product/ui/ui-component-map.md` Event detail entry
- **THEN** it mentions the two-row checkout layout, partner logo + name attribution, dense DETAILS, pin marker, dynamic qty bounds, and member-only credits/date gating

#### Scenario: Guest sees checkout card on public detail
- **WHEN** a guest opens a bookable upcoming event detail page
- **THEN** Playwright (or an equivalent proximity assertion) can find the unlock/login CTA without requiring authentication to view the page
- **AND** the guest assertion MUST NOT require a visible credit total or date/time chrome

#### Scenario: DETAILS grid is documented and assertable
- **WHEN** a user views a public event detail page with multiple metadata fields
- **THEN** product docs describe a dense multi-column DETAILS layout on md+
- **AND** Playwright can assert DETAILS/metadata content via proximity (not CSS-module hashes)
- **AND** guest coverage MUST NOT require the date MetaCell to be present

#### Scenario: Map pin documented with stable e2e preference
- **WHEN** product docs and e2e describe the LOCATION map marker
- **THEN** they refer to a pin marker icon treatment
- **AND** e2e prefers DOM/CSS or aria on the marker element after consent, skipping when the consent gate blocks the map in CI
