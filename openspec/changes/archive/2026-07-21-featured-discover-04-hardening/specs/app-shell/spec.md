## ADDED Requirements

### Requirement: Product docs document Discover vs Browse events nav

`docs/product/ui/app-shell.md` and related i18n inventory SHALL document the primary marketing nav swap: guests and non-booking-eligible `USER` members see **Discover** / **Entdecken** → `/:locale/discover`; booking-eligible `USER` members see **Browse events** / **Events entdecken** → `/:locale/events` (sticky header and mobile drawer). USER logo home SHALL be documented as `/events` when booking-eligible and `/discover` otherwise. Footer Navigation MAY keep Discover → `/discover` without Browse events parity unless a later product decision changes it.

#### Scenario: App shell docs match shipped nav

- **WHEN** a reader opens `docs/product/ui/app-shell.md`
- **THEN** they see Discover vs Browse events label/href rules by audience
- **AND** USER logo home split by booking eligibility is described

#### Scenario: I18n inventory includes Browse events strings

- **WHEN** a reader opens `docs/product/extras/content-i18n-inventory.md`
- **THEN** Discover / Entdecken and Browse events / Events entdecken appear as shell nav strings consistent with shipped copy

## MODIFIED Requirements

### Requirement: Header regression coverage

Ladle (or equivalent) stories SHALL cover guest slim header, member tools chrome (including inactive Discover vs active Browse events when stories exist), and admin entry. Automated e2e that previously asserted header/footer links for How it works, Membership, or Sign up SHALL be updated to direct URL / in-flow CTAs or removed if obsolete. Stories and e2e SHALL NOT re-expand header/footer IA. Playwright SHALL cover active-member Browse events nav visibility with proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Stories show slim guest chrome

- **WHEN** a developer opens AppShell / navbar guest stories
- **THEN** Sign up, How it works, and Membership are not present in the header region

#### Scenario: Stories cover member and admin chrome

- **WHEN** a developer opens AppNavbar (or AppShell) member and admin stories
- **THEN** marketing nav is Discover or Browse events (by membership) + FAQ and role tools / admin entry remain visible as applicable

#### Scenario: E2e does not require relocated links in the header or footer nav

- **WHEN** Playwright asserts reachability of How it works, Membership, or Sign up after this change
- **THEN** those assertions target direct URLs or in-flow CTAs (or are removed), not the sticky header or footer Navigation column

#### Scenario: Header absence can be asserted with proximity selectors

- **WHEN** a guest header regression check is needed in e2e
- **THEN** the test MAY assert that Sign up / How it works / Membership are absent from the banner/header region using role/proximity selectors, without CSS-class-only theme assertions

#### Scenario: Active member Browse events nav is covered

- **WHEN** Playwright runs the featured Discover browse/nav smoke
- **THEN** an active USER session asserts Browse events (localized) linking to `/events` in the primary nav
