## ADDED Requirements

### Requirement: Admin create requires DE and EN copy

`docs/product/features/admin-events.feature` SHALL specify that create/edit collect title and Markdown description for both German and English, and reject submit when either locale is empty. It SHALL include a scenario titled `Create event with DE and EN titles`. Playwright in `e2e/specs/admin-events.spec.ts` SHALL use that title verbatim. After create, `/de/events/:id` and `/en/events/:id` SHALL show the matching locale titles (identity heading). Playwright SHALL use proximity/layout selectors only; the system SHALL NOT add `data-testid`.

Admin e2e helpers (`createEventViaUI`, `fillNewEventRequiredFields`) SHALL fill both locale title fields and both locale description fields so existing create/edit scenarios remain green after the step-02 General form (labels `Titel (DE)` / `Title (EN)` and `Beschreibung (DE)` / `Description (EN)`, or equivalent `getAdminCopy` keys). Default helper fills MAY copy the same string into both locales; the new scenario MUST use distinct DE vs EN titles.

`docs/product/extras/content-i18n-inventory.md` SHALL list the new admin label and `fieldErrors` keys. Coverage matrix SHALL include the new admin scenario (`pass` or named R2 / `E2E_ADMIN_*` env-skip — never “UI not built”).

#### Scenario: Create event with DE and EN titles

- **WHEN** I create an event with both locale titles and both locale descriptions
- **THEN** the event is added to the catalog
- **AND** `/de` and `/en` public detail show the matching titles

#### Scenario: Empty either-locale copy is rejected in Gherkin

- **WHEN** a reader opens `admin-events.feature` after this change
- **THEN** create/edit are specified to reject submit when either locale title or description is empty
