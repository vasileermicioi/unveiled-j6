## MODIFIED Requirements

### Requirement: Checkout-focused detail documented

Product UI docs and Gherkin for public event detail SHALL describe: aligned identity + summary/action card on large viewports; responsive hero sizing across sm/md/lg; dense multi-column DETAILS metadata below the fold; LOCATION map with a recognizable pin marker icon (not a black square); and ticket quantity affordance with guest max 3 and signed-in max from credits ∩ remaining capacity. Docs SHALL continue to state that the detail page does not create bookings or ledger entries (credit charge stays on `/:locale/events/:id/book`). The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL mention these layout and qty notes. Playwright SHALL cover stable aspects (DETAILS presence; guest qty cap; optional marker DOM/CSS after consent) without flaky map-tile OCR.

#### Scenario: UI component map matches shipped detail page

- **WHEN** an agent reads `docs/product/ui/ui-component-map.md` Event detail entry
- **THEN** it mentions aligned checkout layout, dense DETAILS, pin marker, and dynamic qty bounds

#### Scenario: Guest sees checkout card on public detail

- **WHEN** a guest opens a bookable upcoming event detail page
- **THEN** Playwright (or an equivalent proximity assertion) can find the summary/total and login (or equivalent unlock) CTA without requiring authentication to view the page

#### Scenario: DETAILS grid is documented and assertable

- **WHEN** a user views a public event detail page with multiple metadata fields
- **THEN** product docs describe a dense multi-column DETAILS layout on md+
- **AND** Playwright can assert DETAILS/metadata content via proximity (not CSS-module hashes)

#### Scenario: Map pin documented with stable e2e preference

- **WHEN** product docs and e2e describe the LOCATION map marker
- **THEN** they refer to a pin marker icon treatment
- **AND** e2e prefers DOM/CSS or aria on the marker element after consent, skipping when the consent gate blocks the map in CI
