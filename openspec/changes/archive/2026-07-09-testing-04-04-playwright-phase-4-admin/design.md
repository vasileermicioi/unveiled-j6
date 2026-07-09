## Context

Step `testing-04-01-test-harness` delivered repo-root Playwright (`e2e/`), proximity-only selectors, and `loginAsAdmin`. Step `testing-04-03` covered Phases 0–3. Phase 4 admin CRUD and public catalog already ship in `apps/web`; Gherkin sources are:

| Feature file | Spec target | Approx. tests |
|---|---|---|
| `docs/migration/features/admin-partners.feature` | `e2e/specs/admin-partners.spec.ts` | ~13 (incl. 3 outline rows) |
| `docs/migration/features/admin-events.feature` | `e2e/specs/admin-events.spec.ts` | ~17 (incl. 3 outline rows) |

Known app facts for implementers:

- Admin routes under `/:locale/admin/*` — partners list/new/edit, events list/new/edit/delete, portal-access flows.
- Public surfaces: `/de/discover` (preview grid), `/de/events/:id` (indexable, no auth).
- Image pipeline: `@unveiled/images` + R2; **local Node `sharp` only** — image upload scenarios require `bun run dev`, not Workers.
- Seed: `bun run seed:demo` / `bun run seed:demo -- --reset` for empty vs populated seed-demo scenarios.
- Default locale for tests: `de` (from `e2e/fixtures/base.ts`).
- Auth: `loginAsAdmin` from `e2e/fixtures/auth.ts` via `E2E_ADMIN_*`.

Source of truth: `.dev-plan/current-iteration/testing-04-04-playwright-phase-4-admin.md`.

## Goals / Non-Goals

**Goals:**

- Every `Scenario:` / Scenario Outline example in both feature files has a Playwright `test()` whose title matches the Gherkin line (or outline + example row).
- Partners specs implemented before events (FK dependency).
- Public catalog assertions after create/edit: title on `/de/discover`; hero, partner name, guest CTA on `/de/events/:id`.
- Image tests skip clearly when any of the six R2 vars is missing (`test.skip('R2 vars not configured')`).
- Unique timestamp suffixes on partner/event names to avoid collisions on shared DBs.
- Zero forbidden selectors; `e2e/README.md` documents R2 + local-only upload requirements.
- Non-skipped tests pass against local SSR with seed + `E2E_ADMIN_*`.

**Non-Goals:**

- Partner self-service portal (`partner-portal.feature` — Phase 8).
- Member `/events` feed (`event-discovery.feature` — Phase 5).
- Workers-deployed admin uploads.
- Ladle stories (`testing-04-02`), CI workflow (`testing-04-05`).
- Production markup / `data-testid` changes.
- Cleaning up disposable PARTNER portal accounts (disposable staging DB assumed).

## Decisions

### 1. Partners before events; one spec file per feature basename

```
e2e/specs/admin-partners.spec.ts  // implement first
e2e/specs/admin-events.spec.ts
e2e/fixtures/admin.ts
```

- Matches harness naming (`admin-partners.feature` → `admin-partners.spec.ts`).
- Events need an existing partner FK — helpers create partners first or reuse seeded ones.

### 2. Verbatim Gherkin titles (with Outline row disambiguation)

```typescript
test('Scenario: Create a partner', async ({ page, locale }) => { … });

test('Scenario Outline: Partner creation validation — name = ', async ({ page }) => { … });
test('Scenario Outline: Redemption configuration validation on create — ticketType = SECRET_CODE, mode = MANUAL, requiredField = secretCode', async ({ page }) => { … });
```

- Include `Scenario:` / `Scenario Outline:` prefix (same as step 03).
- Outline rows: one `test` per Examples table row; title uniquely identifies the row.

### 3. Admin fixture helpers

`e2e/fixtures/admin.ts` exports:

| Helper | Role |
|---|---|
| `navigateAdminTab(page, locale, tab)` | Go to partners or events admin list |
| `createPartnerViaUI(page, locale, overrides?)` | Fill create form; return unique name + id/path |
| `createEventViaUI(page, locale, overrides?)` | Fill create form (partner select, image URL by default); return title + event path |
| `deletePartnerViaUI(page, locale, nameOrId)` | Drive delete confirmation page |
| `r2Configured()` | True when all six R2 env vars are set |
| `uniqueSuffix()` | Timestamp/uuid fragment for names/emails |

- Prefer **remote URL** image path as default in helpers (CI-stable, no file picker).
- Direct upload: one dedicated test using `e2e/fixtures/sample-event.jpg` or Wikimedia URL via file chooser — skip if R2 missing.
- Portal-access emails: `partner-e2e-{timestamp}@example.com`.

### 4. Background → `beforeEach` ADMIN login

```typescript
test.beforeEach(async ({ page, locale }) => {
  await loginAsAdmin(page, locale);
});
```

