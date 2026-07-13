## ADDED Requirements

### Requirement: Admin waitlist list and manual promote
The system SHALL allow admins to list waitlist entries across events (status and skip history visible) and to manually promote a specific `WAITING` entry via the same promotion transaction as automatic promotion, even out of normal queue order.

#### Scenario: List waitlist entries for admin
- **WHEN** an admin lists waitlist entries with optional event and status filters
- **THEN** matching entries are returned including status and skip history (`skipped_once`)

#### Scenario: Manual promote
- **WHEN** an admin triggers promotion for a waiting entry with available capacity
- **THEN** the shared promote path runs immediately for that entry
