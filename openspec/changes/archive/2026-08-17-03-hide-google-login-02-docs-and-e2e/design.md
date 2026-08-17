## Context

Parent feature: Hide Google Login (`.dev-plan/current-iteration/01-hide-google-login-parent-guide.md`). Child step 02 of 02 — docs and e2e; depends on `02-hide-google-login-01-auth-surfaces` (done/archived). See `proposal.md` for motivation.

Runtime already matches the parent screens:

- `createAuthProviderConfig` sets `socialProviders: []`.
- Login copy is email/password only (DE/EN).
- `docs/product/features/auth.feature` includes `Scenario: Auth screens do not offer Google` and no Google OAuth signup scenarios.

What remains is the **verification and documentation layer**:

- `e2e/specs/auth.spec.ts` still has skipped tests titled `Sign up or log in with Google` and `Social login never creates a PARTNER or ADMIN account`.
- Coverage matrix, `bdd-and-e2e.md`, and `e2e/README.md` still list those as `deferred` / skip-inventory (Neon test provider).
- Sitemap `/login` is “email/password + Google”; `/auth/callback/google` is listed as an app route.
- `integrations-and-config.md` and `gaps-and-decisions.md` still treat “add Google OAuth” as the current decision.
- `DEPLOYMENT.md` demo, Google OAuth operator section, staging/production checklists, and Phase 4½ skip table still require or allow Continue with Google.
- `AGENTS.md`, `packages/auth/README.md`, and `docs/COMPONENTS.md` AppAuthProvider still mention Google as current setup.

Constraints: `docs/product/` is behavioral SoT; OpenSpec under `openspec/specs/` is a planning mirror; Playwright titles match Gherkin verbatim; proximity/role selectors only (`docs/product/testing/bdd-and-e2e.md`). Do not implement OAuth. Do not change Neon dashboard or `provisionNewUser`.

## Goals / Non-Goals

**Goals:**

- Passing Playwright for `Scenario: Auth screens do not offer Google` on login and signup (default locale; EN copy in the same assertions).
- Coverage/sitemap/integrations/gaps/DEPLOYMENT/AGENTS/auth README/COMPONENTS match email/password-only MVP auth.
- Close the parent feature: mark this step done and walk Release Criteria.

**Non-Goals:**

- Re-implementing Google or Apple OAuth.
- Changing Neon Auth dashboard settings (a leftover provider is harmless if the UI never shows the button).
- Changing `provisionNewUser` / first-session starter state.
- Reopening CHARTER.md locked decisions.
- Editing `auth.feature` / login copy / `socialProviders` (already done in step 01) unless a leftover Google claim is found.

## Decisions

1. **Replace skipped Google tests; do not skip the new scenario**
   - **Choice:** Delete the two `test.skip` Google OAuth tests. Add one passing test titled exactly `Scenario: Auth screens do not offer Google`. Visit `/${locale}/login` and `/${locale}/signup`. Assert email and password fields (`getByLabel` /e-?mail/i and /^passwort$|^password$/i, matching existing auth specs). Assert no `button` or `link` whose accessible name matches `/google/i` (`getByRole`; covers Google / Continue with Google / Weiter mit Google). Assert the auth page description does not mention Google (`getByText(/google/i)` count 0 on the page, or heading-adjacent description if a whole-page text assert is too broad). Use the existing `locale` fixture (default `de`). Include EN names in the role regex so one default-locale run still catches leftover English library copy.
   - **Rationale:** Step brief; verbatim Gherkin title; proximity/role selectors only; bilingual copy without a second locale matrix (fixture is `option: true`, default `de` only).
   - **Alternatives:** Keep skipped tests as “removed” stubs (pollutes suite). Separate EN `test.use({ locale: "en" })` block (unnecessary if regex covers both strings). `test.skip` until a Neon Google client exists (rejected — Google is not offered).

2. **Coverage inventory: pass the new scenario; remove old Google rows**
   - **Choice:** In `coverage-matrix.md`, delete (or mark removed) the two Google OAuth rows and the Phase 8 close-out “Google OAuth (+ social never…) `deferred`” row. Add `Auth screens do not offer Google` → `e2e/specs/auth.spec.ts` → `pass`. Update `bdd-and-e2e.md` residual note (`auth` / Google OAuth) so it is not deferred. Update `e2e/README.md` skip inventory and CI notes: drop Google skip rows; do not say Google scenarios may `test.skip` when Neon credentials are missing.
   - **Rationale:** Step forbids treating Google rows as `deferred`. GDPR skips stay only with Neon Auth / env / harness reasons.
   - **Alternatives:** Relabel old titles as pass (wrong — those scenarios were removed in step 01). Leave matrix stale until a later audit (agents keep skipping).

