## Context

Parent feature: Event detail hours display (`.dev-plan/current-iteration/05-event-detail-hours-display-parent-guide.md`), step 02 of 02 — docs and e2e. See `proposal.md` for motivation. Canonical product behavior is `docs/product/`; OpenSpec `openspec/specs/` is a planning mirror only.

Runtime already matches parent release criteria for display (step 01 done / archived):

- `formatPartnerOpeningHoursLines` returns open weekdays only (Mon→Sun among remaining) or `null` when the open set is empty.
- `DateTimesMetaCell` uses `formatEventDetailWhenLines(..., { includeTime: partnerHoursLines == null })`.
- Checkout `EventDetailCheckoutCard` datetime `<select>` still uses `formatOccurrenceLabel` (full date+time). Map popup still uses timed `formatEventDateTime`.
- Unit tests: `partner-opening-hours-display.test.ts`, `event-detail-when-display.test.ts`.

What remains is the **verification and documentation layer**. Product Gherkin still says hours include closed days and eligible Date is “date/time chrome.” Playwright `Guest sees partner opening hours` still expects Wednesday/Sunday Closed / Geschlossen for `E2E_SAMPLE_OPENING_HOURS` (Wed/Sun closed, Mon 10:00–18:00 open). No Playwright exists for date-only vs date+time Date lines.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim; proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); no `data-testid`; do not rewrite display helpers if step 01 left gaps; HeroUI/theme rules unchanged; checkout/map/EventCard e2e stay as they are except where they still assert Closed on **public detail**.

## Goals / Non-Goals

**Goals:**

- Bind Gherkin, ui-component-map Event detail, i18n inventory hours bullet, coverage matrix, and Playwright to the shipped working-day hours + Date gating.
- Close the parent feature: mark step 02 done and walk Release Criteria.

**Non-Goals:**

- Display-helper or `EventDetailPage` rewrites (belongs in 01).
- New checkout / map / EventCard / JSON-LD / book-flow e2e.
- Admin partner hours **authoring** Gherkin (create/edit form still lists Closed days).
- Playwright for `Same-day slots collapse when time is omitted` (unit tests already cover it).
- Featured events manager.

## Decisions

1. **Docs-and-Gherkin first, then Playwright, then matrix, then close-out**
   - **Choice:** Update `event-discovery.feature` + ui-component-map + i18n inventory → rewrite hours Playwright + add Date tests → coverage-matrix rows → stale-wording grep → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim; avoid matrix title drift.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **Locked Gherkin / Playwright titles**
   - **Choice:** Keep existing titles; add the two Date titles already named in step 01 (do **not** ship a combined `Eligible member Date chrome follows partner hours` title — that would force a third Playwright test and diverge from step 01):
     - `Guest sees partner opening hours` (body only)
     - `Hours omitted when disabled` (unchanged)
     - `Eligible member Date is date-only when partner has hours` (**new**)
     - `Eligible member Date keeps time when partner has no hours` (**new**)
     - `Booking-eligible member sees tickets, credits and date on event detail` (body only: Date chrome, not “date/time”)
     - `Dropdown changes credits` / `Guest checkout omits slot picker` (unchanged; still expect select times)
   - **Rationale:** Step Implementation asks for two eligible-member Date scenarios; bdd-and-e2e forbids parallel titles. Same-day collapse stays out of product Gherkin so it does not require a Playwright title.
   - **Alternatives:** One combined Date scenario (rejects step’s “two scenarios”). Add Same-day to Gherkin without e2e (violates verbatim mapping).

3. **Hours Gherkin + Playwright invert Closed rows; keep mixed sample week**
   - **Choice:** Gherkin `Guest sees partner opening hours`: Then lists open weekday hours **and** closed weekdays are not listed. Playwright keeps `withPartnerOpeningHours(partnerName, E2E_SAMPLE_OPENING_HOURS)` (Wed/Sun `{ closed: true }`, Mon 10:00–18:00). Assert Monday open range visible; Wednesday/Sunday Closed / Geschlossen **count 0**. Keep `Hours omitted when disabled` as-is (no weekday list / no 10:00–18:00). Do not change `E2E_SAMPLE_OPENING_HOURS`.
   - **Rationale:** Step brief; mixed week still proves closed days are omitted rather than never stored.
   - **Alternatives:** All-open fixture (would not prove omission). Assert every open day (brittle Intl punctuation).

