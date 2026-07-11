## Context

Phase 5.5 step 04 (workstream B), after step 03 remediated G7 locators and unskipped remote-URL admin image. Product SoT:

- `docs/product/features/static-pages.feature` — Discover preview→detail + Discover CTA→auth→`/events`
- `docs/product/features/event-discovery.feature` — guest public detail + guest `/events` redirect
- `docs/product/sitemap/sitemap.md` § Guest journey
- `docs/product/testing/bdd-and-e2e.md` — verbatim titles, proximity selectors, Known coverage gaps (inventory for this step)

**Current inventory (pre-step):**

| Scenario (product Gherkin) | E2E today |
|---|---|
| Discover preview links to public event detail | Missing titled test (preview CTA asserted inside “Public discovery preview for guests”) |
| Discover CTA path to the full member events feed | Missing |
| Guest can view public event detail without authentication | Missing titled test (`getEventIdByTitle` used elsewhere; detail is public) |
| Guest path to full browse requires signup or login | Missing titled test (middleware redirects guests from `/events`) |
| Public discovery preview for guests | Present — verify title verbatim |
| Other `static-pages` / `event-discovery` scenarios | Present with matching titles |

**Discover CTA reality check:** Hero primary “View membership” → `/:locale/membership`; secondary “Browse live events” → `#events` (in-page preview). Sitemap requires primary path to **signup or login** then member `/events`. Step 04 may need a minimal href fix so the Scenario can pass without inventing a public full feed.

Canonical product behavior stays in `docs/product/`; this OpenSpec delta is planning-only for apply.

## Goals / Non-Goals

**Goals:**

- Ship the four missing Scenario-titled Playwright tests (or named deferrals)
- Align any title drift in `static-pages.spec.ts` / `event-discovery.spec.ts`
- Check in a coverage matrix covering all MVP feature files + post-MVP skip notes + Phase 6–8 unshipped rows
- Point `bdd-and-e2e.md` Known coverage gaps at the matrix
- Minimal Discover CTA wiring if required for the auth→`/events` Scenario

**Non-Goals:**

- G7 locator sweeps already owned by step 03
- Full sitemap spot-check / staging deploy (step 05)
- Implementing Stripe, booking, waitlist, profile, admin-users e2e (matrix rows mark `unshipped` / Phase 6–8)
- Deleting post-MVP partner portal/QR `@skip-no-ui` stubs
- Expanding the BDD exception list or adding `data-testid`
- Starting Phase 6

## Decisions

### 1. Coverage matrix lives at `docs/product/testing/coverage-matrix.md`

- **Choice:** Put the matrix next to the BDD contract under `docs/product/testing/`, and add a short pointer from `e2e/README.md` and from `bdd-and-e2e.md` Known coverage gaps (replace the gap tables with a link + residual notes only).
- **Rationale:** Product SoT is `docs/product/`; agents already open `bdd-and-e2e.md` for selector rules. `e2e/COVERAGE.md` is acceptable per the step plan, but product-testing ownership keeps Phase 6–8 implementers looking in one tree.
- **Alternatives considered:** `e2e/COVERAGE.md` only — fine for harness owners, weaker for product agents; dual files — drift risk.

### 2. Matrix columns and status vocabulary

- **Choice:** Columns: `Feature file` | `Scenario title` | `Playwright` (`e2e/specs/<file>.spec.ts` + `test("Scenario: …")` or `—`) | `Status` (`pass` / `skip` / `deferred` / `unshipped`) | `Notes`.
  - `pass` — titled test exists and is expected to run (not skipped)
  - `skip` — `@skip-no-ui` or `test.skip` (post-MVP or env)
  - `deferred` — MVP-required but named deferral (scenario + reason + target phase in Notes / parent Risks)
  - `unshipped` — feature not implemented yet (Phases 6–8); no spec file or empty placeholder
- Include every Scenario in MVP `docs/product/features/*.feature` plus a short post-MVP section referencing `features/post-mvp/` skips.
- **Rationale:** Matches step plan deliverable; single inventory for step 05 release gate.

### 3. Four new tests — assertion strategy

