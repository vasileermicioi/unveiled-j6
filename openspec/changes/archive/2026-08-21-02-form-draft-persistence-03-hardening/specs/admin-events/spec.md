## ADDED Requirements

### Requirement: Event add/edit wizard keeps unsaved drafts

`docs/product/features/admin-events.feature` SHALL include scenarios titled `Refresh keeps unsaved event edits`, `Edit steps keep unsaved edits`, and `Successful event save clears draft`. Playwright SHALL use those titles verbatim. Drafts SHALL live in browser `localStorage`, not cookies and not a database table. Create GET on `/:locale/admin/events/new/dates` and `/:locale/admin/events/new/image` SHALL render those wizard steps (no redirect to step 1). That GET contract SHALL be asserted inside `Edit steps keep unsaved edits` (create path) — not as a fourth Gherkin/Playwright title. Product sitemap notes for those create step URLs SHALL match (no “GET redirects to `/new`”). UI component-map Events and Partners rows SHALL mention the shared draft helper on the event wizard, clone, gallery add, and partner create/edit. Coverage-matrix rows SHALL exist for the three new scenarios.

#### Scenario: Refresh keeps unsaved event edits

- **WHEN** I change a field on create or edit event and refresh
- **THEN** the unsaved value is still in the field
- **AND** I can discard the draft to reload saved or empty values

#### Scenario: Edit steps keep unsaved edits

- **WHEN** I edit a field on one wizard step and open another step URL
- **THEN** returning to the first step still shows the unsaved value
- **AND** create GET `/:locale/admin/events/new/dates` stays on Date & tickets (does not redirect to step 1)

#### Scenario: Successful event save clears draft

- **WHEN** I save the event successfully and reopen edit
- **THEN** I see persisted database values, not the discarded in-progress draft
