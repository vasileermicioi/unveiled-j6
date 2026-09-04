## MODIFIED Requirements

### Requirement: Admin member list and detail queries
The system SHALL expose admin-only domain operations to list members (sorted by name then email by default), filter by name/email/role, subscription status (including no-subscription), credit range, booking-count range, event-open-count range, and registration date range, and sort by member name, role, subscription, credits, bookings, event opens, or registration date in either direction with a stable default (display name, then email, then id). List and count operations SHALL apply identical filter predicates. Soft-deleted members (`deleted_at` set) SHALL be excluded from the list and SHALL NOT be returned as a successful detail load. Detail loads SHALL return a member detail aggregate including preferences, history counts, and available behavior fields.

#### Scenario: List members for Membership HQ
- **WHEN** an admin requests the member list
- **THEN** all non-deleted member accounts are returned sorted by display name, then email

#### Scenario: Search members by name, email, or role
- **WHEN** an admin lists members with a search query and/or role filter
- **THEN** only members matching the name/email query and role (when provided) are returned

#### Scenario: Member detail aggregate
- **WHEN** an admin loads member detail for an existing non-deleted user
- **THEN** the result includes profile preferences, subscription status when present, history counts (bookings, waitlist, saved events), and available behavior JSON fields without inventing missing analytics

#### Scenario: Range and enum filters compose
- **WHEN** an admin lists members with subscription `ACTIVE`, credits `10..17`, and created `2026-01-01..2026-12-31` sorted by created desc
- **THEN** list and count agree and every row matches all three predicates

#### Scenario: No-subscription filter
- **WHEN** an admin lists members with subscription filter `NONE`
- **THEN** only members with no subscription row are returned, and list and count agree

#### Scenario: Numeric range filters
- **WHEN** an admin lists members with a credits, booking-count, or event-open-count min/max range
- **THEN** only members whose value falls inside the inclusive range are returned, and list and count agree

#### Scenario: Registration date range uses calendar days
- **WHEN** an admin lists members with a created from/to date range
- **THEN** only members registered within the Europe/Berlin calendar-day bounds (inclusive, `from <= to`) are returned

#### Scenario: Sortable member list
- **WHEN** an admin lists members sorted by any of member, role, subscription, credits, bookings, event opens, or created in either direction
- **THEN** rows are ordered by the requested key and direction with a deterministic tiebreak (display name, then email, then id), and omitting sort preserves the name-asc default

#### Scenario: Invalid filter input is ignored
- **WHEN** an admin lists members with an invalid filter or sort value (unknown enum, malformed date, inverted range end, unknown sort key)
- **THEN** the invalid predicate is ignored without error and remaining valid predicates still apply
