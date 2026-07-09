## Context

Discovery steps 01–04 are done: authenticated feed (`/:locale/events`), filters, save/unsave, `/saved`, and MapLibre map (`/:locale/events/map`) with cookie-consent gating. Phase 4½ already provides Ladle (`bun run stories`), Playwright (`bun run test:e2e`), auth fixtures (`loginAsUser`), and the proximity-only selector policy in `e2e/README.md`.

There is **no** `e2e/specs/event-discovery.spec.ts` yet, and discovery page components (`EventFeedFilters`, `EventFeedPage`, `SavedEventsPage`, `EventMap` island) lack dedicated Ladle stories. `DEPLOYMENT.md` mentions map/CSP notes but lacks a Phase 5 demo section. Parent guide step 05 is still open.

Product checklist: 12 `Scenario:` lines in `docs/migration/features/event-discovery.feature`.

## Goals / Non-Goals

**Goals:**

- Ladle stories for filter bar, saved empty/populated, EventMap loading/error/markers/consent-fallback.
- Playwright file with one test per Gherkin Scenario, titles verbatim, no unmarked skips.
- Seed/fixture coverage sufficient for today/category/partner/date-range/saved/coords scenarios.
- `DEPLOYMENT.md` Phase 5 section + parent guide marked complete.
- Final gate: lint, typecheck, stories smoke, full `test:e2e`, staging demo (filter → save → map).

**Non-Goals:**

- Implementing booking/Stripe or waitlist POSTs.
- Expanding E2E to other feature files.
- Visual regression baselines.
- Weakening selector policy (`data-testid`, CSS classes, IDs).
- Changing product filter/map semantics beyond a11y label fixes.

## Decisions

### 1. Story placement: page components + island, not new packages

| Surface | Story location | States |
|---|---|---|
| Filter bar | `apps/web/app/components/discovery/EventFeedFilters.stories.tsx` | default (today scope), filters applied (category/partner/dates), optionally empty-feed chrome via `EventFeedPage` story |
| Feed empty | `EventFeedPage.stories.tsx` | no-results paragraph visible |
| Saved | `SavedEventsPage.stories.tsx` | empty + populated (reuse `@unveiled/ui` EventCard fixtures) |
| Map | `apps/web/app/islands/EventMap.stories.tsx` (or thin wrapper under `components/discovery/`) | consent-fallback (blocked), loading skeleton, error alert, markers (mock markers; MapLibre may load in story — accept or stub consent) |

**Rationale:** Matches Phase 4½ pattern (`*.stories.tsx` next to components). `EventCard` CTA states already exist in `packages/ui` — do not duplicate; discovery stories cover page chrome and map island.

**Alternative considered:** Only package-level stories — rejected; filter/saved/map chrome live in `apps/web`.

### 2. EventMap storyability without flaky tiles

For Ladle:

- **Consent-fallback:** render with `localStorage` unset/declined (or force blocked path) — static list + consent alert; no tile network required.
- **Loading / error:** prefer exporting or story-driving internal states if needed (e.g. story-only prop `forceState` **only if** it does not ship to production routes — prefer composing existing UI: Skeleton + Alert copy from `getEventMapCopy` in a thin presentational story, **or** accept one story that mounts the island with accepted consent and sample markers for “with markers”).
- Prefer **not** mocking MapLibre in production code. If full map story is flaky in CI/Ladle, keep consent-fallback + error Alert + loading Skeleton as static HeroUI compositions and one optional markers story marked carefully.

**Rationale:** Iteration plan says “consent-fallback if storyable”; E2E owns real map behavior.

### 3. Playwright: one file, verbatim titles, fixture strategy

File: `e2e/specs/event-discovery.spec.ts` under `test.describe("event-discovery.feature", …)`.

