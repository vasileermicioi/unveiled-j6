## ADDED Requirements

### Requirement: Guest DETAILS omits target age groups

The public event DETAILS section SHALL NOT show a Target age groups / Zielgruppe metadata row. Because events no longer store target age groups, no public or member surface SHALL display event age-group audience metadata. (Zip / PLZ omission in DETAILS remains as already specified in product discovery features.)

#### Scenario: Guest does not see age groups in DETAILS

- **WHEN** a guest opens a valid upcoming event detail URL
- **THEN** the DETAILS section does not show Target age groups / Zielgruppe

#### Scenario: Product discovery feature omits event age-group metadata

- **WHEN** an implementer reads `docs/product/features/event-discovery.feature`
- **THEN** guest DETAILS scenarios do not require events to expose target age groups
- **AND** any remaining absence assertion is regression-only (field is not collected)