4. **Date Playwright scopes clock-time to the Date MetaCell via parent walks**
   - **Choice:** Both new tests: `loginMember` (existing helper: signup + onboarding + `activateMemberForBooking`) then `withPartnerOpeningHours` on tonight’s seeded partner. Target Date chrome with `page.getByText(/^datum$|^date$/i).first().locator("..").locator("..")` (label-row → meta-cell; allowed parent walk). Hours-on: that cell’s `\d{1,2}:\d{2}` count is 0; Monday open range still visible **outside** the cell; Date/Datum label visible. Hours-off: that cell has `\d{1,2}:\d{2}`; no `Montag:` / `Monday:` hours list. Do **not** assert `getByLabel(/datum und uhrzeit|date and time/i)` lost times (tonight is typically one slot so the select is absent; `Dropdown changes credits` remains the select-times proof). No CSS-module hashes, no `data-testid`.
   - **Rationale:** Hours list and checkout select also contain `HH:MM`; a page-level “no clock time” assert would be a false failure. Parent walks stay inside bdd-and-e2e allowed locators.
   - **Alternatives:** `.event-detail--checkout__meta-datetimes` class (bdd-and-e2e forbids CSS class selectors). `data-testid` (forbidden). Create a dedicated multi-slot event for Date-only (unnecessary; collapse is unit-tested).

5. **Put all tonight-partner hours mutations in one serial describe**
   - **Choice:** Add the two Date tests inside the existing `partner opening hours on event detail` serial describe (already `mode: "serial"` with guest hours + omitted). Keep guest tests cookie-cleared; Date tests call `loginMember` inside the callback.
   - **Rationale:** `withPartnerOpeningHours` writes the same seeded partner; parallel sibling describes would race. Serial already used for that reason.
   - **Alternatives:** Separate serial describe (Playwright can still parallelize sibling describes). Unique partner per test (heavier, needs R2 for create).

6. **Invert public-detail Closed asserts in admin-partners Enable scenario (blast radius, not authoring)**
   - **Choice:** In `e2e/specs/admin-partners.spec.ts` `Scenario: Enable weekly opening hours on create or edit`, after `goto(event.detailPath)`, keep Monday 10:00–18:00 visible; change Tuesday Closed / Dienstag Geschlossen from `toBeVisible()` to `toHaveCount(0)`. Do **not** change `fillPartnerOpeningHoursSampleWeek` (admin form still marks other days closed). Do not rewrite admin-partners Gherkin.
   - **Rationale:** That test is asserting the **public detail** contract, not the admin form. Leaving it would keep CI on the old Closed-row display. Step “out of scope: admin partner hours authoring” means do not rework create/edit scenarios.
   - **Alternatives:** Leave it (CI red / wrong contract). Move the public-detail assert into event-discovery only and drop it from admin-partners (weaker admin round-trip proof).

7. **Coverage matrix: hours notes + two Date rows; Same-day stays unit-only**
   - **Choice:**
     - `Guest sees partner opening hours` → notes: open-day line; Wed/Sun Closed count 0; `DATABASE_URL`; restore via `withPartnerOpeningHours`.
     - `Hours omitted when disabled` → unchanged `pass`.
     - `Eligible member Date is date-only when partner has hours` → **new** `pass`, `DATABASE_URL` + member signup; Date cell omits `\d{1,2}:\d{2}`; hours list still visible.
     - `Eligible member Date keeps time when partner has no hours` → **new** `pass`, same env; Date cell includes time; hours list absent.
     - Same-day collapse: **do not** add a Gherkin/matrix Playwright row; note on the date-only row that unique Berlin YMD is covered by `event-detail-when-display.test.ts`.
   - **Rationale:** Step deliverables; verbatim mapping only for scenarios we add to product Gherkin.
   - **Alternatives:** Matrix-defer Date e2e (rejected — step requires Playwright). Add Same-day e2e (out of step’s two-scenario ask; needs a two-slot same-day fixture).

