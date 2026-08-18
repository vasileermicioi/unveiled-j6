## 1. Setup

- [x] 1.1 Confirm prerequisites exist: `apps/web/app/lib/partner-opening-hours-display.ts` (`formatPartnerOpeningHoursLines`); `EventDetailPage` `DateTimesMetaCell` / `partnerHoursLines` / `showMemberBookingChrome`; `PartnerWithOpeningHours` story; `partner-opening-hours-display.test.ts`
- [x] 1.2 Skim `.dev-plan/current-iteration/05-event-detail-hours-display-parent-guide.md` (working days = open days; Date omits time iff published hours; checkout/map/cards out of scope; Gherkin/Playwright wait for step 02)

## 2. Opening-hours lines

- [x] 2.1 Filter `formatPartnerOpeningHoursLines` to days that are not `{ closed: true }`, still Mon→Sun among remaining; return `null` when the open set is empty (and keep disabled/null/malformed → `null`); drop unused `closedLabel` from this module
- [x] 2.2 Update `partner-opening-hours-display.test.ts`: EN/DE fixtures must not include closed-day rows; assert open `dayKey`s only in Mon→Sun order; all-closed week → `null`; keep disabled/null/malformed cases

## 3. DETAILS Date lines

- [x] 3.1 Add `apps/web/app/lib/event-detail-when-display.ts` exporting `formatEventDetailWhenLines(dateTimes, nextDateTime, locale, { includeTime })` per design.md decision 2 (Berlin YMD unique when `includeTime` is false; empty `dateTimes` falls back to `nextDateTime`); keep map popup date+time via a wrapper or shared timed formatter used only from `eventDetailMarkers`
- [x] 3.2 Add `apps/web/app/lib/event-detail-when-display.test.ts`: timed path keeps two same-day instants; date-only path collapses same Berlin YMD, marks `isNext` from `nextDateTime` YMD, keeps distinct days as separate lines, and omits `\d{2}:\d{2}`
- [x] 3.3 Wire `DateTimesMetaCell` to the helper; pass `includeTime={partnerHoursLines == null}`; keep Date chrome gated on `showMemberBookingChrome`; do not change `EventDetailCheckoutCard` datetime `<select>` labels or values

## 4. Ladle

- [x] 4.1 Update `PartnerWithOpeningHours` so listed hours are open days only (closed Wed/Sun in the fixture must not appear)
- [x] 4.2 Add `EligiblePartnerWithOpeningHours` (`viewer` eligible + `storyPartnerAttributionWithHours`) with two instants on the same Berlin day so date-only + collapse is reviewable; leave `Eligible` as the date+time control (no hours)

## 5. Cleanup and verification

- [x] 5.1 Mark `06-event-detail-hours-display-01-display-and-ui` done in `.dev-plan/current-iteration/05-event-detail-hours-display-parent-guide.md` (step 02 remains open; canonical Gherkin/ui-map/i18n/Playwright wait for step 02)
- [x] 5.2 Run `bun run lint` — exits 0
  <!-- Touched files pass `biome check`. Full-repo `bun run lint` still fails on pre-existing drizzle snapshot format (`packages/db/drizzle/meta/*`), not this change. -->
- [x] 5.3 Run `bun run typecheck` — exits 0
- [x] 5.4 Run `bun test apps/web/app/lib/partner-opening-hours-display.test.ts apps/web/app/lib/event-detail-when-display.test.ts` — exits 0 without `DATABASE_URL`
