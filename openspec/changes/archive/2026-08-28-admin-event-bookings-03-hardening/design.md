## Context

See `proposal.md` for motivation. Parent feature: admin event bookings (`.dev-plan/current-iteration/admin-event-bookings-parent-guide.md`), step 03 of 03 — e2e, canonical specs, release hardening. Canonical product behavior is `docs/product/`; OpenSpec `openspec/specs/` is a planning mirror only.

Runtime already matches parent release criteria (steps 01–02 done / archived):

- `@unveiled/db`: `listEventBookings`, `listEventsWithBookingStats`, `cancelAllBookingsForEvent` (refund `total_credits`, restock, capacity += cancelled tickets, WAITING → CANCELLED, no `processWaitlistForEvent`).
- Admin chrome: **Buchungen** / **Bookings** after Events; `inferAdminTab` maps `/admin/bookings` and `/admin/events/:id/bookings*` to `bookings`.
- Routes: `/:locale/admin/bookings`, `/:locale/admin/events/:id/bookings`, `/:locale/admin/events/:id/bookings/cancel-all`. Single cancel `/:locale/admin/bookings/:id/cancel` remains no-refund + promote.
- `@unveiled/email`: post-commit cancellation + waitlist-closed senders; POST logs and continues.
- Ladle: `AdminTabNav` Bookings story (step 02). Do not recreate.

What remains is the **verification and documentation layer**. Product SoT still says cancellation never auto-refunds and has no Bookings tab. Sitemap lists `/admin/bookings/:id/cancel` and `/admin/bookings/export` but not the index or per-event list.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim (`docs/product/testing/bdd-and-e2e.md`); proximity/layout selectors only (`getByRole` / `getByLabel` / `getByText` / filter / nth); no `data-testid`; Europe/Berlin for displayed datetimes; never `@skip-no-ui` for these MVP scenarios; no new visual tokens; no new domain behavior.

## Goals / Non-Goals

**Goals:**

- Land Gherkin, sitemap, pagination, UI map, i18n inventory, auth matrix, schema-overview cancel-all note, gaps-and-decisions, coverage matrix, and Playwright titles for the shipped Bookings tab and two-path cancel.
- Prove the two cancel paths cannot regress into each other: single-cancel e2e still asserts **no** refund; cancel-all e2e asserts credits **are** returned (and waitlist is not promoted).
- Close the parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- Changing `cancelAllBookingsForEvent`, single-cancel, emails, or Bookings-tab UI.
- Inbox / Mailosaur harness; event unpublish / cancelled-event status; partner portal; CSV export changes; new env vars or schema.
- Recreating the Ladle Bookings story.
- A second Gherkin scenario whose only assertion is “operator read DEPLOYMENT.md”.

## Decisions

1. **Docs and Gherkin first, then Playwright, then matrix, then close-out**
   - **Choice:** Write `admin-event-bookings.feature` + patch booking/waitlist/credits-subscription + extras → add Playwright titles → coverage-matrix rows → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim; avoid matrix title drift. Same order as featured-events-manager-03 / subscription-invoice-email-03.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **File mapping stays one spec file per feature basename**
   - **Choice:**
     - `admin-event-bookings.feature` → `e2e/specs/admin-event-bookings.spec.ts` (all UI scenarios including member deny).
     - Cancel-all **domain** scenarios live in `booking.feature` → `e2e/specs/booking.spec.ts`.
     - Waitlist close → `waitlist.spec.ts`. Credits REFUND → `credits-subscription.spec.ts`.
     - Shared helpers (admin login, seed event with bookings/waitlist) MAY live in `e2e/fixtures/` and be imported; titles stay on the mapped spec file.
   - **Rationale:** BDD hard rule 1. Step brief allows a shared helper as long as titles stay verbatim.
   - **Alternatives:** Put all cancel-all tests only in `admin-event-bookings.spec.ts` (breaks file mapping for booking.feature scenarios). Duplicate full UI flows in three spec files (slow, flake-prone).

