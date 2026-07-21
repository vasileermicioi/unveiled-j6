## ADDED Requirements

### Requirement: Public event detail for guests

The system SHALL allow unauthenticated users to view public event detail pages. The system SHALL NOT display membership credit price or event date/time on that page to guests (or other non–booking-eligible viewers). Booking-eligible members SHALL continue to see credit price and date/time needed to book. Visibility SHALL be decided from the SSR session + membership eligibility used for booking CTAs (not a client-only hide). Structured data / Open Graph MAY still include `startDate` for crawlers.

#### Scenario: Guest public detail omits credits and date

- **WHEN** an unauthenticated user opens `/:locale/events/:id`
- **THEN** the page renders without credit cost and without date/time chrome
- **AND** the user can still see event identity content and an auth/unlock path toward booking

#### Scenario: Booking-eligible member sees credits and date

- **WHEN** a booking-eligible signed-in member opens the same event detail
- **THEN** credit cost and date/time remain visible

#### Scenario: Non-eligible signed-in viewer is gated like a guest

- **WHEN** a signed-in user who is not booking-eligible (for example `INACTIVE` / membership required, or `PAST_DUE`) opens public event detail
- **THEN** credit cost and date/time chrome are omitted
- **AND** membership or payment CTAs remain available as today

## MODIFIED Requirements

### Requirement: Checkout-focused detail documented

Product UI docs and Gherkin for public event detail SHALL describe: aligned identity + summary/action card on large viewports; responsive hero sizing across sm/md/lg; dense multi-column DETAILS metadata below the fold; LOCATION map with a recognizable pin marker icon (not a black square); ticket quantity affordance with guest max 3 and signed-in max from credits ∩ remaining capacity; and that membership credit totals and event date/time chrome are shown only to booking-eligible members (guests and other non–eligible viewers omit those fields). Docs SHALL continue to state that the detail page does not create bookings or ledger entries (credit charge stays on `/:locale/events/:id/book`). The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL mention these layout, qty, and gating notes. Playwright SHALL cover stable aspects (DETAILS presence without requiring guest date; guest qty cap; unlock CTA; optional marker DOM/CSS after consent) without flaky map-tile OCR.

#### Scenario: UI component map matches shipped detail page

- **WHEN** an agent reads `docs/product/ui/ui-component-map.md` Event detail entry
- **THEN** it mentions aligned checkout layout, dense DETAILS, pin marker, dynamic qty bounds, and member-only credits/date gating

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
