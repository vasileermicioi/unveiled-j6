## ADDED Requirements

### Requirement: Admin optional credit on partner, event, and gallery images
Admin partner logo, event primary image, and gallery add/manage SHALL offer an optional credit text field (max 200). JavaScript image processing is unchanged. Field names SHALL be `image_credit` for partner logo and event primary, and `image_credit_{index}` for gallery-add files (index aligned with that file’s prebuilt set). Keeping an existing image on edit SHALL still allow changing credit via SSR POST (`updateImageCredit`) without replacing variants. Gallery add SHALL collect credit per file and persist it on the new `images` row. Gallery manage SHALL show credit under thumbs and SHALL persist credit changes on the same SSR POST as Save order (fields keyed by image id). Replacing an image SHALL apply submitted credit to the new row only; omitted or empty credit SHALL persist NULL and SHALL NOT copy the previous row. Empty credit SHALL persist NULL and SHALL NOT render a public caption. Admin copy SHALL use DE “Bildnachweis” (hint “z. B. Foto: Name”) and EN “Image credit” (hint “e.g. Photo: Name”). `docs/product/features/admin-events.feature` SHALL include scenarios titled `Event primary credit on create`, `Keep existing image and edit credit`, and `Gallery photo credit on add`. `docs/product/features/admin-partners.feature` SHALL include `Partner logo credit without replacing the file`. Playwright SHALL use those titles verbatim. R2 skip is allowed when an upload is required.

#### Scenario: Event primary credit on create
- **WHEN** I create an event and set image credit to "Photo: Ada"
- **THEN** the public event detail shows that credit under the primary image

#### Scenario: Keep existing image and edit credit
- **WHEN** I edit an event, keep the primary image, and set credit to "Logo: Venue"
- **THEN** the stored primary image credit is "Logo: Venue"
- **AND** variant objects under that image id are left unchanged

#### Scenario: Partner logo credit without replacing the file
- **WHEN** I edit a partner, keep the logo, and set credit to "Logo: Venue"
- **THEN** the stored logo image credit is "Logo: Venue"

#### Scenario: Gallery photo credit on add
- **WHEN** I add a gallery photo and set that file’s credit to "Photo: Ada"
- **THEN** the new gallery image row has credit "Photo: Ada"

#### Scenario: Empty credit omitted
- **WHEN** an image has NULL credit
- **THEN** public event detail does not show a credit caption for that image
