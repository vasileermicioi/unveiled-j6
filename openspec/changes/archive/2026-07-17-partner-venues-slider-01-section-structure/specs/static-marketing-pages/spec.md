## ADDED Requirements

### Requirement: Discover partner venues section
The Discover locale home SHALL include a Partner venues section with a small uppercase eyebrow (“Partnerorte” / “Partner venues”) and a horizontal logo strip of featured partner venues (logo image or initial-letter fallback). The section SHALL NOT present a multi-column grid of address cards as the primary layout. The logo sequence markup SHALL include a duplicated partner sequence (or equivalent dual track) so a later continuous-loop animation can translate without restructuring. Partner addresses SHALL NOT be required as primary marquee cell content.

#### Scenario: Guest sees partner section prefix and logos
- **WHEN** a guest views `/:locale` with at least one featured partner
- **THEN** they see the Partner venues eyebrow and a horizontal sequence of partner logos (or initials)

#### Scenario: Partner strip is not an address card grid
- **WHEN** a guest views the Partner venues section on Discover
- **THEN** partner cells are logo-forward in a horizontal track and do not present address lines as the primary tile content

#### Scenario: Partner logos from catalog
- **WHEN** a partner in the strip has a `logo_image_id`
- **THEN** the strip displays the partner logo using the `medium-640` variant URL (or the existing Discover logo URL helper)

#### Scenario: Missing logo uses initial fallback
- **WHEN** a partner in the strip has no usable logo URL
- **THEN** the cell shows a large initial letter derived from the partner name
