## ADDED Requirements

### Requirement: Featured partners admin BDD

`docs/product/features/admin-partners.feature` (or an adjacent agreed feature file) SHALL specify list/add/remove for Featured partners under `/:locale/admin/featured-partners*`, including empty state and “remove keeps venue” behavior, aligned with sitemap routes. Playwright titles for in-scope scenarios SHALL match Gherkin `Scenario:` lines where the BDD contract requires it, or the coverage matrix SHALL list a named deferral with owner. `docs/product/features/admin-events.feature` and e2e fixtures SHALL refer to the `/admin/featured` tab as **Featured events** (EN) / **Empfohlene Events** (DE), not the bare label **Featured** / **Empfohlen**.

#### Scenario: Docs and e2e titles align

- **WHEN** featured-partners hardening completes
- **THEN** shipped Playwright titles for in-scope scenarios match Gherkin `Scenario:` lines where the BDD contract requires it
- **OR** the coverage matrix lists a named deferral with owner

#### Scenario: Featured events tab wording in product docs

- **WHEN** `admin-events.feature` and admin e2e tab navigation are read after this step
- **THEN** the tab for `/admin/featured` is named Featured events / Empfohlene Events
- **AND** Featured partners routes are covered under admin-partners (or adjacent) Gherkin and fixtures
