## Why

Public event detail lists Mon→Sun partner hours including **Closed** / **Geschlossen** rows, and booking-eligible DETAILS **Date** always prints clock time via `EventDetailPage` `formatEventDateTime`. When the venue already publishes opening hours, that time is redundant and closed days add noise. This first `event-detail-hours-display` step changes display helpers and DETAILS chrome only so working days and date-only Date lines can ship before Gherkin/Playwright catch up.

## What Changes

- `formatPartnerOpeningHoursLines`: after a valid week parse, return only days that are **not** `{ closed: true }`, still Monday→Sunday among remaining. If zero open days, return `null` (omit the hours block).
- Extract a testable DETAILS Date formatter (e.g. `formatEventDetailWhenLines`) used by `DateTimesMetaCell`. When partner hours are shown (`partnerHoursLines != null`): Europe/Berlin **date only** (weekday + day + month + year, no hour/minute), unique by Berlin calendar YMD, next upcoming date still emphasized. When hours are omitted: keep current date+time lines (all `dateTimes`, next upcoming emphasized).
- Wire `DateTimesMetaCell` with `includeTime: partnerHoursLines == null`. Date chrome remains eligible-members only.
- Unit tests for both helpers; update `PartnerWithOpeningHours` (open days only); add or extend an eligible-member + hours Ladle story so Date-without-time is reviewable.
- Do **not** change checkout island datetime `<select>` labels/values, EventCard, map, JSON-LD, book flow, or admin partner hours.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-discovery`: Public event detail SHALL list partner **working days only** (closed weekdays omitted; empty/all-closed → omit hours). When DETAILS Date chrome is shown to booking-eligible members **and** the hours list is visible, Date lines SHALL be Europe/Berlin calendar dates without clock time, unique by Berlin YMD, next upcoming still emphasized. When hours are omitted, Date SHALL keep date+time. Checkout slot `<select>` SHALL still show full date+time.

## Impact

- **Display helpers:** `apps/web/app/lib/partner-opening-hours-display.ts` (filter closed days); new Date-line helper in `apps/web/app/lib/` (e.g. `formatEventDetailWhenLines`).
- **Page:** `EventDetailPage` `DateTimesMetaCell` consumes the helper; `formatEventDateTime` stays for map popup `dateTimeLabel` and as the include-time path.
- **Tests / stories:** `partner-opening-hours-display.test.ts`; new Date-line unit file; `EventDetailPage.stories.tsx`.
- **Source brief:** `.dev-plan/current-iteration/06-event-detail-hours-display-01-display-and-ui.md`
- **Parent:** `.dev-plan/current-iteration/05-event-detail-hours-display-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `07-event-detail-hours-display-02-hardening` (Gherkin, ui-component-map, i18n, Playwright)
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test` on the two helper unit files without `DATABASE_URL`
