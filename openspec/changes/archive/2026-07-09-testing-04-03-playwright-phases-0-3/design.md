## Context

Step `testing-04-01-test-harness` delivered repo-root Playwright (`e2e/`), proximity-only selector policy, and auth fixtures (`loginAsUser`, `loginAsAdmin`). Only `smoke.spec.ts` exists today. Product behavior for Phases 1–3 is already implemented in `apps/web` and specified in:

| Feature file | Spec target |
|---|---|
| `docs/migration/features/static-pages.feature` | `e2e/specs/static-pages.spec.ts` |
| `docs/migration/features/auth.feature` | `e2e/specs/auth.spec.ts` |
| `docs/migration/features/onboarding.feature` | `e2e/specs/onboarding.spec.ts` |

Known app facts for implementers:

- Cookie consent key: `unveiled:cookie-consent` (`apps/web/app/lib/cookie-consent.ts`); banner island clears/stores via `localStorage`.
- Onboarding SSR steps: `/[locale]/onboarding/{age,interests,location,timing}` with middleware gate (`evaluateOnboardingRedirect`).
- Auth UI: Better Auth HeroUI on `/login`, `/signup`; credentials from `E2E_*` env only.
- Default locale for tests: `de` (from `e2e/fixtures/base.ts`).

Source of truth: `.dev-plan/current-iteration/testing-04-03-playwright-phases-0-3.md`.

## Goals / Non-Goals

**Goals:**

- Every `Scenario:` / Scenario Outline example in the three feature files has a Playwright `test()` whose title matches the Gherkin line (or outline + example row).
- Non-skipped tests pass against local SSR (`bun run seed:demo` + `bun run dev` or `CI=true` webServer).
- Fresh-USER isolation for onboarding (prefer signup per test over shared mutable state).
- Explicit `test.skip('…reason…')` for Phase 9 GDPR scenarios and Google OAuth when CI cannot complete OAuth.
- Zero forbidden selectors (`data-testid`, `.class`, `#id`) in new specs.
- `e2e/README.md` lists skipped scenarios with phase owners.

**Non-Goals:**

- Admin/partner catalog E2E (`testing-04-04`).
- Ladle stories (`testing-04-02`).
- CI workflow (`testing-04-05`).
- Production markup changes / test IDs.
- Asserting real email delivery for password reset (UI success message only).
- Implementing Phase 5 map embed if absent — assert cookie decline + document map deferral.

## Decisions

### 1. One spec file per Gherkin feature basename

```
e2e/specs/static-pages.spec.ts
e2e/specs/auth.spec.ts
e2e/specs/onboarding.spec.ts
```

- Matches harness README and step 01 naming convention.
- **Alternative:** Single `phases-0-3.spec.ts`. Rejected — harder to run/filter and diverges from feature-file mapping.

### 2. Verbatim Gherkin titles (with Outline row disambiguation)

```typescript
test('Scenario: Landing page', async ({ page, locale }) => { … });

test('Scenario Outline: Signup validation — email = not-an-email', async ({ page }) => { … });
```

- Include the `Scenario:` / `Scenario Outline:` prefix for feature-file skimmability (per iteration plan).
- Outline rows: one `test` per Examples table row; title must uniquely identify the row.

### 3. Cookie / first-visit isolation

- `beforeEach` for cookie scenarios: clear `localStorage` key `unveiled:cookie-consent` and relevant cookies via `page.context().clearCookies()` + `page.evaluate` after navigation or `addInitScript`.
- Prefer `context.addInitScript` to clear consent before first paint when "first visit" is required.

### 4. Map-placeholder scenario (Phase 5 deferral allowed)

- If a seeded public event detail (`/de/events/:id`) exposes a map slot, assert static placeholder after decline.
- If no map UI exists yet: assert consent decline persists and add a short comment that map placeholder coverage is deferred to Phase 5 / discovery E2E — still keep the named `test()` so the scenario is tracked (pass on consent assertion only, or `test.skip` with Phase 5 reason if assertion would be vacuous). Prefer **pass with documented partial assertion** over silent skip when cookie decline itself is verifiable.

### 5. Auth fixtures extension

Extend `e2e/fixtures/auth.ts` with:

