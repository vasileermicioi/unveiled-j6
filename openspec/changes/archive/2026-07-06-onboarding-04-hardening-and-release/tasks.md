## 1. Setup

- [x] 1.1 Read Phase 3 done-when in `.dev-plan/IMPLEMENTATION-PLAN.md` and `.dev-plan/current-iteration/onboarding-04-hardening-and-release.md`
- [x] 1.2 Confirm onboarding steps 01–03 are merged or complete on the branch
- [x] 1.3 Confirm staging Neon project has `DATABASE_URL`, `AUTH_URL`, and `SITE_URL` ready (same as Phase 2)

## 2. Integration and unit tests

- [x] 2.1 Audit `packages/auth/src/onboarding.test.ts` — add full four-step save + `completeOnboarding` round-trip test (gated on `DATABASE_URL`) if missing
- [x] 2.2 Audit `apps/web/app/lib/onboarding-middleware.test.ts` against step 02 scenarios — extend only if gaps found (e.g. EN locale parity)
- [x] 2.3 Add robots.txt test asserting `/*/onboarding/` is in `ROBOTS_DISALLOW_PATHS` (or verify manually and document in PR notes)
- [x] 2.4 Run `cd packages/auth && bun test` and `cd apps/web && bun test` — all pass

## 3. Documentation

- [x] 3.1 Add Phase 3 release gate section to `apps/web/DEPLOYMENT.md`: staging verification steps
- [x] 3.2 Document full demo script: signup → age (or skip) → interests → location → timing → `/membership`
- [x] 3.3 Document returning complete user: `/onboarding/age` → redirect to `/events`
- [x] 3.4 Document repeat-demo reset: SQL to clear `onboarding_complete` / profile fields, or fresh signup
- [x] 3.5 Confirm no new env vars beyond Phase 2 (`DATABASE_URL`, `AUTH_URL`, `SITE_URL`)

## 4. Deploy and validation

- [x] 4.1 Run `bun run lint`, `bun run typecheck`, and `bun run build` from repo root
- [x] 4.2 Fix any lint/type/release-blocker issues from steps 01–03 discovered during validation
- [ ] 4.3 Deploy to staging via existing Railway pipeline
- [ ] 4.4 Staging manual demo — full flow: new USER signup → 4 steps → `/membership`; verify `users.profile` populated in Neon console
- [ ] 4.5 Staging manual demo — skip-age flow: skip step 1 → complete remaining steps → `/membership`
- [ ] 4.6 Staging manual demo — complete USER hits `/onboarding/age` → redirect to `/events`
- [ ] 4.7 Staging console check: no errors on `/de/onboarding/age` and `/en/onboarding/timing`
- [ ] 4.8 Optional: verify PARTNER account (if exists) is not redirected into onboarding wizard
- [ ] 4.9 Update staging URL in `DEPLOYMENT.md` if changed

## 5. Cleanup

- [x] 5.1 Mark onboarding-04 steps done in `.dev-plan/current-iteration/onboarding-parent-guide.md` (if present)
- [ ] 5.2 Archive this OpenSpec change after implementation merges; merge spec deltas into `openspec/specs/member-onboarding/spec.md` and `openspec/specs/platform-foundation/spec.md`
