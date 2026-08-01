## MODIFIED Requirements

### Requirement: Product docs and Playwright match Vibes preference options

`docs/product/features/profile.feature` Scenario “Edit cultural preferences ("Vibes")” and `e2e/specs/profile.spec.ts` SHALL describe / exercise the shipped Vibes editor: interests (including Other + free text), moods, location as `country` / `city` / `zip_code` under Germany/Berlin defaults, **travel distance (`max_distance` in kilometers)**, timing, preferred days, searchable languages, and accessibility needs — and SHALL NOT require or show Bezirk hangout multi-select. Coverage-matrix rows for that Scenario SHALL match the updated title/assertions and MUST NOT claim “no travel radius”.

#### Scenario: Profile feature file Vibes has zip and travel distance

- **WHEN** an implementer reads the Vibes scenario in `docs/product/features/profile.feature`
- **THEN** it mentions updating interests (including Other + free text), location zip under Germany/Berlin, travel distance (`max_distance`), languages (searchable list), or accessibility needs as implemented
- **AND** travel distance is part of the Vibes form (required when saving location fields)
- **AND** 12 Bezirke / hangout districts multi-select is not required
- **AND** the scenario does not state “travel radius is not part of the Vibes form”

#### Scenario: Profile e2e Vibes asserts zip and travel distance

- **WHEN** `e2e/specs/profile.spec.ts` runs Scenario Edit cultural preferences ("Vibes")
- **THEN** the preferences form shows zip under Germany/Berlin (not Bezirk checkboxes)
- **AND** the preferences form shows a travel-distance control (native number / labeled how-far copy)
- **AND** the test does not assert that travel distance / radius is absent
- **AND** saving preferences with a valid zip and distance still succeeds