- `logout(page, locale)` — proximity: nav/menu logout control → expect landing.
- Optional `signupFreshUser(page, locale)` returning unique email (timestamp/uuid) for isolation.
- Keep `loginAsUser` / `loginAsAdmin` for seeded accounts used in login/protection tests.

New `e2e/fixtures/onboarding.ts`:

- Helpers to drive steps 1–4 via role/label selectors (age chips, interest checkboxes, district multi-select, timing toggles).
- Prefer **new signup** per onboarding test over SQL reset; document SQL reset from `DEPLOYMENT.md` only as fallback.

### 6. Skip policy (mandatory reason strings)

| Scenario | Treatment |
|---|---|
| Request a data export | `test.skip('Phase 9 — GDPR data export not built')` |
| Request account deletion | `test.skip('Phase 9 — self-service deletion not built')` |
| Account deletion vs subscription cancellation | `test.skip('Phase 9 — …')` |
| Admin can process account deletion | `test.skip('Phase 9 — …')` |
| Sign up or log in with Google | `test.skip('Google OAuth — requires Neon test provider; verify manually on staging')` unless local Neon OAuth is configured |
| Social login never creates PARTNER/ADMIN | Same OAuth skip, or assert via documented provisioning note if OAuth skipped |

Unmarked `test.skip()` without a reason string is forbidden.

### 7. Password reset without mailbox

- Assert forgot-password form shows success toast/message after valid email submit.
- Do **not** open Resend inbox or assert SMTP delivery in CI.

### 8. Post-login routing outline

Use dedicated accounts or fixture setup matching the four rows:

| role | onboardingComplete | destination |
|---|---|---|
| PARTNER | true | partner portal (`/:locale/partner` or equivalent) |
| ADMIN | true | admin area |
| USER | false | onboarding |
| USER | true | member app (events feed / membership per current Phase 3 routing) |

If PARTNER demo account is unavailable in seed, document setup in README and skip that single row with an explicit reason — prefer creating via admin portal-access only if already seedable; do not invent PARTNER self-signup.

### 9. Selector and assertion style

- Import `test`/`expect` from `../fixtures/base` (or auth/onboarding fixtures that re-export).
- Allowed: `getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, `nth()`.
- Assert URLs with `toHaveURL`, visible headings/links with role+name, form errors with accessible text.

## Risks / Trade-offs

- **[Better Auth UI label drift]** DE/EN labels may not match regexes → Verify against live `/de/login` and `/de/signup`; keep bilingual regexes (`/anmelden|sign in/i`).
- **[PARTNER account missing in seed]** Post-login PARTNER row may fail → Document seed/promote path in README; allow one explicit skip if seed cannot provide PARTNER.
- **[Onboarding completion destination]** Feature file says membership checkout; Phase 6 may not be live → Assert current implemented redirect (checkout or membership route) and align with live app, not aspirational Phase 6 URL if absent.
- **[Map not in Phase 1–3 UI]** Declining-consent map scenario partially untestable → Partial assertion + Phase 5 comment (Decision 4).
- **[Shared E2E_USER with onboarding_complete=true]** Contaminates "incomplete USER" tests → Prefer fresh signup for onboarding; reserve `E2E_USER_*` for already-onboarded login paths.
- **[Flaky cookie banner timing]** Island hydrates after SSR → Wait for banner `role="region"` / accept-decline buttons before asserting.

## Migration Plan

1. Ensure `.env` has `E2E_*` credentials and `SITE_URL`; run `bun run seed:demo` if catalog needed for discover/legal smoke.
2. Implement fixtures → static-pages → auth → onboarding specs.
3. Update `e2e/README.md` skip inventory.
4. Verify: `bun run test:e2e -- e2e/specs/static-pages.spec.ts e2e/specs/auth.spec.ts e2e/specs/onboarding.spec.ts`, then lint/typecheck.
5. Mark step 03 done in `testing-04-parent-guide.md`.
6. Rollback: delete the three specs + onboarding fixture; no production deploy impact.

## Open Questions

- Exact PARTNER demo credentials / seed path for post-login routing row — resolve during apply by reading `DEPLOYMENT.md` and seed script; skip with reason if unavailable.
- Whether onboarding completion currently redirects to `/membership` or another route — confirm against live app during apply and assert that URL.
