## ADDED Requirements

### Requirement: Admin publish and unpublish an event
Admins SHALL publish or unpublish a catalog event from dedicated SSR pages `/:locale/admin/events/:id/publish` and `/:locale/admin/events/:id/unpublish` via form POST (no client-only toggle, no localStorage draft). The Events catalog SHALL show a Published or Draft status and a link to the matching confirm page. Unpublished events SHALL remain on the admin list. Event edit SHALL offer a text link to the matching confirm page. After a successful create, the admin flow SHALL NOT imply the event is live on Browse and SHALL point at the publish confirm. A missing event SHALL return the same admin 404 as other event confirm pages. POST SHALL be idempotent when the event is already in the requested state. Successful POST SHALL persist `events.published` and redirect to the Events catalog.

#### Scenario: Publish confirm goes live on Browse
- **WHEN** an admin confirms publish for a draft event
- **THEN** `events.published` is true
- **AND** they are returned to the Events catalog

#### Scenario: Unpublish confirm hides from Browse
- **WHEN** an admin confirms unpublish for a published event
- **THEN** `events.published` is false
- **AND** the event remains on the admin Events catalog

#### Scenario: Create does not imply Browse is live
- **WHEN** an admin successfully creates an event
- **THEN** the success path does not claim the event is live on Browse
- **AND** it points the admin at the publish confirm for that event

#### Scenario: Non-admin cannot open event publish routes
- **WHEN** a guest or USER requests `/:locale/admin/events/:id/publish` or `.../unpublish`
- **THEN** access is denied per existing admin route guards (guest → login, USER → locale home)

### Requirement: Admin events list can filter by published
The Events catalog MAY accept `published=yes` or `published=no`. When omitted, both drafts and published rows SHALL appear. The filter SHALL compose with existing title, partner, language, sort, and page query params.

#### Scenario: Filter drafts
- **WHEN** an admin opens `/admin/events?published=no`
- **THEN** only unpublished events are listed
