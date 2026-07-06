## Context

Onboarding steps 01–03 are merged or complete on branch:

- **01:** `@unveiled/auth` exports `getOnboardingStepPath`, `saveOnboardingStep`, `completeOnboarding`, allowlists, and unit/integration tests in `packages/auth/src/onboarding.test.ts` (integration gated on `DATABASE_URL`).
- **02:** `apps/web/app/lib/onboarding-middleware.ts` redirects incomplete USERs from member app prefixes; `onboarding-middleware.test.ts` covers member blocks, resume step, membership/marketing exceptions, complete-user skip, PARTNER/ADMIN behavior.
- **03:** Four SSR wizard routes under `/:locale/onboarding/*`, HeroUI forms, `noindex` meta, POST persistence via auth helpers.

Phase 3 done-when (`.dev-plan/IMPLEMENTATION-PLAN.md`): new user guided through 4 steps; returning user with `onboarding_complete: true` skips wizard. Client demo: *"After signup, we capture vibes, districts, and timing — same as the product vision."*

Source of truth: `.dev-plan/current-iteration/onboarding-04-hardening-and-release.md`, `docs/migration/extras/seo-and-metadata.md`, `apps/web/DEPLOYMENT.md`.

**Current gaps:** `DEPLOYMENT.md` lacks Phase 3 demo script; no explicit full four-step DB round-trip test; `robots.txt.ts` already disallows `/*/onboarding/` but lacks an automated assertion; staging deploy and manual QA not yet recorded for Phase 3 release gate.

## Goals / Non-Goals

**Goals:**

- Close Phase 3 release gate with automated coverage for the save → complete path and any middleware gaps.
- Document staging verification (full wizard, skip-age, returning user skip, repeat-demo reset) in `DEPLOYMENT.md`.
- Confirm SEO robots disallow for onboarding paths.
- Deploy to staging; verify `/de` and `/en` onboarding flows with clean browser console.
- Pass `bun run lint`, `bun run typecheck`, and package test suites.

**Non-Goals:**

- Phase 4+ features (events feed UI, admin CRUD, Stripe checkout on `/membership`).
- E2E browser automation (Playwright/Cypress) unless already in repo.
- Sentry, cron, GDPR (Phase 9).
- Preference-based discovery or feed ranking (Phase 5).
- New environment variables beyond Phase 2 (`DATABASE_URL`, `AUTH_URL`, `SITE_URL`).

## Decisions

### 1. Integration test placement

Extend `packages/auth/src/onboarding.test.ts` rather than adding a separate `onboarding.integration.test.ts` unless the file becomes unwieldy.

Add one **full round-trip** integration test (when `DATABASE_URL` set):

1. Insert test user with `onboarding_complete: false`.
2. `saveOnboardingStep` for `age` (with valid `age_group`), `interests`, `location`, `timing`.
3. `completeOnboarding`.
4. Assert `profile.onboarding_complete === true`, captured arrays/flags present, `behavior.onboarding_completed_at` set, `behavior.onboarding_step` cleared.
5. Delete test user in `finally`.

Existing tests already cover skip-age, partial merge, and timing-only completion — the round-trip fills the gap between isolated step tests and staging manual QA.

**Alternative considered:** Separate `onboarding.integration.test.ts`. Deferred unless `onboarding.test.ts` exceeds maintainability; iteration allows either.

### 2. Middleware test coverage

Review `onboarding-middleware.test.ts` against step 02 spec scenarios. Current file appears complete for member prefix blocks, resume step, membership/marketing exceptions, complete-user redirect, PARTNER/ADMIN. Add tests only if audit finds missing cases (e.g. `/en` locale parity for a scenario covered only in `/de`).

No new middleware module — verification-only unless a gap is found.

### 3. Route-level smoke tests

The web app has no HonoX route integration test harness (`auth-middleware.test.ts`, `post-auth-redirect.test.ts` test pure functions only). **Do not introduce a new test framework** for this step.

Optional: add pure-function tests for any route helper extracted during steps 01–03 (e.g. POST redirect resolution). Skip full HTTP smoke unless an existing pattern emerges.

### 4. Robots.txt verification

`apps/web/app/routes/robots.txt.ts` already includes `/*/onboarding/` in `ROBOTS_DISALLOW_PATHS`.

Add a small unit test (e.g. `apps/web/app/routes/robots.txt.test.ts` or inline in an existing web test file) that imports `buildRobotsTxt` logic or asserts `ROBOTS_DISALLOW_PATHS` contains `/*/onboarding/`. Manual confirmation sufficient if extracting the builder is awkward — prefer a one-line constant assertion test.

Per-page `robots: "noindex"` on onboarding routes was verified in step 03; this step confirms **robots.txt** disallow only.

### 5. DEPLOYMENT.md Phase 3 section

Add a **Phase 3 release gate** subsection to `apps/web/DEPLOYMENT.md`:

| Topic | Content |
|---|---|
| Prerequisites | Phase 2 env vars only; migrations applied |
| Demo script | New USER: signup → age (or skip) → interests → location → timing → `/membership`; verify `users.profile` in Neon console |
| Skip flow | Complete user hitting `/onboarding/age` → redirect `/events` |
| Repeat demo | SQL to reset `profile.onboarding_complete` and clear onboarding fields, or fresh signup |
| Console check | Load `/de/onboarding/age` and `/en/onboarding/timing` — no console errors |
| PARTNER | If staging account exists: no onboarding redirect |

Include Europe/Berlin note for any date references in demo scripts. Update staging URL if changed.

### 6. Staging deploy and manual QA

Use existing Railway pipeline. Run Phase 3 client demo **twice**:

1. Full flow with age selected.
2. Skip-age flow + returning complete user skip.

Fix release-blockers found during QA before marking Phase 3 complete. Do not scope-creep into Phase 4.

### 7. Lint and typecheck

Run root `bun run lint && bun run typecheck` and `bun test` in `packages/auth` and `apps/web`. Fix any issues introduced in steps 01–03 — this step does not add features, only hardening.

## Risks / Trade-offs

- **[Integration tests skipped in CI without DATABASE_URL]** → Acceptable per project convention; unit tests always run; document that CI with Neon branch URL gets integration coverage.
- **[Manual staging QA is the real release gate]** → Mitigated by detailed `DEPLOYMENT.md` checklist and automated round-trip test for persistence layer.
- **[No E2E for form POST chains]** → Manual demo on staging; pure-function tests cover middleware/redirect logic.
- **[Repeat demo requires SQL or new signup]** → Document both options in `DEPLOYMENT.md` to avoid demo friction.

## Migration Plan

1. Merge or confirm steps 01–03 on branch.
2. Add/extend tests; update `DEPLOYMENT.md`.
3. Run lint, typecheck, tests locally.
4. Deploy to staging (same env as Phase 2).
5. Execute manual demo checklist; fix blockers.
6. Merge to `main` after staging success per implementation plan.
7. Archive OpenSpec change; merge spec deltas into `openspec/specs/member-onboarding/spec.md` and `openspec/specs/platform-foundation/spec.md`.

**Rollback:** Revert deploy; onboarding routes remain behind auth — no schema migration in this step.

## Open Questions

- Staging URL unchanged from Phase 2? Confirm during deploy and update `DEPLOYMENT.md` if needed.
- Shared staging PARTNER account for onboarding non-redirect check — optional; skip if not provisioned.
