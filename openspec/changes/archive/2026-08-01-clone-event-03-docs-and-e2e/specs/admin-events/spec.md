## ADDED Requirements

### Requirement: Product docs describe clone not series
`docs/product/features/admin-events.feature`, `docs/product/sitemap/sitemap.md`, and `docs/product/ui/ui-component-map.md` SHALL document `/admin/events/:id/clone` (ADMIN clone flow) and SHALL NOT document `/admin/events/series/new` or series builders (manual slots, date-range / weekday builders) as current MVP behavior. Feature scenarios SHALL include clone acceptance coverage (happy path and entry points; voucher inventory reject when practical) and SHALL NOT require series-create scenarios.

#### Scenario: Feature file documents clone
- **WHEN** a reader opens `docs/product/features/admin-events.feature`
- **THEN** it includes clone acceptance scenarios
- **AND** it has no required series-create scenarios (manual slots or date-range builder)

#### Scenario: Sitemap lists clone not series
- **WHEN** a reader opens `docs/product/sitemap/sitemap.md`
- **THEN** it lists `/admin/events/:id/clone` for ADMIN
- **AND** it does not list `/admin/events/series/new` as a current MVP route

#### Scenario: UI component map describes clone
- **WHEN** a reader opens the Events row in `docs/product/ui/ui-component-map.md`
- **THEN** admin events document SSR CRUD and clone
- **AND** they do not describe series create as a current surface
