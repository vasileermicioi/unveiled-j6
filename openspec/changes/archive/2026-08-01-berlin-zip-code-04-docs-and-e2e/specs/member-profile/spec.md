## MODIFIED Requirements

### Requirement: Product docs and Playwright match Vibes preference options

`docs/product/features/profile.feature` Scenario “Edit cultural preferences ("Vibes")” and `e2e/specs/profile.spec.ts` SHALL describe / exercise the shipped Vibes editor: interests (including Other + free text), moods, location as `country` / `city` / `zip_code` under Germany/Berlin defaults, timing, preferred days, searchable languages, and accessibility needs — and SHALL NOT require or show travel radius or Bezirk hangout multi-select. Coverage-matrix rows for that Scenario SHALL match the updated title/assertions.

#### Scenario: Profile feature file Vibes has zip location and no travel radius

- **WHEN** an implementer reads the Vibes scenario in `docs/product/features/profile.feature`
- **THEN** it mentions updating interests (including Other + free text), location zip under Germany/Berlin, languages (searchable list), or accessibility needs as implemented
- **AND** travel radius is not part of the Vibes form
- **AND** 12 Bezirke / hangout districts multi-select is not required

#### Scenario: Profile e2e Vibes asserts zip location and no travel radius

- **WHEN** `e2e/specs/profile.spec.ts` runs Scenario Edit cultural preferences ("Vibes")
- **THEN** the preferences form shows zip under Germany/Berlin (not Bezirk checkboxes)
- **AND** the preferences form has no travel-distance control
- **AND** saving preferences still succeeds

## REMOVED Requirements

### Requirement: Profile hangout labels share onboarding district maps
**Reason**: Location preferences now use `country` / `city` / `zip_code` under Germany/Berlin; the 12 Berlin Bezirke multi-select and `getDistrictLabel` / `DISTRICTS` hangout chrome are no longer product requirements.
**Migration**: Use the shipped Vibes location editor requirement (zip under prefilled Germany/Berlin) and the modified “Product docs and Playwright match Vibes preference options” requirement; delete unused district label helpers when safe.
