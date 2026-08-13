## ADDED Requirements

### Requirement: Optional image credit
The `images` table SHALL store an optional `credit` text (nullable). Writes SHALL trim whitespace, persist `NULL` when empty or omitted, and reject values longer than 200 characters with a catalog validation error. `credit` is independent of `source` (`UPLOAD` | `REMOTE_URL`) and `source_url`. Inserting a new image (including replacements) SHALL set credit from the submitter or `NULL` and SHALL NOT copy credit from a replaced row. The catalog SHALL allow updating `credit` on an existing image id without replacing variants. Gallery list rows SHALL include `credit` so callers can read it without a second query.

#### Scenario: Persist credit on upload
- **WHEN** an image is persisted with credit "Photo: Ada"
- **THEN** `images.credit` is `Photo: Ada`

#### Scenario: Empty credit stores null
- **WHEN** an image is persisted with blank or omitted credit
- **THEN** `images.credit` is `NULL`

#### Scenario: Credit is trimmed
- **WHEN** an image is persisted with credit "  Photo: Ada  "
- **THEN** `images.credit` is `Photo: Ada`

#### Scenario: Credit too long is rejected
- **WHEN** an image write supplies credit longer than 200 characters
- **THEN** the write is rejected with a catalog validation error
- **AND** no new `images` row is inserted for that persist

#### Scenario: Replace does not inherit credit
- **WHEN** an event or partner image is replaced with a new upload and no credit is supplied
- **THEN** the new `images` row has `credit` NULL

#### Scenario: Update credit without replacing variants
- **WHEN** `updateImageCredit` is called for an existing image id with credit "Logo: Venue"
- **THEN** `images.credit` is `Logo: Venue`
- **AND** variant objects under `images/{id}/` are left unchanged

#### Scenario: Gallery list includes credit
- **WHEN** `listEventGalleryImages` returns a gallery photo whose `images.credit` is "Photo: Ada"
- **THEN** that row’s `credit` is `Photo: Ada`