3. **`admin-event-bookings.feature` scenario set (six titles, all passing UI)**
   - **Choice:** Copy step-02 UI titles verbatim, plus the step-03 member deny:

     | Scenario | Proof |
     |---|---|
     | Admin opens the Bookings tab | ADMIN login → `/admin/bookings` (or tab **Buchungen** / **Bookings**) → table of events with counts → open one event |
     | Admin views bookings for one event | Per-event list shows member / status / occurrence / tickets / credits; CONFIRMED row has Stornieren/Cancel; toolbar **Cancel all confirmed bookings** |
     | Empty event bookings | Events catalog **Bookings** action (or direct URL) on a fixture event with zero bookings → empty copy; no working cancel-all submit |
     | Admin cancels all bookings from the confirm page | Reason filled → confirm → list `?ok=cancel-all` → cancelled status + success copy |
     | Cancel-all confirm rejects an empty reason | Submit blank textarea → stay on confirm, error, bookings unchanged |
     | Member cannot open the Bookings tab | Signed-in USER `goto /:locale/admin/bookings` → redirected to `/:locale` (existing `guardAdminRoute`); do not see “Bookings by event” / “Buchungen nach Event” |

   - **Rationale:** Step 02 already locked titles. Member deny is the step-03 ADDED scenario. Guest-unauthenticated deny is already covered by `/admin/*` matrix and need not be a seventh Gherkin title.
   - **Alternatives:** Guest-only deny (misses USER redirect-to-home). Assert 403 (runtime is 302 to locale home).

4. **Seed strategy for cancel-all UI: dedicated fixture event, not the shared waitlist demo**
   - **Choice:** Add an e2e DB helper (same pattern as `e2e/fixtures/waitlist.ts` `getSoldOutWaitlistEventId`) that inserts a uniquely titled SECRET_CODE event with enough capacity. Then:
     1. Onboard + activate member A; book that event (paid CONFIRMED).
     2. Optionally onboard member B; admin comp-ticket that event (CONFIRMED, `total_credits = 0`) via existing Membership HQ / `createCompTicket` path **if** it stays practical; otherwise skip the comp row in the UI test and cover comps in booking.spec skip → domain integration.
     3. Force remaining capacity to 0; onboard member C; join waitlist.
     4. Admin opens Bookings tab → that event → cancel-all.
   - Do **not** cancel-all the shared `Sold Out: Waitlist Demo Night` seed — other waitlist tests depend on it.
   - Empty-event fixture: a second unique-titled event with **no** bookings; reach it via Events catalog **Buchungen** / **Bookings** row action (index only lists events that already have bookings/waitlist).
   - **Rationale:** Unique titles avoid colliding with demo catalog. Direct URL for empty event is allowed if the Events list is noisy; prefer the catalog action when the row is easy to find (search by title).
   - **Alternatives:** Reuse a demo bookable event (destroys seed data for later tests in the same worker). Create events through the full admin wizard (R2 image required, slow).

5. **booking.feature DECISIONS + cancel-all titles; keep single-cancel no-refund**
   - **Choice:** Extend the existing DECISIONS bullet that says cancellation never auto-refunds: **single** `/admin/bookings/:id/cancel` stays no-refund + waitlist promotion; **event cancel-all** refunds `total_credits` and closes the waitlist. Add these `Scenario:` titles after the existing admin-cancel block:

     - `Admin cancels all confirmed bookings for an event` — **pass** UI+credits: two (or one) paid bookings, cancel-all, `getUserCredits` increased, list shows cancelled. May share the fixture helper with admin-event-bookings.spec; still a distinct titled test in `booking.spec.ts`.
     - `Cancel-all refunds paid tickets but not comps` — **pass** if comp seed is practical (Membership HQ comp-ticket, then cancel-all, paid credits up / comp credits unchanged). If the double-seed is too heavy, **skip** with “covered by `cancel-all-bookings-for-event.integration.test.ts`” (that file already covers paid vs comp).
     - `Cancel-all leaves USED bookings in place` — **skip**: partner check-in is post-MVP; no honest UI path to mark USED. Point at the existing domain integration test.
     - `Cancel-all is idempotent when nothing is confirmed` — **skip**: domain integration already asserts no-op; UI already has `cancelAllEmpty` on the empty-confirm page (covered by Empty event bookings / empty confirm).
     - `Cancel-all requires a reason` — **skip** with “UI covered by `admin-event-bookings.feature` Scenario: Cancel-all confirm rejects an empty reason; domain `INVALID_REASON` unit test”. Do not duplicate the blank-textarea flow in booking.spec.
     - `Member receives cancel-all email` — **skip** `test.skip(true, "No email capture harness…")` matching booking confirmation.

     Keep `Scenario: Admin cancels a confirmed booking` unchanged and still asserting `getUserCredits` is unchanged.

   - **Rationale:** File-mapping requires a titled test per new Gherkin scenario. Skip is allowed with documented env/domain reason, never `@skip-no-ui`. Passing the happy-path refund e2e is what prevents the two paths from swapping.
   - **Alternatives:** Only UI tests in admin-event-bookings.spec (booking.feature would then have unmapped titles). Force USED via a raw SQL status update in e2e (too much fixture magic; domain test already exists).

