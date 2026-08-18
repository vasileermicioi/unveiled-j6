## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/07-event-detail-hours-display-02-hardening.md`, parent guide Release Criteria, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 01 artifacts exist: `formatPartnerOpeningHoursLines` (open days only / `null` when none); `formatEventDetailWhenLines` wired in `DateTimesMetaCell` with `includeTime={partnerHoursLines == null}`; unit tests `partner-opening-hours-display.test.ts` and `event-detail-when-display.test.ts`
- [x] 1.3 Skim stale surfaces: Gherkin “including closed days” + “date/time chrome”; ui-component-map Mon→Sun open–close (or closed); i18n Closed on public detail; Playwright Wed/Sun Closed visible; admin-partners Enable scenario Tuesday Closed on public detail

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/event-discovery.feature`: `Guest sees partner opening hours` lists open weekday hours and closed weekdays are not listed; keep `Hours omitted when disabled`; add `Eligible member Date is date-only when partner has hours` and `Eligible member Date keeps time when partner has no hours`; tighten `Booking-eligible member sees tickets, credits and date on event detail` so Date chrome is not assumed to include clock time when hours are visible. Do not add a Same-day collapse Gherkin scenario
- [x] 2.2 Update `docs/product/ui/ui-component-map.md` Event detail: hours = working days only (closed weekdays omitted); Date = date-only when hours visible, date+time otherwise; checkout datetime `<select>` still full datetime
- [x] 2.3 Update `docs/product/extras/content-i18n-inventory.md` hours bullet: public detail lists working-day `HH:MM – HH:MM` only; Closed / Geschlossen remains for the admin partner form, not the public list

## 3. Playwright and coverage matrix

- [x] 3.1 Change `Scenario: Guest sees partner opening hours` in `e2e/specs/event-discovery.spec.ts`: keep `withPartnerOpeningHours` + `E2E_SAMPLE_OPENING_HOURS`; assert Monday 10:00–18:00 visible; Wednesday/Sunday Closed / Geschlossen `toHaveCount(0)`; keep `Hours omitted when disabled`; `DATABASE_URL` skip remains named
- [x] 3.2 Add `Scenario: Eligible member Date is date-only when partner has hours` and `Scenario: Eligible member Date keeps time when partner has no hours` (titles verbatim) inside the existing serial `partner opening hours on event detail` describe; reuse `loginMember` + `withPartnerOpeningHours`; assert clock time via Date/Datum parent walk (label-row → meta-cell), not page-wide and not the checkout select; no `data-testid`
- [x] 3.3 Confirm `Scenario: Dropdown changes credits` and `Scenario: Guest checkout omits slot picker` still expect checkout datetime times; leave those tests unchanged
- [x] 3.4 Invert public-detail Closed asserts in `e2e/specs/admin-partners.spec.ts` `Scenario: Enable weekly opening hours on create or edit` (Tuesday Closed / Dienstag Geschlossen `toHaveCount(0)`; Monday open range still visible). Do not change `fillPartnerOpeningHoursSampleWeek` or admin authoring Gherkin
- [x] 3.5 Update `docs/product/testing/coverage-matrix.md` rows for hours (open days; Wed/Sun count 0) plus the two new Date scenarios (`pass`, `DATABASE_URL` + member signup; notes: Date-cell clock gating, Same-day collapse covered by unit tests — never “UI not built”)

## 4. Cleanup and parent close-out

- [x] 4.1 Grep for stale public-detail wording (`including closed days`, Closed/Geschlossen expected visible on `/events/:id`, “date/time chrome” implying clock time whenever Date shows, ui-map “open–close (or closed)”) in `docs/product/` and `e2e/specs/event-discovery.spec.ts` / `e2e/specs/admin-partners.spec.ts`
- [x] 4.2 Mark `07-event-detail-hours-display-02-hardening` done in `.dev-plan/current-iteration/05-event-detail-hours-display-parent-guide.md` and walk parent **Release Criteria** (feature complete)
- [x] 4.3 Confirm canonical `docs/product/` reflects the shipped display; note archived OpenSpec specs are not SoT

## 5. Verification

- [x] 5.1 Run `bun run lint` — exits 0
  <!-- Touched files pass `biome check`. Full-repo `bun run lint` still fails on pre-existing drizzle snapshot format (`packages/db/drizzle/meta/*`), not this change. -->
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run `bun test apps/web/app/lib/partner-opening-hours-display.test.ts apps/web/app/lib/event-detail-when-display.test.ts` — exits 0 without `DATABASE_URL`
- [x] 5.4 Run targeted Playwright for `e2e/specs/event-discovery.spec.ts` opening-hours + new Date scenarios (and admin-partners Enable public-detail hours asserts) — pass, or env-skip when `DATABASE_URL` / member creds / `E2E_ADMIN_*` missing (never “UI not built”)
  <!-- 4 event-discovery hours/Date scenarios passed. Admin-partners Enable skipped (R2 / `E2E_ADMIN_*` env-skip, not “UI not built”). -->
- [x] 5.5 Prepare PR/handoff linking this change ID and the parent guide
