## ADDED Requirements

### Requirement: Product docs and BDD match membership home

`docs/product/features/profile.feature`, sitemap, UI maps, and Playwright coverage SHALL describe `/profile` as the membership manage home (Stripe portal CTA; membership checkout when ineligible) with tablist above `PageSectionHeader`, and SHALL NOT describe a credit-wallet / refill account-home tab.

#### Scenario: Profile feature file has no credit-wallet account home

- **WHEN** an implementer reads `docs/product/features/profile.feature`
- **THEN** account-home scenarios describe membership manage (not credit wallet / refill)

#### Scenario: Coverage matrix tracks membership home e2e

- **WHEN** an implementer reads `docs/product/testing/coverage-matrix.md` profile rows
- **THEN** Playwright entries match the membership-home scenarios (or explicit skip with reason)

#### Scenario: Sitemap profile row is membership home

- **WHEN** an implementer reads the `/profile` row in `docs/product/sitemap/sitemap.md`
- **THEN** the blurb describes membership manage home, not a credit-wallet tab

## MODIFIED Requirements

### Requirement: Phase 7 profile Playwright and Ladle coverage

The system SHALL ship Playwright coverage at `e2e/specs/profile.spec.ts` for in-scope `profile.feature` scenarios (identity, password-change entry, preferences, membership home / inactive checkout CTA, billing view/update/cancel entry points, and GDPR entry points) using verbatim Scenario titles and proximity selectors. Coverage SHALL assert membership home CTAs and that the account tablist precedes the account `PageSectionHeader` heading. Ladle SHALL include stories for profile billing, preferences, membership home, and GDPR export/delete confirm compositions (and related profile pages as needed). `Scenario: Access account deletion and data export` SHALL pass by asserting reachable export/delete entry points (and MAY assert page headings after navigation). Full export download and deletion mechanics MAY remain covered primarily in `auth.spec.ts`. Customer Portal deep hosted flows MAY assert SSR redirect / opt-in policy documented in `e2e/README.md` rather than requiring full Stripe Portal automation in default CI. Credit-wallet / refill account-home scenarios SHALL NOT remain as required profile e2e titles.

#### Scenario: Profile spec covers shipped surfaces

- **WHEN** `bun run test:e2e` executes `e2e/specs/profile.spec.ts`
- **THEN** identity, preferences, membership home, inactive checkout CTA, billing entry, and GDPR entry scenarios pass or record named env skips only

#### Scenario: Profile Ladle includes GDPR compositions

- **WHEN** Ladle stories for profile are reviewed after gdpr-rights step 03
- **THEN** export/delete confirm states are present alongside billing/preferences stories

#### Scenario: GDPR entry is not Phase-8 deferred

- **WHEN** coverage matrix lists `Access account deletion and data export` after this change
- **THEN** status is `pass` (or env skip) — not deferred for missing GDPR UI

#### Scenario: Coverage matrix profile rows leave unshipped

- **WHEN** Phase 7 closes
- **THEN** `profile.feature` rows are `pass`, `skip`, or `deferred` — not `unshipped`

#### Scenario: Profile e2e asserts tabs above header

- **WHEN** a signed-in member opens `/profile` in Playwright
- **THEN** the account tablist is above the account page heading (proximity / layout order)
