## ADDED Requirements

### Requirement: V3 landing release coverage

The system SHALL cover the single v3 landing with updated meta/structured data for the locale home only, Ladle stories for `LandingPageV3` (full rail, short rail with fewer than 3 teasers, and empty rail, in DE and EN), Playwright scenarios asserting at most 3 live rail teasers with no credit figures or detail links and login-bound CTAs plus 2 locked skeleton cards, 404 for `/:locale/regular` and `/regular`, and canonical docs describing the single landing with zero `/regular` references (outside 404-deletion assertions).

#### Scenario: V3 landing passes release checks

- **WHEN** the static-pages suite runs against `/:locale`
- **THEN** all v3 assertions pass and canonical docs describe the single landing with no `/regular` references

#### Scenario: Landing meta describes v3

- **WHEN** a crawler requests `/de` or `/en`
- **THEN** the response includes a v3-derived `<title>`, `<meta name="description">`, canonical for the locale home, hreflang alternates, and Open Graph tags in the initial HTML
- **AND** no canonical or index rule references `/:locale/regular` or `/regular`

#### Scenario: Organization JSON-LD matches v3 landing

- **WHEN** the locale home renders
- **THEN** `buildOrganizationJsonLd` emits the Organization entity with the locale-home URL, support email, and Berlin postal address

#### Scenario: Landing stories cover rail variants in both locales

- **WHEN** Ladle builds the `LandingPageV3` stories
- **THEN** full-rail (3 teasers), short-rail (<3 teasers), and empty-rail variants render in DE and EN without legacy landing stories remaining

#### Scenario: Rail shows at most 3 login-gated teasers plus locked cards

- **WHEN** a guest opens `/:locale` with 3+ upcoming published events
- **THEN** the rail shows at most 3 live teasers with no credit figures, no `href` to `/events/:id`, and live-card CTAs pointing only at `/:locale/login`
- **AND** 2 locked skeleton cards (lock icon + short login button → `/:locale/login`) complete the rail

#### Scenario: Deleted regular routes return 404

- **WHEN** anyone opens `/:locale/regular` or `/regular`
- **THEN** the response is 404 (no redirect, no landing content)

#### Scenario: Canonical docs have no regular references

- **WHEN** an implementer searches `docs/product/sitemap/sitemap.md`, `docs/product/ui/static-pages-content.md`, `docs/product/features/static-pages.feature`, `docs/product/testing/coverage-matrix.md`, and `docs/product/extras/content-i18n-inventory.md` after this change
- **THEN** no row, scenario, or index rule references `/regular` or a Regular-landing variant
