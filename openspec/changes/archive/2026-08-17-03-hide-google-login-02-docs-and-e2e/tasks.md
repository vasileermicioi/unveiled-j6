## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/03-hide-google-login-02-docs-and-e2e.md`, parent guide Release Criteria / non-goals, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 01 is merged/archived: `socialProviders: []`, Google-free login copy, `auth.feature` has `Scenario: Auth screens do not offer Google` and no Google OAuth signup scenarios
- [x] 1.3 Skim stale surfaces: skipped Google tests in `e2e/specs/auth.spec.ts`; coverage-matrix / `bdd-and-e2e.md` / `e2e/README.md` Google deferrals; sitemap `/login` + `/auth/callback/google`; integrations Google section; DEPLOYMENT demo/OAuth/checklists; AGENTS.md; `packages/auth/README.md`; `docs/COMPONENTS.md` AppAuthProvider

## 2. Playwright

- [x] 2.1 Delete skipped tests `Scenario: Sign up or log in with Google` and `Scenario: Social login never creates a PARTNER or ADMIN account` from `e2e/specs/auth.spec.ts`
- [x] 2.2 Add a passing test titled exactly `Scenario: Auth screens do not offer Google`: visit `/${locale}/login` and `/${locale}/signup`; assert email and password fields; assert no button/link named `/google/i`; assert page description does not mention Google; use default `locale` fixture (`de`) with EN names in the same role regex; proximity/role selectors only — no `test.skip`

## 3. Coverage inventory

- [x] 3.1 Update `docs/product/testing/coverage-matrix.md`: remove/mark-removed the two Google OAuth rows and the Phase 8 close-out Google `deferred` row; add `Auth screens do not offer Google` → `e2e/specs/auth.spec.ts` → `pass`
- [x] 3.2 Update `docs/product/testing/bdd-and-e2e.md` residual note so Google OAuth is not listed as `deferred`
- [x] 3.3 Update `e2e/README.md` skip inventory and CI notes: drop Google skip rows; do not say Google scenarios may `test.skip` when Neon credentials are missing

## 4. Product and operator docs

- [x] 4.1 Update `docs/product/sitemap/sitemap.md`: `/login` is email/password only; remove `/auth/callback/google` as an app route
- [x] 4.2 Update `docs/product/extras/integrations-and-config.md` env table row and Google OAuth section: not a current product auth method (optional future; no app env vars)
- [x] 4.3 Update `docs/product/extras/gaps-and-decisions.md`: supersede the earlier “add Google OAuth” decision (UI does not offer it because it is not implemented); keep historical mention
- [x] 4.4 Update `apps/web/DEPLOYMENT.md`: demo/signup steps, Google OAuth operator section, staging checklist, Phase 4½ known skips, named deferrals, and production cutover must not require Continue with Google

## 5. Agent docs and parent close-out

- [x] 5.1 Update `AGENTS.md` Auth setup: drop “Google OAuth: configured in Neon Auth…” as current setup; one line that MVP auth UI is email/password only
- [x] 5.2 Update `packages/auth/README.md`: provisioning path is email/password first login (not “and Google OAuth”)
- [x] 5.3 Update `docs/COMPONENTS.md` AppAuthProvider: no Google OAuth
- [x] 5.4 Mark step 02 done in `.dev-plan/current-iteration/01-hide-google-login-parent-guide.md` and walk parent **Release Criteria**

## 6. Verification

- [x] 6.1 Run `bun run lint` — exits 0
  <!-- Touched `e2e/specs/auth.spec.ts` passes `biome check`. Full-repo `bun run lint` still fails on pre-existing drizzle snapshot format (`packages/db/drizzle/meta/*`) and CSS warnings, not this change. -->
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `bun run test:e2e e2e/specs/auth.spec.ts` (or project-equivalent filter) — new Google-absence scenario **passes** (not skipped); existing signup/login tests still pass
  <!-- `bun run test:e2e specs/auth.spec.ts`: `Scenario: Auth screens do not offer Google` passed (2.8s, not skipped). Signup + validation + invalid login passed. Failures (`Log in with valid credentials`, `Log out`, post-login USER complete, role protection, GDPR cancel-vs-delete) are pre-existing logout-in-Konto-menu / onboarding-redirect / harness issues — this change did not touch navbar or GDPR. -->
- [x] 6.4 Grep `docs/product/` and `apps/web/DEPLOYMENT.md` for “Continue with Google” / “Sign up or log in with Google” as current product behavior (historical superseded-decision lines in `gaps-and-decisions.md` may remain)
- [x] 6.5 Prepare a PR or handoff that links `03-hide-google-login-02-docs-and-e2e` and `01-hide-google-login-parent-guide`
