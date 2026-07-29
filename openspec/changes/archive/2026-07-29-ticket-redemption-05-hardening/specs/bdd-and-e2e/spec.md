## ADDED Requirements

### Requirement: Booking redemption Playwright covers three ticket types

`e2e/specs/booking.spec.ts` (and fixtures as needed) SHALL exercise member-visible redemption for `SECRET_CODE`, `VOUCHER_PROMO`, and `VOUCHER_PDF` using verbatim Gherkin Scenario titles from the updated `booking.feature` and proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`. Coverage SHALL include masked-by-default reveal/hide for textual codes and authorized PDF download (plus denial for guest or non-owner). Tests for removed modes (`SHARED_GENERATED`, `UNIQUE_PER_BOOKING`, legacy single `VOUCHER` promo outline) SHALL be deleted. Env-only skips (missing `DATABASE_URL`, R2, etc.) MUST name the prerequisite; product-mode skips for removed modes are forbidden. The coverage matrix and `e2e/README.md` SHALL reflect the new titles and statuses.

#### Scenario: No permanent skips for removed modes

- **WHEN** an implementer searches `e2e/specs/booking.spec.ts` after this change
- **THEN** there are no `test.skip` entries whose reason is missing SHARED_GENERATED / UNIQUE_PER_BOOKING / legacy VOUCHER seed

#### Scenario: Three-type member assertions exist

- **WHEN** booking redemption e2e runs with required env
- **THEN** SECRET_CODE and VOUCHER_PROMO paths assert mask/reveal on My Tickets or confirm
- **AND** VOUCHER_PDF asserts download success for the owner (or a named R2 env skip)
- **AND** selectors follow proximity/layout rules (no bare `input[name=…]` for labeled fields)

#### Scenario: Coverage matrix lists redemption rows

- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** rewritten booking redemption scenarios map to Playwright titles with `pass` or named env `skip`, not `unshipped` for removed modes