6. **waitlist.feature + credits-subscription.feature**
   - **Choice:**
     - Waitlist DECISIONS: promotion triggers remain single-cancel and capacity increase; add that **event cancel-all closes WAITING and does not promote**. New scenarios: `Cancel-all does not promote the waitlist` (**pass**: waitlist joiner after sold-out; admin cancel-all; joiner has no CONFIRMED booking / waitlist status CANCELLED, not PROMOTED — assert via My Tickets / waitlist status UI or admin waitlist list) and `Waitlist member receives waitlist-closed email` (**skip**, no inbox).
     - Credits: DECISIONS / REFUND scenario note that cancel-all writes `REFUND` with `event-cancel-all:{bookingId}`. New scenario `Event cancel-all writes REFUND ledger rows` — **skip** pointing at domain integration + booking cancel-all e2e (credits assertion). Do not add a second full cancel-all UI flow in credits-subscription.spec.
   - **Rationale:** Observable waitlist non-promotion belongs in waitlist e2e. Ledger rows are not visible in member UI; skip + domain test is honest (same pattern as Idempotent retry).
   - **Alternatives:** Assert ledger via Playwright `createDb` in credits-subscription.spec (possible but duplicates booking e2e). Fold waitlist close into the admin-event-bookings confirm test only (breaks waitlist file mapping).

7. **Selectors, copy, timezone**
   - **Choice:** `getByRole('link'|'button'|'heading'|'table'|'textbox', { name: /buchungen|bookings|…/i })` bilingual like existing admin specs. Empty copy and success flash use verbatim step-02 strings (`bookingsEmpty`, `okCancelAll`). Occurrence datetimes: assert visible Berlin-formatted date/time already rendered by the page (do not parse UTC in the test). Native textarea: `getByRole('textbox', { name: /grund|reason/i })` (same as single-cancel). Status filter: native `<select>` via `getByLabel(/status/i)` if asserted.
   - **Rationale:** BDD hard rule 3; copy table is locked.
   - **Alternatives:** `data-testid` (forbidden). Class selectors on `.admin-tabs` (forbidden).

