## ADDED Requirements

### Requirement: Partner marquee accessibility
The partner logo marquee SHALL expose a single accessible section name (via the visible eyebrow and/or `aria-label` / `aria-labelledby` on the region). Duplicated logo nodes used only for seamless looping SHALL be hidden from the accessibility tree (`aria-hidden` on the duplicate track or clone cells). Logo images SHALL be decorative (`alt=""`) when the venue name is otherwise available to AT or purely ornamental in the strip.

#### Scenario: Duplicate track is not double-read
- **WHEN** a screen reader user lands on the Partner venues section
- **THEN** each partner is not announced twice solely because of the seamless-loop duplicate sequence

#### Scenario: Section has an accessible name
- **WHEN** a screen reader user navigates by region or landmark to Partner venues
- **THEN** the section is announced once using the Partner venues eyebrow (or equivalent accessible name)

### Requirement: Partner venues empty list hides section
When Discover has zero featured partners to show in the strip, the Partner venues section SHALL NOT render (no empty marquee track and no partner-specific empty-state copy).

#### Scenario: No partners hides Partner venues
- **WHEN** a guest views `/:locale` with an empty featured-partners list
- **THEN** the Partner venues eyebrow and logo strip are not shown