- Matches Gherkin `Given I am signed in as "ADMIN"`.
- Do not share mutable partner/event state across tests; each test creates what it needs (or uses seed with unique edits).

### 5. R2 / image skip policy

```typescript
test('Scenario: Supply the event image as a direct upload', async ({ page, locale }) => {
  test.skip(!r2Configured(), 'R2 vars not configured');
  …
});
```

- Applies to: partner logo upload/URL processing assertions, event direct upload, event remote URL (if processing hits R2).
- Prefer remote URL in CI when upload fixture is flaky; keep **one** direct-upload test for local Node.
- Unmarked `test.skip()` without a reason string is forbidden.

### 6. Public catalog assertions (embedded, not separate feature file)

After successful event create (and rename-partner where relevant):

1. `page.goto('/de/discover')` → expect event title (and updated partner name after rename) visible in preview grid.
2. `page.goto('/de/events/{id}')` → expect hero image/alt or heading, partner name, guest CTA (signup/membership link per live copy).

No auth required for these pages.

### 7. Seed-demo empty vs no-op

| Scenario | Setup |
|---|---|
| Seed demo data (empty environment only) | Run `bun run seed:demo -- --reset` (or documented admin UI seed trigger against empty tables) before assertion |
| Seed demo data is a no-op when data exists | Ensure ≥1 partner or event exists, trigger seed, assert no duplicate demo set |

- Prefer invoking the **admin UI seed control** if one exists; otherwise document shell helper in README and drive via `test.step` + child process only if UI path is absent — prefer UI to stay browser-E2E.
- Reset is destructive: run empty-seed test in isolation or at suite start; do not interleave with tests that assume seeded catalog without re-seeding.

### 8. Capacity recalculation

- Create or seed an event, simulate sold tickets if UI/admin path exists; otherwise create event, book via documented seed/fixture if available, or set remaining < total via known seed state.
- Edit total capacity; assert remaining display = `max(0, newTotal - alreadySold)`.
- If booking path is Phase 6-only and no seed can create sold tickets: create event, leave remaining = total, update capacity, assert remaining equals new total (sold = 0) — still covers recalculation formula; document partial coverage in test comment if sold > 0 cannot be arranged.

### 9. Export redemption codes

- Requires confirmed bookings with codes. If Phase 6 booking is unavailable, seed or admin-comp path if present; otherwise `test.skip('Requires bookings with redemption codes — Phase 6 booking or seed fixture')` with explicit reason.
- Prefer implementing when seed/demo can provide bookings; do not invent booking UI in this step.

### 10. Selector and assertion style

- Import `test`/`expect` from fixtures that re-export base.
- Allowed: `getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, `nth()`.
- Assert URLs with `toHaveURL`, form errors with accessible text, list rows by partner/event name.

## Risks / Trade-offs

- **[R2 missing in CI]** Image tests fail hard → Gate with `r2Configured()` skip; document vars in README.
- **[Workers vs local sharp]** Upload on Workers URL fails → Document local-only; run image tests against `bun run dev`.
- **[Seed reset destroys suite state]** Empty-seed test contaminates later tests → Order carefully or re-seed after reset; isolate in `test.describe.serial` if needed.
- **[Export / sold-capacity need bookings]** Phase 6 not in scope → Explicit skip or sold=0 partial assertion (Decisions 8–9).
- **[Portal email collisions]** Reused emails → Always use `partner-e2e-{timestamp}@example.com`.
- **[DE/EN label drift]** Admin form labels may differ → Bilingual regexes; verify against live `/de/admin/*`.
- **[Flaky file picker]** Direct upload unstable in headless → Prefer URL path; one local upload test.
- **[Rename propagation timing]** Discover cache/SSR → Soft reload `/de/discover` after rename; wait for text.

## Migration Plan

1. Confirm `.env` has `E2E_ADMIN_*` and (for image tests) all six R2 vars; run `bun run seed:demo`.
2. Implement `e2e/fixtures/admin.ts` → `admin-partners.spec.ts` → `admin-events.spec.ts`.
3. Update `e2e/README.md` (R2 + local upload note).
4. Verify: `bun run test:e2e -- e2e/specs/admin-partners.spec.ts e2e/specs/admin-events.spec.ts`, then lint/typecheck.
5. Mark step 04 done in `testing-04-parent-guide.md`.
6. Rollback: delete the two specs + admin fixture (+ sample image); no production deploy impact.

## Open Questions

- Whether admin UI exposes a "seed demo" button vs CLI-only — resolve during apply by reading admin dashboard routes; prefer UI, fall back to documented CLI + assertion of resulting catalog.
- Whether any seed/demo path can create confirmed bookings for export and sold-capacity scenarios — resolve during apply; skip with reason if not.
- Exact guest CTA copy on public event detail — confirm against live `/de/events/:id` during apply.
