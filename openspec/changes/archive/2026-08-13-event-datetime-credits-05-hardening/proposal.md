## Why

Steps 01–04 shipped per-occurrence credits, admin list + range builder, and checkout slot booking, but canonical Gherkin, schema notes, gaps/decisions, and Playwright still describe parked multi-datetime UI and event-scoped booking. Without this sweep, future agents will reintroduce dead behavior and the parent feature cannot be marked released.

## What Changes

- Rewrite Gherkin in `admin-events.feature`, `booking.feature`, and `event-discovery.feature` so scenarios match shipped UI. Playwright titles MUST match those Scenario lines verbatim.
- Unskip `Scenario: Add and remove datetimes on create` in `e2e/specs/admin-events.spec.ts`; extend it to fill per-row credits. Add e2e for range builder, partner-hours defaults, checkout dropdown, and slot booking.
- Update `schema-overview.md` (`occurrence_credit_prices` already present; add `bookings.date_time`; stop saying ICS/email use denormalized `events.date_time`). Replace the gaps-and-decisions “admin UI parked / MVP booking remains event-scoped” row. Refresh `ui-component-map.md` and `coverage-matrix.md`.
- Sweep Ladle fixtures / seed comments that claim booking is event-scoped or that admin multi-datetime is parked. Delete leftover `ALLOW_MULTI_DATETIME_UI` comments/flag if nothing still gates on it.
- No new product behavior beyond copy/a11y fixes required so proximity selectors (`getByLabel`) work. Do not add `data-testid`.
- Out of scope: per-slot capacity, waitlist slot picker, partner portal, new admin routes, design-token changes.

## Capabilities

### New Capabilities

_(none)_ — hardening closes `event-datetime-credits`; no new domain capability.

### Modified Capabilities

- `admin-events`: Canonical Gherkin and Playwright MUST document add/remove datetime rows with per-row credits, list total, range builder (including rebuild-from-scratch), and partner opening-hours default slots on create. Create still says “one or more dateTimes” and credits per datetime (not a single credit price).
- `booking`: Canonical Gherkin MUST describe datetime selection on event detail / book, charging the selected occurrence’s credits, event-level capacity, and confirm/ICS/email using `bookings.date_time`. Remove “no datetime slot selection” / “without a slot selection step” wording.
- `event-discovery`: Canonical Gherkin MUST include a booking-eligible checkout dropdown scenario and keep guest omit-credits behavior. Compact cards SHALL continue to show next upcoming datetime and denormalized `credit_price`.

## Impact

- **Product SoT:** `docs/product/features/{admin-events,booking,event-discovery}.feature`, `database/schema-overview.md`, `extras/gaps-and-decisions.md`, `ui/ui-component-map.md`, `testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/admin-events.spec.ts` (unskip + extend), `e2e/specs/booking.spec.ts`, `e2e/specs/event-discovery.spec.ts`; fixtures as needed. Environment skips (`E2E_ADMIN_*`, R2, `DATABASE_URL`) remain named skips — not `@skip-no-ui`.
- **Flag / comments:** `apps/web/app/lib/admin-event-form.ts` `ALLOW_MULTI_DATETIME_UI` (true since step 02; delete with the parked skip if unused).
- **Fixtures:** Ladle / seed comments that still say event-scoped booking or parked admin multi-datetime.
- **OpenSpec mirror:** Sync `openspec/specs/{admin-events,booking,event-discovery}/spec.md` only if they still lag this change; canonical SoT remains `docs/product/`. `event-catalog` already has occurrence-credit schema from step 01 — no new catalog requirement unless schema-overview notes still contradict it.
- **Source brief:** `.dev-plan/current-iteration/event-datetime-credits-05-hardening.md`
- **Parent:** `.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`
- **Depends on:** `event-datetime-credits-04-checkout-slot` (done)
- **Consumed by:** closes the Event datetime credits feature
- **Verification:** `bun run lint`; `bun run typecheck`; targeted Playwright `e2e/specs/admin-events.spec.ts e2e/specs/booking.spec.ts e2e/specs/event-discovery.spec.ts`