8. **Tighten eligible-member Date Gherkin; leave checkout scenarios timed**
   - **Choice:** `Booking-eligible member sees tickets, credits and date on event detail`: change `DETAILS includes date/time chrome` to Date chrome that may omit clock time when partner hours are visible. Existing Playwright for that title stays label-only (`/^datum$|^date$/i`) — no clock-time assert to remove. `Dropdown changes credits` / `Guest checkout omits slot picker` unchanged. Optionally: `Detail lists multiple datetimes` keeps “both dates visible”; do not require clock times in that body (no Playwright title exists for it today).
   - **Rationale:** Step optional tighten; prevents SoT from implying clock time whenever Date shows.
   - **Alternatives:** Leave “date/time” (SoT lie when hours are on). Make the existing eligible-member test also assert times (would flake when seed partner has hours).

9. **ui-component-map + i18n inventory wording**
   - **Choice:** Event detail paragraph: replace “Mon→Sun open–close (or closed)” with working days only (closed weekdays omitted); Date chrome = Europe/Berlin **date only** when the hours list is shown, date+time when hours are omitted; checkout native datetime `<select>` still full datetime. I18n hours bullet: weekday labels + `HH:MM – HH:MM` for **public detail working days**; Closed / Geschlossen remains documented for the **admin partner form** (`openingHoursClosedLabel`), not for the public list.
   - **Rationale:** Step scope; greppable Closed on public detail would stay a lie if only Gherkin moved.
   - **Alternatives:** Delete Closed from the inventory (admin form still uses it).

10. **OpenSpec mirror vs product SoT**
    - **Choice:** This change’s `event-discovery` delta is the planning contract. Apply updates `docs/product/` as SoT. Do not treat archived OpenSpec specs as behavioral SoT. After apply, mark the parent step done (feature complete).
    - **Rationale:** AGENTS.md / step Cleanup.
    - **Alternatives:** Sync `openspec/specs/` only — agents would still follow stale Gherkin.

## Risks / Trade-offs

- **[Risk] Page-level “no `HH:MM`” asserts fail because hours list / checkout select still show times** → Mitigation: scope clock-time to the Date MetaCell parent walk; leave dropdown tests expecting times.
- **[Risk] Serial describe timeout after adding two member-signup Date tests** → Mitigation: reuse `loginMember`; keep `retries: 1` already on the file; skip only on missing `DATABASE_URL`, never “UI not built.”
- **[Risk] Parallel admin-partners Enable still expects Tuesday Closed on public detail** → Mitigation: invert that one assert in this change (decision 6).
- **[Risk] Seeded tonight partner already has hours from another worker between restore and next test** → Mitigation: keep mutations inside `withPartnerOpeningHours` try/finally; serial describe for tonight’s partner.
- **[Risk] Intl date-only strings contain a colon in some locales** → Mitigation: unit tests already forbid `\d{2}:\d{2}` on `includeTime: false`; e2e uses `\d{1,2}:\d{2}` on the Date cell only.
- **[Trade-off] Same-day collapse has no Playwright title** → Acceptable; step 01 unit file is the check; adding Gherkin would mandate e2e.
- **[Trade-off] Eligible-member tickets/date test does not prove clock-time gating** → Acceptable; the two new titles own that; the old test stays a chrome-presence smoke.

## Migration Plan

1. Land docs + e2e together (no schema/API migration).
2. No rollback beyond reverting the docs/e2e commit; step 01 UI remains correct.
3. After merge: mark step 02 + parent guide done; archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — step 01 helpers and locators are the source of Date/hours behavior; Same-day e2e stays deferred to unit tests.)_