| Scenario title (verbatim) | Approach |
|---|---|
| Default feed shows today's events only | `loginAsUser` → `/events`; assert today-scope label; event cards only for today (seed guarantees ≥1 today event) |
| Events with invalid or past dates are hidden | Assert known past/invalid seed titles absent from feed/map (or admin-created past event not listed) |
| Filter by category | GET filter form → select category → submit; assert only matching titles |
| Filter by partner (venue) | Same for partner select |
| Filter by custom date range | Fill from/to → submit; assert today-scope label gone; events in range |
| Reset filters | Apply filter → click reset link → today scope restored |
| No results | Filters that match nothing → `noResults` copy |
| Map view mirrors the filtered feed | Apply filter → open map link (preserve query) → markers/fallback list only for filtered set; popup/detail link present (not book POST) |
| Saved events view | Save ≥1 upcoming → `/saved`; not today-only |
| Save and unsave an event | Toggle bookmark; assert list membership |
| Saving requires authentication | Guest → save attempt → login redirect |
| Public discovery preview for guests | `/` or discover marketing; preview events + membership props; book/CTA → signup/membership (no booking) |

Auth: reuse `loginAsUser` / `E2E_USER_*`. Guest flows: no login. Consent for map: accept cookies when testing live map; decline when asserting fallback (static-pages already deferred map consent to discovery E2E).

**Booking CTAs:** assert label/href (`/membership` or detail) — never require Stripe.

**Selector policy:** fix `aria-label` on save toggle / filter labels if tests fail; no `data-testid`.

### 4. Seed / data prerequisites

Before writing brittle date assertions:

1. Confirm `seed:demo` (or staging data) has: ≥1 published event **today** (Berlin) with future start, ≥1 other category, ≥1 other partner, events with `lat`/`lng`, and ability to save.
2. If gaps: extend `scripts/seed-demo.ts` with deterministic titles usable in `getByText` (document titles in DEPLOYMENT.md).
3. Past/invalid scenario: seed a past or unpublished-invalid row that must **not** appear, or rely on existing catalog seed + assert absence of a known past title.

Timezone: all “today” expectations use Europe/Berlin (same as `@unveiled/db` helpers). Prefer running E2E in a TZ-stable CI env; avoid hard-coding wall-clock hour assertions beyond “visible today event.”

### 5. Docs and release gate

- Add **Phase 5 — Member discovery** to `apps/web/DEPLOYMENT.md`: routes (`/events`, `/saved`, `/events/map`), demo script, booking still Phase 6, map consent/CSP cross-link, E2E credentials note.
- Mark step 05 done in `discovery-parent-guide.md`.
- Do not start Phase 6 in the same apply session.

## Risks / Trade-offs

- **[Risk] Flaky “today” tests around midnight Berlin** → Mitigation: seed events with mid-day Berlin starts; document operator TZ; prefer relative seed helpers over fixed calendar dates when possible.
- **[Risk] MapLibre tile/network flakiness in E2E** → Mitigation: assert filter-preserved URL + marker region/`aria-label` or fallback list content; for consent-declined, assert no tile requests via Playwright request listening where practical.
- **[Risk] Insufficient seed diversity** → Mitigation: extend seed before writing filters; fail fast with clear skip only if env lacks `E2E_USER_*` (marked skip with reason — same pattern as auth specs).
- **[Risk] Temptation to add `data-testid`** → Mitigation: hard rule — fix accessible names; reject PRs that add test-only attrs.
- **[Trade-off] Static map stories vs live MapLibre in Ladle** → Prefer static/consent stories for reliability; live markers optional.

## Migration Plan

1. Land stories + E2E + docs on the discovery branch.
2. Run local gate: `bun run lint && bun run typecheck && bun run stories` (smoke) && `bun run test:e2e`.
3. Deploy staging; walk demo: filter → save → map → open detail.
4. Merge only after staging succeeds; archive change after apply.

Rollback: revert the PR — no schema migrations expected in this step (seed-only if extended).

## Open Questions

- None blocking — if seed lacks a past-event fixture, implementer adds one in `seed-demo.ts` rather than skipping the scenario.
- Whether Workers CSP already blocks OSM tiles on staging: if yes, document allowlist in DEPLOYMENT.md during this step (handoff from discovery-04).
