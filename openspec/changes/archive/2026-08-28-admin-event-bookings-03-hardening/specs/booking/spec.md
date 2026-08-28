## ADDED Requirements

### Requirement: Docs distinguish single cancel and cancel-all
The canonical booking feature file SHALL state that admin single-cancel never auto-refunds credits (waitlist may promote) and that admin cancel-all for an event does refund charged credits (waitlist is closed, not promoted). `docs/product/features/booking.feature` SHALL keep **Admin cancels a confirmed booking** with no credit refund, and SHALL add cancel-all scenarios whose Playwright titles in `e2e/specs/booking.spec.ts` match Gherkin verbatim. Playwright SHALL cover both paths so they cannot regress into each other. The existing single-cancel e2e MUST continue to assert credits are unchanged. Email for cancel-all MAY skip inbox assertion with an explicit no-harness reason; it MUST NOT use `@skip-no-ui`.

#### Scenario: Admin cancels all confirmed bookings for an event
- **WHEN** an admin cancels all confirmed bookings for an event with a non-empty reason
- **THEN** every previously CONFIRMED booking for that event is CANCELLED with that reason
- **AND** charged credits (each booking's total_credits) are returned to the corresponding members
- **AND** waitlist promotion does not run
- **AND** Playwright uses the title `Scenario: Admin cancels all confirmed bookings for an event`

#### Scenario: Cancel-all refunds paid tickets but not comps
- **WHEN** the event has a paid CONFIRMED booking and a complimentary CONFIRMED booking
- **THEN** the paid member's credits increase by that booking's total_credits
- **AND** the comp member's credits are unchanged
- **AND** both bookings become CANCELLED

#### Scenario: Cancel-all leaves USED bookings in place
- **WHEN** the event has a USED booking and a CONFIRMED booking
- **THEN** only the CONFIRMED booking is cancelled and refunded
- **AND** the USED booking is unchanged

#### Scenario: Cancel-all is idempotent when nothing is confirmed
- **WHEN** an admin runs cancel-all on an event with no CONFIRMED bookings
- **THEN** the operation succeeds without credit, inventory, or capacity changes

#### Scenario: Cancel-all requires a reason
- **WHEN** an admin submits cancel-all with a blank reason
- **THEN** the operation is rejected and no bookings change

#### Scenario: Member receives cancel-all email
- **WHEN** an admin completes cancel-all for an event the member had a paid CONFIRMED booking on
- **THEN** the member receives an email that the ticket is void and credits were returned

#### Scenario: Admin cancels a confirmed booking
- **WHEN** an admin cancels one CONFIRMED booking with a reason
- **THEN** the booking becomes CANCELLED
- **AND** no credits are refunded as part of that single cancellation
- **AND** Playwright continues to assert credits are unchanged