8. **Sitemap, pagination, UI map, i18n, auth matrix, schema, gaps**
   - **Choice:**
     - Sitemap admin table: insert `/admin/bookings?title=&partner=&page=` (Bookings by event; tab **Bookings** / **Buchungen**) **before** `/admin/bookings/:id/cancel`. Add `/admin/events/:id/bookings?status=&page=` and `/admin/events/:id/bookings/cancel-all`. Annotate `/:id/cancel` as single-booking, no refund, waitlist may promote; cancel-all as refund + waitlist close. Keep `/admin/bookings/export` unchanged.
     - Pagination suggested sizes: `/admin/bookings` and `/admin/events/:id/bookings` → 25 (same as other admin tables). Export row stays N/A.
     - `ui-component-map.md` Admin: split the “Waitlist / bookings” stub into **Bookings** (tab, stats table, per-event table, cancel-all confirm, Events-catalog Bookings action, single-cancel still under `/admin/bookings/:id/cancel`) and keep Waitlist as its own row.
     - `content-i18n-inventory.md`: bullet for admin Bookings chrome in `admin-content.ts` with the step-02 copy keys (tab, titles, cancel-all lead/warnings, empty, success). Point at `apps/web/app/lib/admin-content.ts`.
     - Authorization: `/admin/*` already denies USER. Add an explicit `bookings` action row or footnote: USER cannot open `/admin/bookings`, `/admin/events/:id/bookings`, cancel-all (redirect locale home); ADMIN can. Update “Update / Cancel” so it does not imply a single no-refund path only.
     - `schema-overview.md`: no new columns. Add a **Event cancel-all** bullet under transactional flows (refund `REFUND` / restock / capacity += cancelled tickets / WAITING → CANCELLED / no promote / event stays live). Keep single-cancel as the existing booking-cancellation bullet (no auto-refund + promote). Update the `credit_ledger.type` `REFUND` sentence so it is not “manual goodwill only”.
     - `gaps-and-decisions.md`: new row — two-path cancel (single vs cancel-all). Soften older rows that say cancellation **never** auto-refunds so they mean **single-booking** cancel.
     - `app-shell.md`: **no change** unless a later edit lists admin tabs (it currently does not).
   - **Rationale:** Step scope list. Avoid editing app-shell for member “Bookings / My Tickets” which is a different surface.
   - **Alternatives:** Document only sitemap (agents would still follow stale pagination/UI map). Rewrite every historical “never auto-refund” sentence without the two-path qualifier (loses the single-cancel policy).

9. **Coverage matrix and env skips**
   - **Choice:** New rows under `admin-event-bookings.feature` (six `pass`, notes: `E2E_ADMIN_*` + `DATABASE_URL`). Booking cancel-all rows: pass or skip per decision 5, never `@skip-no-ui`. Email rows `skip` with “no inbox harness; staging Resend”. Credits REFUND row `skip` with domain-test pointer. Waitlist non-promote `pass`.
   - **Rationale:** Matrix vocabulary already distinguishes env skip (`pass` with notes) vs hard skip.
   - **Alternatives:** Mark UI scenarios `unshipped` (wrong — UI shipped in 02).

10. **OpenSpec mirror vs product SoT**
    - **Choice:** This change’s deltas are the planning contract. Apply updates `docs/product/` as SoT. Do not treat `openspec/specs/` as behavioral SoT. After apply, mark the parent step done. Archive merges the deltas.
    - **Rationale:** AGENTS.md / step Cleanup.
    - **Alternatives:** Sync OpenSpec only — agents would still follow stale Gherkin.

## Risks / Trade-offs

- **[Risk] Cancel-all e2e mutates a shared demo event and flakes waitlist tests** → Mitigation: unique-titled fixture events; never cancel-all `Sold Out: Waitlist Demo Night`.
- **[Risk] Comp + paid + waitlist seed is too slow or depends on R2** → Mitigation: SECRET_CODE event via DB insert (no voucher upload); comp path optional with documented skip to existing integration test.
- **[Risk] Single-cancel and cancel-all titles look similar and reviewers “fix” the no-refund assertion** → Mitigation: booking.feature DECISIONS block states the split; keep the existing credits-unchanged expect; cancel-all test asserts credits **increased**.
- **[Risk] Stale “cancellation never auto-refunds” survives in an unlisted file** → Mitigation: grep `docs/product` after edits; qualify remaining hits as single-booking.
- **[Risk] `@skip-no-ui` folklore** → Mitigation: env skips and domain-test skips only; never “UI not built”.
- **[Trade-off] Playwright never asserts cancel-all email** → Acceptable; same as booking confirmation; unit tests + staging Resend remain the proof.
- **[Trade-off] USED and idempotent cancel-all are skip in e2e** → Domain integration already covers them; inventing a USED UI would be partner check-in (post-MVP).

## Migration Plan

1. Land docs + Playwright + matrix together. No schema/API migration, no new secrets.
2. After deploy: no operator Dashboard change. Optional staging smoke: ADMIN Bookings tab → cancel-all with a reason on a throwaway event.
3. Rollback: revert the docs/e2e commit; runtime from steps 01–02 remains.
4. After merge: mark step 03 + parent guide done (feature released); archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — runtime is shipped; USED e2e is explicitly skipped per decision 5.)_
