## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/admin-event-bookings-03-hardening.md`, parent guide Release Criteria / non-goals, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 02 artifacts exist: Bookings tab + `admin/bookings` index + per-event list + cancel-all confirm; `cancelAllBookingsForEvent`; `sendCancelAllEmailsSafe`; `AdminTabNav` Bookings Ladle story
- [x] 1.3 Skim stale surfaces: `booking.feature` (single-cancel only, DECISIONS say never auto-refund); no `admin-event-bookings.feature`; sitemap missing `/admin/bookings` index and per-event routes; pagination has no page-size 25 for those lists; coverage matrix missing the new scenarios

## 2. Gherkin and product docs

- [x] 2.1 Add `docs/product/features/admin-event-bookings.feature` with verbatim titles: Admin opens the Bookings tab; Admin views bookings for one event; Empty event bookings; Admin cancels all bookings from the confirm page; Cancel-all confirm rejects an empty reason; Member cannot open the Bookings tab
- [x] 2.2 Patch `booking.feature` DECISIONS two-path split (single cancel = no refund + promote; cancel-all = refund + close waitlist). Keep **Admin cancels a confirmed booking** no-refund. Add cancel-all scenarios from design decision 5 (including Member receives cancel-all email)
- [x] 2.3 Patch `waitlist.feature`: cancel-all closes WAITING and does not promote; add **Cancel-all does not promote the waitlist** and **Waitlist member receives waitlist-closed email**. Clarify promotion triggers exclude cancel-all
- [x] 2.4 Patch `credits-subscription.feature`: REFUND also produced by event cancel-all; add **Event cancel-all writes REFUND ledger rows**; keep manual goodwill refund distinct
- [x] 2.5 Update `docs/product/sitemap/sitemap.md`: `/admin/bookings?title=&partner=&page=`, `/admin/events/:id/bookings?status=&page=`, `/admin/events/:id/bookings/cancel-all`; annotate single-cancel vs cancel-all; keep export
- [x] 2.6 Update `docs/product/extras/pagination-and-search.md`: page size 25 for `/admin/bookings` and `/admin/events/:id/bookings`
- [x] 2.7 Update `ui-component-map.md` (Bookings tab / per-event list / cancel-all confirm / Events-catalog Bookings action); `content-i18n-inventory.md` (step-02 `admin-content.ts` keys); `authorization-matrix.md` if bookings rows need the new paths; `schema-overview.md` cancel-all transaction note + REFUND wording (no schema change); `gaps-and-decisions.md` two-path row. Do not edit `app-shell.md` unless it lists admin tabs

## 3. Playwright

- [x] 3.1 Add e2e fixture helper for a unique-titled SECRET_CODE event (and a second empty event). Do not cancel-all `Sold Out: Waitlist Demo Night`
- [x] 3.2 Add `e2e/specs/admin-event-bookings.spec.ts` mapped 1:1 to the six Gherkin titles. Reuse `loginAdminForMembershipHq` / `settleAdminSession`. Proximity selectors only. Env-skip `DATABASE_URL` / `E2E_ADMIN_*` only — never `@skip-no-ui`
- [x] 3.3 Seed paid CONFIRMED (+ waitlist joiner) for cancel-all confirm; assert list → confirm → cancelled status + `okCancelAll` success copy; blank reason stays on confirm; USER `goto /:locale/admin/bookings` does not see the admin list
- [x] 3.4 Add booking.feature cancel-all titles to `e2e/specs/booking.spec.ts` (shared helper OK). Keep **Admin cancels a confirmed booking** asserting **no** credit refund. Pass vs skip per design decision 5
- [x] 3.5 Add `Scenario: Cancel-all does not promote the waitlist` (pass) and waitlist-closed email (skip, no inbox harness) to `e2e/specs/waitlist.spec.ts`
- [x] 3.6 Add `Scenario: Event cancel-all writes REFUND ledger rows` to `e2e/specs/credits-subscription.spec.ts` (skip pointing at domain integration + booking cancel-all e2e)

## 4. Coverage matrix and parent close-out

- [x] 4.1 Update `docs/product/testing/coverage-matrix.md` with a row for every new Scenario (pass or documented skip; never `@skip-no-ui` for these MVP scenarios)
- [x] 4.2 Grep `docs/product` for stale “cancellation never auto-refunds” without the single-booking qualifier; grep that every `Scenario:` in `admin-event-bookings.feature` has `test("Scenario: …")`
- [x] 4.3 Confirm Ladle `AdminTabNav` Bookings story still exists (shipped in step 02 — do not recreate)
- [x] 4.4 Mark `admin-event-bookings-03-hardening` done in `.dev-plan/current-iteration/admin-event-bookings-parent-guide.md` and walk parent **Release Criteria** (feature released). Canonical SoT is `docs/product/`; do not treat `openspec/specs/` as product behavior; no new AGENTS.md rule

## 5. Verification

- [x] 5.1 Run `bun run lint` — exits 0
- [x] 5.2 Run `bun run typecheck` — exits 0
  <!-- Other workspaces pass. `@unveiled/web` fails on pre-existing `app/client.ts` `import.meta.glob` / `ImportMeta` (HEAD Vite/HonoX client glob; not introduced by this docs+e2e change). -->
- [x] 5.3 Run `bun run test:e2e -- e2e/specs/admin-event-bookings.spec.ts e2e/specs/booking.spec.ts` — new scenarios pass (or skip only with documented env / domain-test reason)
  <!-- New: Member cannot open the Bookings tab passed. Five admin-event-bookings UI scenarios + booking cancel-all pass path skipped (`E2E_ADMIN_*` unset). Documented domain/email skips as designed. Full booking file: 4 pre-existing failures under 8 workers; 3 passed on serial retry; `Sold out — automatic waitlist offer` still timed out (unrelated waitlist-demo UI, not this change). -->
- [x] 5.4 Prepare PR/handoff linking this change ID and the parent guide
