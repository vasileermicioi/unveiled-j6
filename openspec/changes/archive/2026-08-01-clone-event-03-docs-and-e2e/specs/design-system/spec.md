## MODIFIED Requirements

### Requirement: Multi-value form controls
For multi-value allowlists (onboarding preferences, admin event languages/age groups), the system SHALL use native checkbox multi-selects (optional client-side search filter). Native HTML `<select multiple>` is not the preferred pattern for new multi-value admin fields. Single-value choice fields SHALL continue to use native HTML `select`. Product design-system docs (`docs/product/ui/design-system.md` Form controls) SHALL state this preference and SHALL NOT cite series-builder weekdays as a current multi-value example.

#### Scenario: Design-system docs prefer checkbox multi-select for multi-value lists
- **WHEN** an agent reads the Form controls section of `docs/product/ui/design-system.md`
- **THEN** it states that multi-value allowlists use native checkbox multi-selects (optional search)
- **AND** it states that native `<select multiple>` is not the preferred pattern for new multi-value admin fields
- **AND** single-value choice fields continue to use native HTML `select`
- **AND** it does not list series builder weekdays as a current example

#### Scenario: Admin event multi-value fields follow the preferred pattern
- **WHEN** an admin uses event create/edit languages or target age groups
- **THEN** those fields are collected with native checkbox multi-selects rather than `<select multiple>`
