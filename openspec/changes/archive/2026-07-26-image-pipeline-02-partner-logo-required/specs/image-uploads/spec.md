## ADDED Requirements

### Requirement: Required images for events and partners
Events SHALL continue to require a primary image. Partners SHALL also require a logo image. The former “partners optional logo” rule is removed. Partner logo supply SHALL use the same client Pica → prebuilt WebP persist path as event images and SHALL be mandatory on create.

#### Scenario: Partner logo required same pipeline as events
- **WHEN** an admin creates a partner
- **THEN** logo supply uses the same client Pica → prebuilt WebP persist path as event images and is mandatory

#### Scenario: Event primary image requirement unchanged
- **WHEN** an admin creates an event without a complete prebuilt primary image set
- **THEN** the system rejects the create (existing required-primary behavior remains in force)