3. **Sitemap: email/password only; drop Google callback as an app route**
   - **Choice:** `/login` notes → `@better-auth-ui/heroui`; email/password only. Remove the `/auth/callback/google` row. Do not replace it with a 404 note or a Neon-internal callback URL.
   - **Rationale:** Neon may still have a provider callback; it is not an app page. Sitemap is route SoT.
   - **Alternatives:** Keep the callback as “Neon-only, not an app route” (still greppable as a route). Leave Google on `/login` (contradicts shipped UI).

4. **Integrations + gaps: supersede, do not pretend Google shipped**
   - **Choice:** Env table: Google OAuth is not a current product auth method (optional future; no app env vars). Rewrite the “Google OAuth” section to email/password-only MVP; leftover Neon provider is harmless; re-adding Google is a new change. In `gaps-and-decisions.md`, update the Identity row so the earlier “Google OAuth added via Neon Auth” decision is **superseded** (UI does not offer it because it is not implemented; Apple still out). Keep the historical mention — do not rewrite history as if Google never appeared in the log.
   - **Rationale:** Step grep check allows historical changelog lines; forbids “Continue with Google” as current product behavior.
   - **Alternatives:** Delete the gaps row (loses traceability). Leave integrations as “decided: add Google” (agents re-enable the button).

5. **DEPLOYMENT: operator path is email/password; drop Google as a gate**
   - **Choice:** Test-user signup: email/password only (drop “or use Continue with Google”). Admin setup: every self-service signup is email/password (not “email or Google”). Replace the “Google OAuth (Neon Auth)” how-to with a short note that MVP does not offer Google; do not require enabling a provider; leftover dashboard config is OK. Remove Google from staging checklist, Phase 4½ known marked skips, named deferrals that still say Google e2e → Phase 8, and production cutover (“configure Google OAuth if offering social login”).
   - **Rationale:** Step deliverables; platform-foundation known-skips must not list Google OAuth CI limits.
   - **Alternatives:** Keep the Neon how-to as optional appendix (risk: operators think they must enable it). Soften to “if you enable Google…” (out of scope — this feature hides the offer).

6. **Agent docs: one-liner, no new convention**
   - **Choice:** `AGENTS.md` Auth setup: replace “Google OAuth: configured in Neon Auth…” with one line that MVP auth UI is email/password only. `packages/auth/README.md`: provisioning is email/password first login (drop “and Google OAuth”). `docs/COMPONENTS.md` AppAuthProvider: drop “Google OAuth” from the wrap description.
   - **Rationale:** Step cleanup: no new AGENTS.md convention beyond that one-liner.
   - **Alternatives:** Document how to re-enable Google in AGENTS.md (invites scope creep).

7. **Parent close-out after verification**
   - **Choice:** After lint/typecheck/auth e2e and the grep check, mark this step done in the parent guide and walk Release Criteria. Canonical product specs for this slice are updated here; leftover “Google is current MVP auth” in `docs/product/` is only the superseded-decision note.
   - **Rationale:** This step closes the feature.
   - **Alternatives:** Leave parent open until Neon dashboard is cleared (parent non-goal).

## Risks / Trade-offs

- **[Risk] Whole-page `getByText(/google/i)` false-positive** (cookie banner, font, unrelated copy) → Mitigation: start with role-named button/link count 0; if description assert is noisy, narrow to the auth layout description next to the form heading (still proximity, not CSS class hashes).
- **[Risk] Library still renders a social control with a non-Google accessible name** → Mitigation: also assert no button/link named `/google/i`; step 01 already set `socialProviders: []`. If a generic “Continue with social” appears, treat as a blocker (do not add a custom island).
- **[Risk] Stale “Continue with Google” in docs outside the listed files** → Mitigation: grep `docs/product/` and `apps/web/DEPLOYMENT.md` as a verification command; historical gaps row is the allowed exception.
- **[Risk] Auth e2e needs `DATABASE_URL` / `AUTH_URL` for other scenarios** → Mitigation: the no-Google test is guest-only (no signup); it should pass without OAuth secrets. Existing signup/login tests must still pass.
- **[Trade-off] Neon Google provider may remain enabled** → Acceptable per parent Non-Goals.

## Migration Plan

1. Land Playwright replacement + coverage/sitemap/integrations/gaps/DEPLOYMENT/AGENTS/README/COMPONENTS + parent close-out notes.
2. Run `bun run lint` and `bun run typecheck`; run `bun run test:e2e e2e/specs/auth.spec.ts` (or project-equivalent filter) and confirm the new scenario **passes** (not skipped).
3. Grep: no remaining “Continue with Google” / “Sign up or log in with Google” as current product behavior in `docs/product/` and `apps/web/DEPLOYMENT.md`.
4. Mark parent guide step 02 + Release Criteria; sync OpenSpec main specs on archive.
5. No DB, env, or deploy migration; no new secrets.
6. Rollback: revert docs/e2e commits; runtime hide from step 01 stays unless that PR is also reverted.

## Open Questions

- None blocking. Re-adding Google later is a new change, not a revert of this hide.
