## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/spec-alignment-04-bdd-coverage-and-matrix.md`, parent guide, `docs/product/testing/bdd-and-e2e.md`, and this change’s proposal/design/specs
- [x] 1.2 Diff current `test("Scenario: …")` titles in `e2e/specs/static-pages.spec.ts` and `e2e/specs/event-discovery.spec.ts` against `static-pages.feature` / `event-discovery.feature`
- [x] 1.3 Confirm step 03 deferrals (auth GDPR stubs, post-MVP partner skips, onboarding fixture proximity-adjacent locator) so the matrix can reference them

## 2. Discover CTA wiring (if needed)

- [x] 2.1 Verify whether Discover’s primary browse/auth CTA reaches signup or login (vs `#events` / membership-only); if not, point the CTA at signup or login with `returnTo` toward `/:locale/events` without exposing a public full feed
- [x] 2.2 Keep EventCard “See details” / “Mehr sehen” → public `/events/:id` unchanged

## 3. Static-pages Scenario tests

- [x] 3.1 Add `Scenario: Discover preview links to public event detail` — guest clicks preview CTA; lands on `/events/:id` without login redirect
- [x] 3.2 Add `Scenario: Discover CTA path to the full member events feed` — guest follows primary auth CTA; after signup + onboarding (reuse fixtures) reaches member `/events`; no public full feed
- [x] 3.3 Align any remaining title drift in `static-pages.spec.ts`; proximity selectors only; no `data-testid`

## 4. Event-discovery Scenario tests

- [x] 4.1 Add `Scenario: Guest can view public event detail without authentication` — seeded upcoming id via `getEventIdByTitle`; content visible; gated book/save/waitlist require auth
- [x] 4.2 Add `Scenario: Guest path to full browse requires signup or login` — guest `goto /:locale/events` redirects to auth (returnTo); optional post-auth feed assert if not fully covered by 3.2
- [x] 4.3 Confirm `Scenario: Public discovery preview for guests` title is verbatim; align any other title drift in `event-discovery.spec.ts`

## 5. Coverage matrix and docs

- [x] 5.1 Write `docs/product/testing/coverage-matrix.md` with columns Feature / Scenario / Playwright / Status / Notes for all MVP `docs/product/features/*.feature` Scenarios
- [x] 5.2 Include post-MVP skip notes and Phase 6–8 `unshipped` rows (`booking`, `credits-subscription`, `waitlist`, `profile`, `admin-users`); mark auth GDPR stubs `deferred` → Phase 8
- [x] 5.3 Update `bdd-and-e2e.md` Known coverage gaps to point at the matrix; add a short pointer in `e2e/README.md` if helpful
- [x] 5.4 Spot-check: every Scenario in `static-pages.feature` and `event-discovery.feature` has a matrix row

## 6. Validation

- [x] 6.1 Run `bun run lint` — exit 0
- [x] 6.2 Run `bun run typecheck` — exit 0
- [x] 6.3 Run `bun run test:e2e -- e2e/specs/static-pages.spec.ts e2e/specs/event-discovery.spec.ts` — new scenarios pass or are named-deferred in the matrix
- [x] 6.4 Run `rg -n "Discover preview links to public event detail|Guest can view public event detail" e2e/specs` — titles present (or matrix lists deferral)
- [x] 6.5 Confirm no new `data-testid`, CSS-class, or `#id` selectors were introduced in e2e

## 7. Cleanup

- [x] 7.1 Mark step 04 done in `.dev-plan/current-iteration/spec-alignment-parent-guide.md`; list any named scenario deferrals under Risks
- [x] 7.2 Hand sitemap/deploy to step 05 — do not start Phase 6 or step 05 implementation in this change
