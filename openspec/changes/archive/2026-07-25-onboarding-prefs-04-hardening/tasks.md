## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/onboarding-prefs-04-hardening.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm steps 01–03 shipped UI/domain (Bezirke, no travel capture, Accessibility needed?, searchable languages, Other + `interests_other`)
- [x] 1.3 Diff stale SoT: `onboarding.feature`, `profile.feature`, `content-i18n-inventory.md`, `schema-overview.md`, `coverage-matrix.md`, `e2e/specs/onboarding.spec.ts`, `e2e/fixtures/onboarding.ts`, `e2e/specs/profile.spec.ts`, `AdminUserDetailPage.tsx`
- [x] 1.4 Grep for leftover `radiusLabel`, `MAX_DISTANCE_`, travel-radius demo copy, informal district keys in `docs/product/` + `DEPLOYMENT.md`

## 2. Product docs

- [x] 2.1 Update `docs/product/features/onboarding.feature` steps 2–4 (Other + free text; 12 Bezirke; no travel radius; searchable languages DE/EN first / no Non-Verbal; Accessibility needed? Yes/Ja); rename Step 3 Scenario title away from travel radius
- [x] 2.2 Update `docs/product/features/profile.feature` Vibes scenario (Other / languages / accessibility; no travel radius)
- [x] 2.3 Refresh `extras/content-i18n-inventory.md` (`radiusLabel` removed or unused; accessibility; language section; interests Other / free-text keys)
- [x] 2.4 Document `interests_other` and note `max_distance` as legacy/unused in `database/schema-overview.md`
- [x] 2.5 Update `testing/coverage-matrix.md` for renamed/updated onboarding + profile scenarios
- [x] 2.6 Add brief decision line in `extras/gaps-and-decisions.md` (Bezirk list + travel removal + language picker) if warranted
- [x] 2.7 Fix `apps/web/DEPLOYMENT.md` onboarding demo step 3 (districts only; no travel radius)

## 3. E2E fixtures and specs

- [x] 3.1 Align `e2e/specs/onboarding.spec.ts` Scenario titles with updated Gherkin; drop “how far” / Required-Erforderlich assertions; assert Bezirke, Other visibility, Accessibility needed? + Yes/Ja, no Non-Verbal / no travel radius
- [x] 3.2 Adjust `e2e/fixtures/onboarding.ts` helpers only if selectors break under new copy/controls
- [x] 3.3 Update `e2e/specs/profile.spec.ts` Vibes scenario: assert no travel-radius control; exercise/assert new preference surfaces with proximity selectors
- [x] 3.4 If Other + free-text full submit path is too brittle for e2e, matrix-defer with owner and keep auth unit tests + Other visibility assertion

## 4. Admin intel and dead code

- [x] 4.1 Update `AdminUserDetailPage.tsx` to omit travel distance / radius when `max_distance` is null; keep `interests_other` when set; confirm districts/languages render stored allowlist values
- [x] 4.2 Remove unused travel-radius copy/constants (`radiusLabel`, `MAX_DISTANCE_*`) if any remain after docs sync

## 5. Validation and release close-out

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run targeted Playwright: onboarding + profile specs — pass (or named env skips only)
- [x] 5.3 Spot-check Gherkin scenarios in `onboarding.feature` / `profile.feature` against implemented UI copy
- [x] 5.4 Mark step 04 done and parent feature releasable in `.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`