| Scenario | Spec file | Approach |
|---|---|---|
| Discover preview links to public event detail | `static-pages.spec.ts` | Guest `goto /:locale`; click first `getByRole('link', { name: /mehr sehen\|see details/i })`; assert URL `/events/:id` and heading visible; **no** login redirect |
| Discover CTA path to the full member events feed | `static-pages.spec.ts` | Follow primary auth path (see Decision 4); complete signup + onboarding via existing fixtures; assert land on `/:locale/events` (or navigate there via returnTo); assert guests never saw a public full feed |
| Guest can view public event detail without authentication | `event-discovery.spec.ts` | `clearCookies`; `getEventIdByTitle` for a seeded upcoming title; `goto /events/:id`; assert content; assert gated actions require auth (e.g. “Sign in to book” / login link) |
| Guest path to full browse requires signup or login | `event-discovery.spec.ts` | Guest `goto /:locale/events`; assert redirect to login/signup with returnTo; optionally complete auth+onboarding and open feed — prefer one focused redirect assertion if full auth path is covered by the static-pages CTA scenario |

- Reuse `signupFreshUser` / `completeOnboardingWizard` / `getEventIdByTitle`; proximity selectors only.
- Prefer **one** assertion path per Scenario title — do not duplicate under a second invented title.
- **Rationale:** Basename mapping + verbatim titles per `bdd-and-e2e.md`.

### 4. Discover “browse all events” CTA — fix href if needed

- **Choice:** If the Scenario cannot pass against current UI (secondary CTA → `#events`, membership → `/membership` without guaranteed post-auth `/events`), change the Discover primary browse/auth CTA to signup or login with `returnTo` toward `/:locale/events` (or signup that preserves returnTo), matching sitemap § Guest journey. Keep EventCard “See details” → public detail unchanged. Do **not** expose a public full `/events` list.
- **Rationale:** Product Gherkin + sitemap already require this; step plan allows minimal fix revealed by tests; broader sitemap audit stays step 05.
- **Alternatives:**
  - Assert via nav “Sign up” / “Log in” only — weaker vs “primary CTA to browse all events”
  - Named deferral to step 05 — allowed but leaves Discover CTA gap open at the BDD gate
- **Fallback:** If returnTo-after-onboarding is flaky (onboarding currently lands on membership), assert: CTA → auth → after onboarding user can open `/events` as member, and document any returnTo polish as named deferral for step 05 / Phase 8.

### 5. Auth GDPR stubs stay `deferred` in the matrix

- **Choice:** Matrix rows for Google OAuth + data export/deletion scenarios in `auth.feature` stay `deferred` → Phase 8 (parent guide already flags this). Do not implement those tests in step 04.
- **Rationale:** Step plan out-of-scope list; parent Risks already name them.

### 6. Prefer implementing over deferral for the four Discover/guest scenarios

- **Choice:** Ship passing tests for all four; named deferral only if blocked by env/auth flake after a good-faith attempt.
- **Rationale:** These are the Phase 5.5 BDD release criteria for Discover→detail→auth.

## Risks / Trade-offs

- **[Risk] Discover CTA vs `#events` mismatch** → Mitigation: Decision 4 minimal href fix; keep preview cards on public detail.
- **[Risk] Multi-step auth+onboarding flake (Neon Auth)** → Mitigation: reuse `signupFreshUser` + retries pattern from `event-discovery.spec.ts`; if CTA scenario is too heavy, split: static-pages asserts CTA→auth URL; event-discovery guest `/events` covers redirect; document any incomplete “lands on `/events`” as named deferral.
- **[Risk] Empty Discover preview (no seeded upcoming)** → Mitigation: reuse demo seed titles; optional fixture helper; fail loudly if preview empty rather than silent skip.
- **[Risk] Matrix drift after Phase 6+** → Mitigation: `bdd-and-e2e.md` checklist item to update matrix when adding Scenario tests; step 05 can spot-check.
- **[Trade-off] Full CTA path vs redirect-only** → Prefer full path for static-pages Scenario; keep guest `/events` redirect as a separate focused test to avoid one mega-test owning two titles.

## Migration Plan

1. Implement tests (+ optional Discover CTA href).
2. Author coverage matrix from feature files × existing `e2e/specs`.
3. Update `bdd-and-e2e.md` gaps section to point at the matrix.
4. Run lint, typecheck, targeted e2e.
5. Mark step 04 done in parent guide; hand sitemap/deploy to step 05.
6. Rollback: revert e2e + matrix + optional CTA href; no schema/migrations.

## Open Questions

- None blocking apply — returnTo-after-onboarding polish may surface during implementation; record as named deferral if needed rather than blocking the matrix.
