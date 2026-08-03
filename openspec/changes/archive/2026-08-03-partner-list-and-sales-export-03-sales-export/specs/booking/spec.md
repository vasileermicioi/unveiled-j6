## ADDED Requirements

### Requirement: Admin sales export — tickets sold per event over a period

The system SHALL provide an ADMIN-only sales-export page (`/:locale/admin/partners/export`) that accepts a date period (`from` / `to` as `YYYY-MM-DD`, Europe/Berlin calendar days, inclusive) and SHALL show a table listing every event with the number of tickets sold in that period, plus a CSV download. Tickets sold SHALL be the sum of `bookings.tickets_count` for bookings whose `created_at` falls within the inclusive period and whose status is `CONFIRMED` or `USED` (excluding `CANCELLED` and `WAITLIST`). Comp tickets that create bookings on the shared booking path SHALL count. When `from`/`to` are omitted on first open, the page SHALL default to a recent inclusive window of the last 30 Europe/Berlin calendar days. Invalid ranges SHALL be rejected with a clear error and SHALL NOT produce a CSV attachment. The HTML and CSV responses SHALL be guarded by the existing admin route guard and SHALL use `noindex` for the HTML page. Aggregation and CSV formatting SHALL live in `@unveiled/db` (single-source helper), with the route wiring data and rendering only.

#### Scenario: View tickets sold for a period

- **WHEN** an ADMIN opens the sales-export page and sets a valid `from`/`to` period
- **THEN** a table lists every event with its tickets-sold count for that period

#### Scenario: Download sales CSV

- **WHEN** an ADMIN requests the export in CSV format for a valid period
- **THEN** the response is `text/csv` with a `Content-Disposition` attachment and one row per event with its tickets-sold count

#### Scenario: Cancelled and waitlist bookings excluded

- **WHEN** calculating tickets sold for a period
- **THEN** `CANCELLED` and `WAITLIST` bookings are not counted

#### Scenario: Confirmed and used bookings counted

- **WHEN** calculating tickets sold for a period that includes `CONFIRMED` and `USED` bookings
- **THEN** each such booking’s `tickets_count` is included in the event’s tickets-sold total

#### Scenario: Default period when params omitted

- **WHEN** an ADMIN opens the sales-export page with no `from` or `to` query params
- **THEN** the page applies the default last-30-calendar-days Europe/Berlin window and shows results for that period

#### Scenario: Invalid period rejected

- **WHEN** an ADMIN submits an invalid or inverted `from`/`to` range
- **THEN** the page shows a clear error and does not treat the request as a successful export

#### Scenario: Export is admin-only

- **WHEN** a guest or `USER` requests the sales-export route
- **THEN** access is denied per the existing admin route guard
