## Why

Steps 01–03 shipped the new onboarding/profile preference UX (12 Bezirke, no travel radius, Accessibility needed?, searchable languages, interests Other + free text), but canonical `docs/product/` Gherkin, i18n inventory, schema narrative, coverage matrix, Playwright, and admin intel display still describe the old options. Without this hardening slice the feature is not releasable against product SoT + e2e.

## What Changes

- Align `docs/product/features/onboarding.feature` steps 2–4 with shipped controls (Other + free text; 12 Bezirke; no travel radius; searchable languages with DE/EN first / no Non-Verbal; Accessibility needed? yes checkbox).
- Align `docs/product/features/profile.feature` Vibes scenario (no travel radius; Other / languages / accessibility as implemented).
- Refresh `content-i18n-inventory.md`, `schema-overview.md` (`interests_other`; `max_distance` legacy/unused), `coverage-matrix.md`, and optionally `gaps-and-decisions.md`.
- Update Playwright onboarding + profile fixtures/specs to proximity-select the new copy/controls; keep Scenario titles in sync with Gherkin.
- Admin member detail: do not present travel distance as an active preference when null; show `interests_other` when set; district/language values from new allowlists.
- Remove dead travel-radius exports (`radiusLabel`, `MAX_DISTANCE_*`) if still unused.
- Mark step 04 and the parent feature done in `.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`.
- **No** feed ranking, batch district migration, new onboarding steps, or partner portal. Prefer `docs/product/` over archived `openspec/specs/` as product SoT.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-onboarding`: Product Gherkin + Playwright SHALL cover the four-step wizard with the updated preference controls (12 Bezirke, no travel radius, Other + free text, searchable languages, Accessibility needed?).
- `member-profile`: Product Gherkin + Playwright Vibes coverage SHALL match the same preference UX and MUST NOT require travel radius.
- `admin-users`: Membership HQ member detail SHALL present preferences using the new allowlists, show `interests_other` when set, and MUST NOT present travel distance as an active preference when `max_distance` is null.

## Impact

- **Product SoT:** `docs/product/features/onboarding.feature`, `profile.feature`; `extras/content-i18n-inventory.md`, `gaps-and-decisions.md` (optional); `database/schema-overview.md`; `testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/onboarding.spec.ts`, `e2e/fixtures/onboarding.ts`, `e2e/specs/profile.spec.ts` (+ profile fixtures if present).
- **Admin UI:** `AdminUserDetailPage.tsx` (+ admin copy keys if needed).
- **Dead code:** unused `radiusLabel` / `MAX_DISTANCE_*` (and similar) in content/constants if remaining.
- **Planning:** parent guide step 04 → done / feature releasable.
- **Source brief:** `.dev-plan/current-iteration/onboarding-prefs-04-hardening.md`
- **Parent:** `.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`
- **Depends on:** `onboarding-prefs-03-interests-other` (merged)
- **Consumed by:** closes Onboarding preference options
- **Verification:** `bun run lint`, `bun run typecheck`; targeted Playwright for onboarding + profile; spot-check Gherkin vs UI copy
