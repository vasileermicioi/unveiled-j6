## Why

Step 01 already hides Google on login/signup and updated `auth.feature`, but Playwright still `test.skip`s obsolete Google OAuth scenarios and operator/product docs still describe Google as a current login method. Until coverage, sitemap, integrations, and `DEPLOYMENT.md` match email/password-only auth, CI and agents keep treating a missing OAuth flow as deferred product behavior.

## What Changes

- Replace skipped Google tests in `e2e/specs/auth.spec.ts` with a passing test titled `Scenario: Auth screens do not offer Google` (verbatim Gherkin). Assert no button/link named Google / Continue with Google / Weiter mit Google on `/login` and `/signup`; cover default locale (`de`) and EN copy in the same assertions.
- `coverage-matrix.md`, `bdd-and-e2e.md`, and `e2e/README.md`: Google rows are not `deferred` — they are removed or marked `pass` for the new scenario. Google OAuth is not a valid skip reason.
- `sitemap/sitemap.md`: `/login` is email/password only; remove `/auth/callback/google` as an app route (Neon may still have a provider callback; it is not an app page).
- `integrations-and-config.md`: Google OAuth is **not** a current product auth method (optional future; no app env vars). Update the env table row and the “Google OAuth” section.
- `gaps-and-decisions.md`: record that the earlier “add Google OAuth” decision is superseded — UI does not offer it because it is not implemented.
- `DEPLOYMENT.md`: demo/signup steps, Google OAuth operator section, staging checklist, Phase 4½ skip table, and production cutover must not require “Continue with Google”.
- `AGENTS.md` Auth setup: drop “Google OAuth: configured in Neon Auth…” as current setup; one line that MVP auth UI is email/password only.
- `packages/auth/README.md`: provisioning path is email/password first login (not “and Google OAuth”).
- `docs/COMPONENTS.md` `AppAuthProvider`: no Google OAuth.
- Out of scope: re-implementing Google; changing Neon dashboard; changing signup provisioning; CHARTER.md.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `authentication`: Playwright SHALL cover `Scenario: Auth screens do not offer Google` in `e2e/specs/auth.spec.ts` with a passing test (no `test.skip`). The core auth loop SHALL assert absence of Google/social login. Coverage matrix and `e2e/README.md` SHALL list that scenario as `pass`, not `deferred`. Google OAuth is not a valid skip reason.
- `bdd-and-e2e`: Coverage matrix, `bdd-and-e2e.md` residual notes, and `e2e/README.md` skip inventory SHALL drop Google OAuth deferrals. GDPR inventory SHALL no longer keep “Google OAuth deferrals” as a separate current skip class.
- `platform-foundation`: `DEPLOYMENT.md` Phase 4½ known-skips documentation SHALL NOT list Google OAuth CI limits as a current marked skip. Operator demo/cutover SHALL use email/password only.

## Impact

- **E2E:** `e2e/specs/auth.spec.ts` — delete skipped Google OAuth tests; add passing no-Google scenario; existing signup/login tests stay. Selectors: proximity/role only.
- **Product SoT:** `docs/product/sitemap/sitemap.md`, `docs/product/extras/integrations-and-config.md`, `docs/product/extras/gaps-and-decisions.md`, `docs/product/testing/coverage-matrix.md`, `docs/product/testing/bdd-and-e2e.md`.
- **Operator / agent docs:** `apps/web/DEPLOYMENT.md`, `AGENTS.md`, `packages/auth/README.md`, `docs/COMPONENTS.md`, `e2e/README.md`.
- **Parent close-out:** mark `03-hide-google-login-02-docs-and-e2e` done; walk Hide Google Login **Release Criteria**.
- **Planning mirrors:** `openspec/specs/{authentication,bdd-and-e2e,platform-foundation}` via this change’s deltas (not product SoT).
- **Unchanged:** `socialProviders: []`, login copy, and `auth.feature` from step 01; Neon Auth dashboard; `provisionNewUser`; CHARTER locked decisions; `/api/auth/*` proxy.
- **Source brief:** `.dev-plan/current-iteration/03-hide-google-login-02-docs-and-e2e.md`
- **Parent:** `.dev-plan/current-iteration/01-hide-google-login-parent-guide.md`
- **Depends on:** `02-hide-google-login-01-auth-surfaces` (done/archived)
- **Consumed by:** closes the Hide Google Login parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `bun run test:e2e e2e/specs/auth.spec.ts` — new Google-absence scenario **passes** (not skipped); existing signup/login tests still pass; grep that docs/product and DEPLOYMENT no longer treat “Continue with Google” as current product behavior
