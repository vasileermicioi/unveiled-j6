## ADDED Requirements

### Requirement: Preview routes are documented and tested
`docs/product/features/admin-events.feature` and `e2e/specs/admin-events.spec.ts` SHALL include the five preview scenarios below with identical titles (`test("Scenario: <exact Gherkin title>")`). Sitemap SHALL list `/:locale/admin/events/:id/preview`, `/:locale/admin/events/:id/preview/browse`, and `/:locale/admin/events/:id/preview/discover` as ADMIN `noindex` GET pages. `docs/product/extras/content-i18n-inventory.md`, `docs/product/ui/ui-component-map.md`, `docs/product/extras/gaps-and-decisions.md`, and `docs/product/testing/coverage-matrix.md` SHALL record admin-only preview chrome and the new scenarios. Playwright titles SHALL match Gherkin `Scenario:` lines verbatim. Selectors SHALL be proximity/layout only. Env skips (`E2E_ADMIN_*`, R2) MAY remain as named `test.skip` reasons for create. The system SHALL NOT add `@skip-no-ui` for these MVP scenarios. The system SHALL NOT invent parallel titles for member-audience, chrome-switcher, card-CTA, catalog-entry, or USER-denied (those stay covered by the five titles and existing `guardAdminRoute` coverage).

#### Scenario: Preview draft detail
- **WHEN** an admin opens `/:locale/admin/events/:id/preview` for an unpublished event
- **THEN** the preview page is 200 and shows the locale title
- **AND** a guest opening `/:locale/events/:id` sees the same not-found page as a missing event (HTTP 404; draft title not shown)

#### Scenario: Preview does not book
- **WHEN** an admin is on the detail preview
- **THEN** the primary checkout control is Preview only / Nur Vorschau
- **AND** there is no book, waitlist, save, or login form POST from that page

#### Scenario: Preview browse card
- **WHEN** an admin opens the browse preview for an unpublished event that is not featured
- **THEN** they see one event card with the locale title
- **AND** the page does not list other catalog events
- **AND** the card CTA stays on `/:locale/admin/events/:id/preview`

#### Scenario: Preview discover card
- **WHEN** an admin opens the discover preview for an unpublished event that is not featured
- **THEN** they still see one Discover-styled event card with the locale title
- **AND** they see the live Discover section header copy
- **AND** live `/:locale/discover` does not list that draft

#### Scenario: Guest cannot open event preview
- **WHEN** a guest opens `/:locale/admin/events/:id/preview`
- **THEN** they are sent to `/:locale/login?returnTo=`
- **AND** the event body is not shown
