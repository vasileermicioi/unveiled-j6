## ADDED Requirements

### Requirement: Featured events list shows thumbnails

Featured events list and add-results SHALL show a primary-image thumbnail per row, using the admin list thumb convention (`small-320.webp` via the shared image URL helper). When a thumb URL cannot be built or the image is missing, the row SHALL show a safe placeholder. Missing or broken thumbs MUST NOT block add, remove, or gallery actions for that row. Thumbnail markup SHALL use HeroUI chrome with the documented `<img>` exception and theme admin table logo styles (no ad-hoc colors/borders/shadows).

#### Scenario: Featured list row shows a thumbnail or placeholder

- **WHEN** an ADMIN views `/admin/featured` with at least one featured event
- **THEN** each featured row shows a primary-image thumbnail cell (or placeholder) alongside title, partner, and date

#### Scenario: Add-results row shows a thumbnail or placeholder

- **WHEN** an ADMIN searches on `/admin/featured/add` and results include catalog events
- **THEN** each result row shows a primary-image thumbnail cell (or placeholder) alongside title, partner, and date

#### Scenario: Missing or broken thumb does not block actions

- **WHEN** a featured or add-results row has no usable thumb URL (or the image fails to load)
- **THEN** the ADMIN can still use that row’s add, remove, and/or gallery actions
