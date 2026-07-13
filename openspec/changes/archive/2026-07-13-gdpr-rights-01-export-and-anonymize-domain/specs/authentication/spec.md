## ADDED Requirements

### Requirement: On-demand data export
The system SHALL generate a downloadable summary of a member's profile, bookings, and credit ledger synchronously on request without an asynchronous batch job.

#### Scenario: Export data
- **WHEN** a signed-in member requests a data export
- **THEN** a complete summary of their profile, bookings, and ledger is produced on demand

#### Scenario: Export excludes deleted accounts
- **WHEN** a data export is requested for a user whose `deleted_at` is set
- **THEN** the export is rejected with a typed already-deleted error and no payload is returned

### Requirement: Account anonymization
The system SHALL anonymize personally identifiable profile data on account deletion, set `deleted_at`, disable login via Neon Auth, retain booking and credit-ledger rows for legal retention, and cancel any active subscription as part of deletion. The same anonymization path SHALL serve self-service and admin-assisted deletion.

#### Scenario: Delete account
- **WHEN** account deletion is processed
- **THEN** PII is anonymized, financial history remains attached to the anonymized user id, and prior credentials no longer authenticate

#### Scenario: Deletion distinct from cancel
- **WHEN** a member only cancels their subscription
- **THEN** the account is not anonymized; deletion remains a separate action

#### Scenario: Admin-assisted deletion shares path
- **WHEN** an admin processes account deletion on a member's behalf
- **THEN** the same anonymization behavior applies as a self-service deletion

#### Scenario: Already-deleted is rejected
- **WHEN** anonymization is requested for a user who already has `deleted_at` set
- **THEN** the operation fails with a typed already-deleted error and Auth disable / subscription cancel side effects are not re-run
