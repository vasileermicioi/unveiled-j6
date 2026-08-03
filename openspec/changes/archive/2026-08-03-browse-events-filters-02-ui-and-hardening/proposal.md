## Why

Step 01 shipped title filtering and today-floor / future-only query behavior, but the member Browse events UI still lacks an event-name field, date inputs still allow picking past days, and product Gherkin / e2e / copy do not yet describe the full filter surface. This step closes `browse-events-filters` by exposing those domain filters on list and map and aligning specs.

## What Changes

- Add a native event-name text field (`name="title"`) to `EventFeedFilters`; keep category, partner `<select>`, and date range.
- Set date inputs `min` to Europe/Berlin today (YYYY-MM-DD); server clamp from step 01 remains authoritative.
- Ensure reset link clears title + category + partner + dates (href to bare list/map path already does this once fields are form-driven).
- Update DE/EN feed copy keys for the event-name control.
- Update `event-discovery.feature`, coverage matrix, and Playwright scenarios (proximity/layout selectors only) for event name filter, reset clearing title, map parity with title, and today-floor date behavior.
- Prefer a Ladle story with title applied.
- Out of scope: multi-datetime display, admin filters, Discover featured past events, new sort UI, removing category.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-discovery`: Browse events filter form SHALL include an event-name (`title`) control; reset SHALL clear title alongside other filters; map SHALL mirror title + category + partner + date filters (including future-only / today floor); date inputs SHOULD advertise `min` = Berlin today.

## Impact

- **UI (`apps/web`):** `EventFeedFilters.tsx` (+ stories); `event-feed-content.ts` i18n; routes already pass `title` from step 01 — verify shell/filter wiring only.
- **Docs / BDD:** `docs/product/features/event-discovery.feature`; `docs/product/testing/coverage-matrix.md`; optional one-line note in `gaps-and-decisions.md` if product wants the today-floor + title filter logged.
- **E2E:** `e2e/specs/event-discovery.spec.ts` — add/adjust scenarios for title filter control and behavior; extend reset/map coverage to include title.
- **Source brief:** `.dev-plan/current-iteration/02-browse-events-filters-02-ui-and-hardening.md`
- **Parent:** `.dev-plan/current-iteration/02-browse-events-filters-parent-guide.md`
- **Depends on:** `02-browse-events-filters-01-domain-and-query` (archived / done)
- **Verification:** `bun run lint`; `bun run typecheck`; relevant Playwright discovery specs when e2e env available
