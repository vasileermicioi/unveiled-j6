## Context

Parent feature: Event detail hours display (`.dev-plan/current-iteration/05-event-detail-hours-display-parent-guide.md`), step 01 of 02 — display helpers and DETAILS chrome. See `proposal.md` for motivation. Canonical product Gherkin, ui-component-map, i18n inventory, and Playwright wait for step 02.

Current state:

- `formatPartnerOpeningHoursLines` maps all seven `OPENING_HOURS_DAY_KEYS` and labels closed days Closed / Geschlossen. Returns `null` only when hours are disabled, null, or `parseOpeningHours` throws. An all-closed valid week still yields seven closed rows.
- `EventDetailPage` computes `partnerHoursLines` once and lists them under partner name/logo. `DateTimesMetaCell` always calls local `formatEventDateTime` (weekday + day + month + year + hour + minute, `Europe/Berlin`) for every `event.dateTimes` (fallback `[nextDateTime]`), emphasizing the denormalized primary by instant equality. Date chrome is gated on `viewer.kind === "eligible"`.
- Map popup `dateTimeLabel` also uses that local formatter — **leave it**. Checkout labels live in `formatOccurrenceLabel` (`apps/web/app/lib/checkout-slot.ts`) — **leave it**.
- Ladle: `PartnerWithOpeningHours` is a **guest** story with Wed/Sun closed. `Eligible` / `MultiDateTimesEligible` have no hours (`storyPartnerAttribution` lacks `hasOpeningHours`). `mockEvent.dateTimes` are 2026-08-15 and 2026-08-22 (different Berlin days).
- Tests: `partner-opening-hours-display.test.ts` asserts tue Closed / DE Geschlossen and full Mon→Sun keys.

Constraints: display-only (no catalog/schema writes); HeroUI-only chrome (existing `<img>` exceptions); locale via `Intl` + existing day labels; Europe/Berlin; hard rule 9 (no ad-hoc color/type classes); Date chrome stays eligible-only.

## Goals / Non-Goals

**Goals:**

- Opening-hours lines = open weekdays only, Mon→Sun among remaining; `null` when none.
- Testable Date-line helper; `DateTimesMetaCell` date-only + unique Berlin YMD iff hours list is shown.
- Unit tests without `DATABASE_URL`; Ladle guest hours (open days) + eligible+hours (date-only Date).

**Non-Goals:**

- Gherkin / Playwright / ui-component-map / content-i18n-inventory / coverage matrix (step 02).
- Checkout `<select>`, EventCard, map popup, JSON-LD `startDate`, book/confirm pages, admin partner hours form.
- Filtering stored `dateTimes` by weekday.
- ALL_DAY midnight display when the partner has no hours.

## Decisions

1. **Filter closed days in `formatPartnerOpeningHoursLines`; `null` when the open set is empty**
   - **Choice:** After a successful `parseOpeningHours`, map Mon→Sun then **drop** days with `{ closed: true }`. If the filtered array length is 0, return `null` (same as disabled). Keep DE/EN `DAY_LABELS` and `HH:MM – HH:MM`. Remove the unused `closedLabel` helper from this module (admin form still owns Closed / Geschlossen).
   - **Rationale:** Parent risk: empty all-closed block must not render. Returning `null` reuses existing `{partnerHoursLines ? …}` so `DateTimesMetaCell` also treats all-closed like “no hours” (date+time).
   - **Alternatives:** Return `[]` and teach the page to hide empty arrays (two omit paths). Keep Closed rows (rejected — this change).

2. **New `formatEventDetailWhenLines` in `apps/web/app/lib/event-detail-when-display.ts`**
   - **Choice:** Export:

     ```ts
     formatEventDetailWhenLines(
       dateTimes: Date[],
       nextDateTime: Date,
       locale: Locale,
       options: { includeTime: boolean },
     ): Array<{ key: string; label: string; isNext: boolean }>
     ```

     Sort ascending by instant. If `dateTimes` is empty, use `[nextDateTime]` (today’s cell).  
     **`includeTime: true`:** one row per instant; label = current `formatEventDateTime` options (weekday/day/month/year + hour/minute, `de-DE` / `en-GB`, `Europe/Berlin`); `isNext` = same instant as `nextDateTime`; `key` = ISO string.  
     **`includeTime: false`:** unique by Europe/Berlin calendar YMD (`en-CA` `year`/`month`/`day` → `YYYY-MM-DD`); keep the earliest instant per YMD as the representative; label omits hour/minute; `isNext` = that row’s YMD equals `nextDateTime`’s Berlin YMD (so two same-day slots still emphasize the upcoming date); `key` = YMD. Move the existing local `formatEventDateTime` into this module (or a private sibling) and keep a thin wrapper in `EventDetailPage` **only** for `eventDetailMarkers.dateTimeLabel`.
   - **Rationale:** Step plan names this helper; unit tests must not import the page. Unique-by-YMD is a parent open question resolved here. `en-CA` YMD is the same trick used elsewhere for Berlin calendar days.
   - **Alternatives:** Fold Date formatting into `partner-opening-hours-display.ts` (wrong domain). Format inside the cell with a boolean (harder to unit-test collapse). Unique by UTC date (wrong around CET/CEST midnight).

