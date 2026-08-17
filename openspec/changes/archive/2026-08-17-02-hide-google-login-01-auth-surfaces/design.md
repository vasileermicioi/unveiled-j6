## Context

Parent feature: Hide Google Login (`.dev-plan/current-iteration/01-hide-google-login-parent-guide.md`), step 01 of 02 — auth surfaces. See `proposal.md` for motivation. Canonical product behavior is `docs/product/features/auth.feature`; OpenSpec capability is `authentication`.

Current state:

- `createAuthProviderConfig` (`apps/web/app/lib/auth-ui-config.ts`) sets `socialProviders: ["google"]`. `AppAuthProvider` spreads that config into `@better-auth-ui/heroui` `AuthProvider`.
- Login copy in `apps/web/app/lib/auth-content.ts`: DE “Melde dich mit E-Mail und Passwort oder Google an.” / EN “Sign in with email and password or continue with Google.” Signup copy does not mention Google.
- `docs/product/features/auth.feature` header still says DECIDED: add Google OAuth; scenarios `Sign up or log in with Google` and `Social login never creates a PARTNER or ADMIN account` remain. `admin-users.feature` header still says “email/password or Google”. `user-journeys.md` signup bullet still says email/password or Google.
- `auth-ui-config.test.ts` covers locale-relative reset URLs only — it does not assert `socialProviders`.
- No other `apps/web` TS/TSX mentions Google / `socialProviders` besides those two files.

Constraints: HeroUI / `@better-auth-ui/heroui` only; no new auth islands; no client-only mutation modals; do not implement OAuth; do not change Neon Auth env or `/api/auth/*` proxy. Playwright and operator docs are step 02.

## Goals / Non-Goals

**Goals:**

- Login and signup render email/password only: no Google / social control, including “Continue with Google” / “Weiter mit Google”.
- Login descriptions (DE/EN) do not mention Google.
- Product Gherkin and the two named SoT lines (admin-users header, user-journeys signup) match email/password-only MVP auth.
- Unit test asserts `socialProviders` is `[]` for `de` and `en`.

**Non-Goals:**

- Playwright (`e2e/specs/auth.spec.ts`), coverage matrix, sitemap, integrations, `DEPLOYMENT.md`, `AGENTS.md`, `packages/auth/README.md`, `docs/COMPONENTS.md` (step 02).
- Enabling Google or Apple in Neon Auth, or any `/api/auth/*` proxy change.
- Changing `provisionNewUser` / first-session starter state.
- Reopening CHARTER locked decisions.

## Decisions

1. **Pass `socialProviders: []`, never omit the key**
   - **Choice:** In `createAuthProviderConfig`, set `socialProviders: []`. Drop the `SocialProvider` import if unused after that. If typecheck requires an annotation, keep an empty typed array (`[] as SocialProvider[]`) — still empty, still no `"google"`.
   - **Rationale:** Parent risk: `@better-auth-ui/heroui` may default to Google when the key is omitted. The step plan requires an explicit empty list and a browser check.
   - **Alternatives:** Omit the property (rejected — may re-show Google). Filter providers at the island (rejected — config is the single switch). Disable Google only in Neon Auth (rejected — leftover provider is harmless; this feature hides the UI).

2. **Login copy: drop the Google clause; leave signup copy**
   - **Choice:** DE login description → `Melde dich mit E-Mail und Passwort an.` EN login description → `Sign in with email and password.` Do not edit signup / forgot / reset copy unless a Google mention appears (none today).
   - **Rationale:** Step plan: drop “oder Google” / “or continue with Google”; signup already omits Google. Keep the rest of the sentence so DE/EN stay parallel.
   - **Alternatives:** Rewrite login descriptions more broadly (unnecessary). Hide Google in localization tables inside `@better-auth-ui` (fragile; empty `socialProviders` is the control).

