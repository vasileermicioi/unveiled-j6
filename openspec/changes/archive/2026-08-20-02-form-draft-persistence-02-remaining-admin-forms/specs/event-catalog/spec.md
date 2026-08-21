## ADDED Requirements

### Requirement: Catalog add/edit forms restore unsaved drafts

Admin partner create/edit, event clone, and event gallery add SHALL use the same browser `localStorage` draft helper as the event wizard: restore after refresh, skip raw `File` inputs, show Discard, and clear on successful save POST. Form ids SHALL be unique per resource and intent (`admin-partner:new`, `admin-partner:{id}`, `admin-event-clone:{sourceId}`, `admin-event-gallery-add:{eventId}`). Named non-file fields that already exist in the form (including staged image ids, image credits, and pasted promo-code text) MAY be restored. Search, delete-confirm, freeze/refund/adjust-credits, comp-ticket, featured-add search, and member profile/onboarding forms SHALL NOT opt in.

#### Scenario: Refresh on new partner keeps the name

- **WHEN** an admin types a partner name on `/:locale/admin/partners/new` and refreshes
- **THEN** the name field still shows the unsaved value
- **AND** a discard control is available

#### Scenario: Refresh on partner edit keeps unsaved fields

- **WHEN** an admin changes a partner field on `/:locale/admin/partners/:id/edit` and refreshes
- **THEN** that field still shows the unsaved value

#### Scenario: Clone refresh keeps edited datetimes

- **WHEN** an admin changes clone datetimes and refreshes
- **THEN** the clone form still shows those unsaved datetimes

#### Scenario: Gallery add refresh keeps photo credit

- **WHEN** an admin enters a photo credit on `/:locale/admin/events/:id/gallery/add` after staging images as named hidden fields and refreshes
- **THEN** the credit field still shows the unsaved value

#### Scenario: Successful catalog save clears the draft

- **WHEN** an admin successfully creates or updates a partner, clones an event, or adds gallery images
- **THEN** reopening that same form shows server-rendered values, not the previous unsaved draft

#### Scenario: File inputs are not stored on catalog forms

- **WHEN** an admin selects a partner logo, gallery image, or voucher PDF file and a draft is saved
- **THEN** the stored draft does not contain raw file bytes
- **AND** already-staged image id and credit fields that exist as named non-file inputs MAY be restored

#### Scenario: Discard draft reloads server values

- **WHEN** an admin has a restored draft on partner, clone, or gallery add and activates Discard draft
- **THEN** the stored draft is removed
- **AND** the form shows server-rendered values (database on edit, empty/defaults on create)