3. **`DateTimesMetaCell` takes `includeTime`; page passes `partnerHoursLines == null`**
   - **Choice:** Add `includeTime: boolean` to the cell. Call `formatEventDetailWhenLines(dateTimes, nextDateTime, locale, { includeTime })` and render `line.label` with existing `--next` / `color="muted"` classes from `line.isNext`. Do not add new theme classes. Page: `includeTime={partnerHoursLines == null}` (hours shown → date-only). Keep `showMemberBookingChrome` as the only Date-chrome gate. Do not pass hours into the checkout island.
   - **Rationale:** One boolean derived from the same `partnerHoursLines` the hours list uses, so Date and hours cannot disagree. Step plan: `includeTime: partnerHoursLines == null`.
   - **Alternatives:** Pass `partnerHoursLines` into the cell (leaks hours types). Derive from `hasOpeningHours` without parse (would show date-only even when hours fail parse / all-closed — wrong; those omit the list).

4. **Leave checkout, map, and local datetime `<select>` formatters unchanged**
   - **Choice:** Do not edit `EventDetailCheckoutCard`, `formatOccurrenceLabel`, `eventDetailMarkers` label semantics (still date+time), JSON-LD, or book flow.
   - **Rationale:** Parent non-goals. Members still pick a slot by clock time in checkout.
   - **Alternatives:** Date-only checkout labels (rejected — cannot distinguish same-day slots).

5. **Tests: rewrite hours fixtures; new Date-line file**
   - **Choice:** In `partner-opening-hours-display.test.ts`: EN/DE fixtures MUST NOT include tue/wed/sun closed rows; assert `dayKey` list is only open days in Mon→Sun order; add all-closed week → `null`; keep disabled/null/malformed → `null`. New `apps/web/app/lib/event-detail-when-display.test.ts`: includeTime true keeps two same-day instants as two timed labels; includeTime false collapses them to one date-only label and marks `isNext` from `nextDateTime`’s YMD; different Berlin days stay two lines; empty `dateTimes` falls back to `nextDateTime`.
   - **Rationale:** Step verification is these two files without `DATABASE_URL`. Closed-label assertions would fail after the filter.
   - **Alternatives:** One combined test file (harder to grep). Snapshot full Intl strings only (brittle across ICU); prefer asserting absence of `:` hour pattern / presence of year, plus `isNext` / `key`.

6. **Ladle: keep guest hours story; add eligible + hours**
   - **Choice:** Update `PartnerWithOpeningHours` (guest) so listed rows are open days only (Wed/Sun closed remain in the fixture but must not appear). Add `EligiblePartnerWithOpeningHours`: `viewer={{ kind: "eligible" }}`, `storyPartnerAttributionWithHours`, and `dateTimes` with two instants on the **same** Berlin calendar day plus the existing later day (or override `mockEvent.dateTimes`) so reviewers see date-only + collapse. Do not change `Eligible` (no hours → date+time control).
   - **Rationale:** Step: update hours story; add eligible + hours if missing. Guest story still proves hours ungated. Same-day slots make collapse reviewable without Playwright.
   - **Alternatives:** Flip the existing guest story to eligible (loses ungated hours). Only unit-test collapse (weaker Ladle review).

7. **Docs/e2e deferred; product SoT stays on `docs/product/` until step 02**
   - **Choice:** Do not edit `event-discovery.feature`, ui-component-map, i18n inventory, or Playwright. Deltas in this change are the planning contract. After apply, mark `06-event-detail-hours-display-01-display-and-ui` done in the parent guide; leave step 02 open.
   - **Rationale:** 5-step pattern. Existing e2e still asserts Closed Wednesday/Sunday until 02 inverts it — land 01+02 close together or expect that scenario to fail if CI runs against this UI first.
   - **Alternatives:** Patch Gherkin now (rejected — splits hardening).

## Risks / Trade-offs

- **[Risk] Existing Playwright `Guest sees partner opening hours` asserts closed Wednesday/Sunday** → Mitigation: step 02 inverts those assertions. Do not rewrite e2e here. Document in the PR that the hours scenario may fail until 02.
- **[Risk] Same-day slots become duplicate date-only lines** → Mitigation: unique by Europe/Berlin YMD (decision 2).
- **[Risk] All-closed week renders an empty hours block and also date-only Date** → Mitigation: `null` when no open days so hours omit and Date keeps time.
- **[Risk] Intl date-only strings still contain a time in some locales** → Mitigation: omit `hour`/`minute` from `DateTimeFormat` options; unit-test EN/DE labels have no `\d{2}:\d{2}` when `includeTime` is false.
- **[Trade-off] Product Gherkin lags the UI until step 02** → Acceptable; this delta is the contract.
- **[Trade-off] Map popup still shows date+time while DETAILS Date may not** → Parent non-goal; map is out of scope.

## Migration Plan

1. Filter `formatPartnerOpeningHoursLines`; update its unit tests.
2. Add `event-detail-when-display.ts` + tests; wire `DateTimesMetaCell`.
3. Update / add Ladle stories.
4. `bun run lint`, `bun run typecheck`, `bun test` on both helper files.
5. Mark step 01 done in the parent guide (step 02 still open). Canonical product docs wait for step 02.
6. **Rollback:** revert the UI PR. No DB migration. Checkout/map/booking unchanged.

## Open Questions

- None blocking. Closed-day Playwright assertions are owned by `07-event-detail-hours-display-02-hardening`.
