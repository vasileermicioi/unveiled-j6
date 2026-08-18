## Why

Step 01 shipped working-day partner hours and date-only DETAILS Date when hours are visible, but product SoT and Playwright still require Mon→Sun including **Closed** / **Geschlossen** rows and always-on clock times. Until Gherkin, ui-component-map, i18n notes, coverage matrix, and e2e match the shipped display, CI verifies the wrong contract and the parent feature cannot close.

## What Changes

- Update `event-discovery.feature`:
  - `Guest sees partner opening hours` → open weekdays only; closed weekdays absent.
  - Keep `Hours omitted when disabled.`
  - Add two eligible-member Date scenarios whose titles match Playwright verbatim: `Eligible member Date is date-only when partner has hours` and `Eligible member Date keeps time when partner has no hours`.
  - Tighten `Booking-eligible member sees tickets, credits and date on event detail` so Date chrome is not assumed to include clock time when partner hours are visible.
- `ui-component-map.md` Event detail: hours = working days only; Date = date-only when hours visible, date+time otherwise; checkout datetime `<select>` still full datetime.
- `content-i18n-inventory.md` hours bullet: Closed / Geschlossen still exists for **other** surfaces (admin partner form), but public detail hours list no longer shows it.
- Playwright in `e2e/specs/event-discovery.spec.ts`: invert closed-day assertions (Wednesday/Sunday **not** visible; Monday open range still visible). Add the two eligible-member Date tests (proximity to DETAILS / Date / Datum). Leave `Dropdown changes credits` / `Guest checkout omits slot picker` expecting times. Coverage matrix rows updated.
- Mark parent step 02 done (feature complete). Canonical SoT is `docs/product/`; archived OpenSpec specs are not.
- Out of scope: display-helper rewrites (fix in 01); checkout/map/EventCard e2e; admin partner hours authoring scenarios; Featured events manager.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-discovery`: Product Gherkin, Event detail ui-component-map, i18n inventory, coverage matrix, and Playwright SHALL describe shipped DETAIL hours as **working days only** (closed weekdays omitted) and DETAILS Date as date-only iff partner hours are visible (eligible members). Playwright titles SHALL match Gherkin `Scenario:` lines verbatim. Checkout datetime `<select>` SHALL still show full slot date+time.

## Impact

- **Product SoT:** `docs/product/features/event-discovery.feature`, `docs/product/ui/ui-component-map.md` Event detail, `docs/product/extras/content-i18n-inventory.md` hours bullet, `docs/product/testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/event-discovery.spec.ts` opening-hours block + new Date scenarios; reuse `withPartnerOpeningHours` + `E2E_SAMPLE_OPENING_HOURS` and the file’s `loginMember` / signup+activate path. `e2e/fixtures/catalog.ts` sample week stays mixed open/closed (assertions invert).
- **Runtime UI / helpers:** no intended behavior change. Step 01 already ships `formatPartnerOpeningHoursLines` (open days only) and `formatEventDetailWhenLines` (`includeTime: partnerHoursLines == null`).
- **Parent close-out:** `.dev-plan/current-iteration/05-event-detail-hours-display-parent-guide.md` mark `07-event-detail-hours-display-02-hardening` done; walk Release Criteria.
- **Planning mirrors:** `openspec/specs/event-discovery` via this change’s deltas (not product SoT).
- **Source brief:** `.dev-plan/current-iteration/07-event-detail-hours-display-02-hardening.md`
- **Parent:** `.dev-plan/current-iteration/05-event-detail-hours-display-parent-guide.md`
- **Depends on:** `event-detail-hours-display-01-display-and-ui` (done / archived)
- **Consumed by:** closes the event-detail-hours-display parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test apps/web/app/lib/partner-opening-hours-display.test.ts apps/web/app/lib/event-detail-when-display.test.ts`; targeted Playwright opening-hours + new Date scenarios (env-skip when `DATABASE_URL` / member creds missing, never “UI not built”)