3. **Gherkin: one explicit “no Google” scenario; drop OAuth scenarios**
   - **Choice:** Rewrite the `auth.feature` header: MVP is email/password only; Google is not offered because it is not implemented; Apple remains out. Remove `Scenario: Sign up or log in with Google`. Drop `Scenario: Social login never creates a PARTNER or ADMIN account` — `Scenario: Sign up as a new member` already asserts `USER` plus starter state, and ADMIN/PARTNER remain out-of-band in Background. Add `Scenario: Auth screens do not offer Google` matching the spec delta (email/password fields present; no Google/social control; description does not mention Google). Update `admin-users.feature` header “email/password or Google” → email/password only. Update `user-journeys.md` signup bullet to email/password only.
   - **Rationale:** Prefer one explicit absence scenario over a restated USER-role guarantee. Canonical SoT is `docs/product/`, updated in this step; operator docs wait for step 02.
   - **Alternatives:** Keep a redundant “self-service always creates USER” scenario (weaker; already covered). Leave Gherkin until step 02 (rejected — screens and SoT would diverge).

4. **Coverage-requirement wording changes now; Playwright in step 02**
   - **Choice:** Delta-spec MODIFIED requirements for “Automated browser coverage” and “Phase 4½ release gate” drop Google `test.skip` as valid. This change does **not** edit `e2e/specs/auth.spec.ts`. Existing skipped Google tests stay until step 02 replaces them with a passing “Auth screens do not offer Google” test.
   - **Rationale:** Step 01 owns Gherkin + surfaces; step 02 owns e2e and remaining docs. Spec contract moves with Gherkin so step 02 has a verbatim title to match.
   - **Alternatives:** Defer the e2e requirement delta to step 02 only (the child step plan also restates it; keeping it here matches this step’s Spec Delta).

5. **No Neon / proxy / provisioning changes**
   - **Choice:** Do not touch `AUTH_URL`, Google provider flags, `/api/auth/*` forwarding, or `provisionNewUser`. Existing Neon Google-linked accounts (if any) can still exist server-side.
   - **Rationale:** Parent non-goals. This feature hides the offer; it is not an OAuth teardown or a data migration.
   - **Alternatives:** Disable the Neon provider in the same PR (out of scope; leftover provider is harmless if the button is gone).

## Risks / Trade-offs

- **[Risk] Library still renders a social block despite `[]`** → Mitigation: explicit empty array (decision 1); verification includes opening `/de|en/login` and `/de|en/signup` and confirming no Google / “Continue with Google” / “Weiter mit Google” control.
- **[Risk] better-auth-ui built-in strings still mention Google** → Mitigation: empty providers should omit the social UI; login page description is the only in-repo copy that currently promises Google. If a leftover library string appears, treat it as a blocker for this step (do not add a custom island to hide it).
- **[Risk] Step 01 Gherkin vs still-skipped Playwright** → Mitigation: decision 4; step 02 MUST replace skips with a passing test titled after the new scenario. Do not `test.skip` Google in the new suite.
- **[Trade-off] Neon Auth may still have a Google provider** → Acceptable per parent guide; UI does not offer it.
- **[Trade-off] No e2e in this PR** → Unit test + lint/typecheck + manual four-route check are this step’s gate.

## Migration Plan

1. Set `socialProviders: []`; drop unused `SocialProvider` import if Biome/typecheck allow.
2. Update DE/EN login descriptions; extend `auth-ui-config.test.ts` for `de` and `en`.
3. Rewrite `auth.feature` header + scenarios; patch `admin-users.feature` header and `user-journeys.md` signup bullet.
4. Run lint, typecheck, and the unit test; visually confirm the four auth routes.
5. Mark `02-hide-google-login-01-auth-surfaces` done in the parent guide (step 02 still open).
6. **Rollback:** revert the PR (config + copy + docs only; no DB migration).

## Open Questions

- None blocking. Re-adding Google later is a new change, not a revert of this hide.
