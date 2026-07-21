## ADDED Requirements

### Requirement: Server accepts prebuilt variant sets
The system SHALL accept a complete set of six prebuilt JPEG variants from a trusted admin upload flow, validate them, store all six objects under `images/{id}/`, and insert one `images` row — without re-encoding or resizing on the server for that path.

#### Scenario: Valid prebuilt set persists
- **WHEN** an admin submission includes all six valid JPEG variants for a new image id
- **THEN** the server uploads those objects and returns/stores the image id for event or partner attachment

#### Scenario: Incomplete variant set rejected
- **WHEN** any of the six required variant files is missing or not JPEG
- **THEN** the server rejects the submission and does not leave a partial public image id referenced by events/partners

#### Scenario: Invalid OG or ladder dimensions rejected
- **WHEN** `og-1200x630.jpg` is not exactly 1200×630, or a ladder variant exceeds its max width/edge cap or is larger than the inspected `original.jpg`
- **THEN** the server rejects the submission without inserting an `images` row for attach

#### Scenario: Prebuilt path does not resize
- **WHEN** a valid prebuilt variant set is persisted through the prebuilt accept API
- **THEN** the server does not call sip/`generateImageVariants` resize for that request and stores the submitted JPEG bytes as-is
