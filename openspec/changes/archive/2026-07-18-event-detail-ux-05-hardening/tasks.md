## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-detail-ux-05-hardening.md`, parent release criteria in `event-detail-ux-parent-guide.md`, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm 01–04 behaviors are present on the branch (`maxBookableTickets`, aligned checkout, dense DETAILS, `.event-map__marker` pin)
- [x] 1.3 Diff/grep `docs/product/` (especially `booking.feature` “1 and 3”, Event detail in `ui-component-map.md`, `event-discovery.feature`) against shipped UI; list stale hits
- [x] 1.4 Skim parent release criteria and `.dev-plan/manual-test-feedback-{1,2,3,4}.png`; note story gaps (Guest maxQty, DETAILS grid, MarkerPinChrome)

## 2. Product docs & Gherkin

- [x] 2.1 Update `docs/product/features/booking.feature`: replace hard “1 and 3” Background with guest preview max 3 + member credits ∩ capacity; keep capacity/credit rejection scenarios
- [x] 2.2 Update `docs/product/features/event-discovery.feature` public detail scenarios/titles as needed for dense DETAILS, pin marker, and dynamic qty (detail still creates no bookings/ledger)
- [x] 2.3 Expand `docs/product/ui/ui-component-map.md` Event detail notes: aligned columns, responsive hero, dense DETAILS, pin marker, guest max 3 / signed-in dynamic qty
- [x] 2.4 Append `docs/product/extras/gaps-and-decisions.md` only if that file’s convention warrants a ticket-cap / detail-UX decision row; otherwise skip

## 3. Ladle stories

- [x] 3.1 Refresh `EventDetailPage.stories.tsx`: make guest max 3 explicit if needed; keep Eligible `maxQty={8}`; add or clarify DETAILS/metadata-density visibility in a wide story if not already reviewable
- [x] 3.2 Confirm `EventMap.stories.tsx` `Marker pin chrome` (or equivalent) covers pin chrome; add only if missing
- [x] 3.3 Do not add new product UI beyond documenting 01–04

## 4. Playwright / BDD

- [x] 4.1 Add/adjust `e2e/specs/event-discovery.spec.ts` (and/or `booking.spec.ts`): assert DETAILS/metadata presence on public detail via proximity selectors
- [x] 4.2 Guest qty: assert increment disabled at 3 on detail checkout card
- [x] 4.3 Eligible member: with seeded ACTIVE credits + capacity, assert selectable qty > 3 on detail or book
- [x] 4.4 Map pin: assert `.event-map__marker` (or aria) after consent helper; `test.skip` / document if consent gate blocks CI — no tile OCR
- [x] 4.5 Keep Scenario titles aligned with Gherkin verbatim where the BDD contract requires it; prefer MODIFY over duplicate scenarios

## 5. Validation & cleanup

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 5.2 Run targeted Playwright for discovery/booking/detail specs related to this feature; document env blockers if any
- [x] 5.3 Grep sanity: no remaining product SoT claiming a universal hard max of 3 for successful member bookings
- [x] 5.4 Walk parent **Release Criteria**; mark steps 01–05 **done** in `.dev-plan/current-iteration/event-detail-ux-parent-guide.md`; note deferred flakes with owner
- [x] 5.5 Prepare PR/handoff linking this change id and parent guide; optional one-line `DEPLOYMENT.md` demo note only if needed
