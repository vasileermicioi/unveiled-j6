## ADDED Requirements

### Requirement: Admin publish and unpublish featured membership
Admins SHALL publish or unpublish a featured event from `/:locale/admin/featured/:eventId/publish` and `/:locale/admin/featured/:eventId/unpublish`, and a featured partner from `/:locale/admin/featured-partners/:partnerId/publish` and `/:locale/admin/featured-partners/:partnerId/unpublish`, via form POST on dedicated pages (no client-only toggle, no localStorage draft, no publish inside featured drag-reorder POST). Admin featured lists SHALL show Published or Draft for the **featured membership** flag and SHALL keep unpublished rows. Adding to featured SHALL create an unpublished featured row (database default) and MUST NOT by itself make Discover show the item. A missing featured row SHALL return admin 404. POST SHALL be idempotent when the membership is already in the requested state. Successful POST SHALL persist only that featured flag and redirect to the originating featured list.

#### Scenario: Publish featured event
- **WHEN** an admin confirms publish on a featured event whose catalog event is also published
- **THEN** Discover may list it
- **AND** the featured row stays on `/admin/featured`

#### Scenario: Unpublish featured partner
- **WHEN** an admin confirms unpublish on a featured partner
- **THEN** Discover Partner venues omits it
- **AND** the partner remains on `/admin/partners` and `/admin/featured-partners`

#### Scenario: Add to featured stays off Discover until publish
- **WHEN** an admin adds an event or partner to featured
- **THEN** the new featured row is unpublished
- **AND** success copy does not claim Discover is updated
- **AND** Discover still omits the item until the featured row is published (and, for events, the catalog event is published)
