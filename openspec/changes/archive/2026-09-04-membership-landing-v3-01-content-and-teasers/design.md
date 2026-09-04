## Context

See proposal.md (Why). Current state: locale home (`apps/web/app/routes/[locale]/index.tsx`) renders `LandingPage` from `landing` content key with 5 hardcoded `LandingEventTeaser` items (credit labels + locked states) in `apps/web/app/lib/content/landing.ts` / `regular.ts`. `listUpcomingEvents(db, { limit, now })` in `packages/db/src/catalog/events.ts` already returns published-only future events soonest-first. The v3 mock (`.dev-plan/unveiled-membership-v3.html`) defines sections (hero + 29 € offer, events rail, credits, flexibility/partners, community, final CTA) with `data-en`/`data-de` copy. Constraint: this step is content + data only — no visual rebuild, no route swap, old keys/pages untouched; business logic stays out of route files; locale-in-URL and yellow/Work Sans theme untouched.

## Goals / Non-Goals

**Goals:**

- Add `LandingV3Content` + `LandingLiveTeaser` types and `landing-v3.ts` DE/EN copy ported verbatim from the mock, registered as `landing-v3` page key.
- Add a guest-safe teaser mapper (`listUpcomingEvents` limit 3 → locale labels/image, no restricted fields) with static fallback.
- Wire the locale-home route loader to fetch teasers + v3 content while keeping existing render output unchanged.
- Unit coverage for mapper guest-safety, ordering, limit, empty fallback, and DE/EN content parity.

**Non-Goals:**

- Any visual rebuild, `LandingPageV3` composition, or route swap (step 02).
- Hard-deleting legacy `LandingPage`, `landing.ts`, `regular.ts`, legacy components, `/regular` routes (step 02).
- SEO/meta, Ladle, Playwright, sitemap/docs updates (step 03).

## Decisions

1. **New `landing-v3` PageKey alongside old keys (no repoint yet)**
   - **Choice:** Extend `PageKey` + `PageContentMap` with `landing-v3`; add `apps/web/app/lib/content/landing-v3.ts`; register in `content/index.ts`. Keep `landing`/`regular` keys and files intact.
   - **Rationale:** Step 02 owns the hard delete and `landing`→v3 repoint; keeping both keys makes step 01 independently mergeable and reviewable.
   - **Alternatives:** Repoint `landing` at v3 now (rejected — expands blast radius and conflicts with step 02's deletion diff).

2. **`LandingLiveTeaser` as a narrow guest-safe projection (no credits/URLs)**
   - **Choice:** `{ id, title, description, dateLabel, time, place, image }` only. Mapper strips `creditPrice`, `remainingCapacity`/`capacity`, redemption/code fields, and never emits `/events/:id` hrefs.
   - **Rationale:** Parent release criteria: rail never shows credits or detail links; CTAs go to `/:locale/signup`. A narrow type makes leaks a type error, not a review catch.
   - **Alternatives:** Reuse `LandingEventTeaser` with `credits: ""` (rejected — leaves sensitive fields in scope and invites accidental render).

3. **Mapper lives in `app/lib/` (route wires, helper maps)**
   - **Choice:** New `apps/web/app/lib/landing-teasers.ts` (pure function of `Event[]` + locale → `LandingLiveTeaser[]`, plus a loader wrapper that calls `listUpcomingEvents(db, { limit: 3 })`). Route file only fetches and passes through.
   - **Rationale:** AGENTS.md hard rule: business logic in `packages/*` or `app/lib/`, not route files; keeps mapper unit-testable without DB/HTTP.
   - **Alternatives:** Inline mapping in `[locale]/index.tsx` (rejected — untestable, violates boundary rule).

4. **Locale-aware labels via existing title/description + Berlin date/time formatting**
   - **Choice:** Title/description from locale columns (fallback to the other locale when empty); `dateLabel` as `DD MMM` uppercase (e.g. `02 SEP`) and `time` as `HH:MM` / `ab HH:MM` (DE) vs `from HH:MM` (EN) in Europe/Berlin; `place` from partner area (fallback venue short); `image` from primary-image variant helper.
   - **Rationale:** Matches existing teaser shape and mock rail copy; Berlin timezone per repo convention; reuses image pipeline (no base64).
   - **Alternatives:** Raw ISO strings to the client (rejected — leaks formatting burden and breaks parity tests).

5. **Static fallback keeps the build green (no empty-rail failure)**
   - **Choice:** On empty result or DB throw, fall back to existing rail items minus credits (same 5 static items with `credits` omitted). Loader never throws for teaser failure.
   - **Rationale:** Step plan: build stays green when DB is empty/unreachable; step 02 owns the true empty-state card. Fallback is temporary scaffolding, clearly marked for removal.
   - **Alternatives:** Render empty rail now (rejected — changes visible output before the rebuild step); throw/500 on DB error (rejected — marketing home must stay resilient).

## Risks / Trade-offs

- **[Risk] Mock copy drift (DE/EN pairs out of sync)** → Mitigation: parity unit test asserting identical key sets per locale; port verbatim, no edits.
- **[Risk] Event row missing locale title/image** → Mitigation: locale fallback + placeholder image path; mapper never throws on a single bad row (skip or placeholder).
- **[Risk] `IMAGE_PUBLIC_BASE_URL` unset locally** → Mitigation: try/catch around variant URL builder → `undefined` image, same pattern as admin tables.
- **[Trade-off] Temporary fallback duplicates static copy** → Accept: small duplication removed in step 02 when the real empty-state card ships; keeps this diff reviewable.
- **[Trade-off] Route loads v3 content it does not render yet** → Accept: wiring proves the loader path now; render stays on old `LandingPage` so no visual regression this step.

## Migration Plan

1. Land types + `landing-v3.ts` + key registration (no route behavior change).
2. Land mapper + loader wiring with fallback (render output unchanged).
3. Land unit tests (mapper + content parity); run `bun run lint`, `bun run typecheck`, `bun test apps/web/app/lib/content`.
4. Rollback: revert single PR (additive only; no migration, no route deletion).

## Open Questions

- None blocking. Image variant choice (small vs medium) and empty-state card design are step 02 decisions.
