# Admin Events

ADMIN catalog management for events, including the Featured curation tab used by Discover.

## Requirements

### Requirement: Automated coverage for admin remove from featured

The system’s BDD/e2e suite SHALL cover admin remove-from-featured: after confirm POST, the event SHALL disappear from Discover’s featured list and SHALL remain in the admin events catalog (`/:locale/admin/events`). Product docs / admin feature scenarios SHALL state that remove deletes only the `featured_events` membership row. Playwright SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Admin remove from featured keeps catalog event

- **WHEN** an admin removes an event from Featured
- **THEN** Discover no longer lists it
- **AND** the event remains in the admin events catalog

#### Scenario: Admin featured remove is documented

- **WHEN** a reader opens admin Featured scenarios in product docs (or `event-discovery` / admin feature files that cover Featured)
- **THEN** remove-from-featured is specified as keeping the underlying catalog event
