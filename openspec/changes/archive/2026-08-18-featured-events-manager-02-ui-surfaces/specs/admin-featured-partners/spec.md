## MODIFIED Requirements

### Requirement: Featured events admin tab label

The admin tab that routes to `/:locale/admin/featured` SHALL be labeled **Featured events** (EN) / **Empfohlene Events** (DE), not the bare label **Featured** / **Empfohlen**. Routes under `/admin/featured*` remain the featured-events surfaces. Gallery manage is not an entry point from this tab.

#### Scenario: Featured events tab label

- **WHEN** an ADMIN views admin chrome tabs
- **THEN** the tab for "/:locale/admin/featured" reads "Featured events" / "Empfohlene Events"
