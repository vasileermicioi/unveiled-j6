## ADDED Requirements

### Requirement: Admin form automation uses native controls
Automated tests for admin choice and numeric fields SHALL target native HTML form controls (e.g. Playwright `selectOption` / labeled number inputs), not HeroUI Select listbox popovers or NumberField increment/decrement steppers, once native form controls have shipped. Helpers SHALL resolve fields via accessible labels (`getByLabel` or equivalent proximity selectors) per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Admin event Partner selection in e2e
- **WHEN** an e2e test sets the Partner field on Create Event
- **THEN** it selects via the native select associated with the Partner label (not a ListBox popover)

#### Scenario: Admin capacity uses labeled number input
- **WHEN** an e2e helper or spec sets event capacity (create, edit, or waitlist capacity bump)
- **THEN** it fills the native number input associated with the capacity label
- **AND** it does not click HeroUI NumberField increment/decrement buttons
