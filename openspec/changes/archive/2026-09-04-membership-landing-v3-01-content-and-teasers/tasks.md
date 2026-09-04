## 1. Setup

- [x] 1.1 Read the step plan end-to-end (all 5 proposal sections) plus the parent guide release criteria/non-goals, and verify understanding of step 01 boundaries (no visual rebuild, no deletions)
- [x] 1.2 Confirm prerequisites exist (`listUpcomingEvents` in `packages/db/src/catalog/events.ts`, content index/types, mock copy in `.dev-plan/unveiled-membership-v3.html`) and verify `bun run typecheck` passes on a clean tree

## 2. V3 content model

- [x] 2.1 Add `LandingV3Content` + `LandingLiveTeaser` types to `apps/web/app/lib/content/types.ts` and verify `bun run typecheck` passes
- [x] 2.2 Add `apps/web/app/lib/content/landing-v3.ts` with verbatim DE/EN copy ported from the mock (hero + 29 € offer, events rail copy, credits, flexibility/partners, community, final CTA) and verify DE/EN key parity by inspection
- [x] 2.3 Register the `landing-v3` page key in `PageKey`/`PageContentMap`/`content/index.ts` without removing `landing`/`regular`, and verify `getPageContent(locale, "landing-v3")` resolves in both locales

## 3. Guest-safe teaser mapper + route wiring

- [x] 3.1 Implement the guest-safe teaser mapper in `apps/web/app/lib/landing-teasers.ts` (`listUpcomingEvents(db, { limit: 3 })` → `LandingLiveTeaser[]` with Berlin date/time labels, partner-area place, primary image variant; no credit/capacity/redemption/URL fields) and verify unit tests cover mapping of a fixture row
- [x] 3.2 Add static fallback (existing rail items minus credits) on empty result or DB throw so the loader never fails, and verify fallback triggers on empty input
- [x] 3.3 Wire `GET [locale]/index.tsx` to fetch teasers and load v3 content alongside the existing render (render output unchanged; `[locale]/regular.tsx` untouched), and verify the route still renders with DB empty and DB populated

## 4. Tests and verification

- [x] 4.1 Add/extend unit tests for mapper guest-safety (absence of credit/capacity/redemption/URL data), 3-row limit, soonest-first order, empty fallback, and DE/EN content parity, and verify `bun test apps/web/app/lib/content` exits 0
- [x] 4.2 Run `bun run lint` and verify it exits 0
- [x] 4.3 Run `bun run typecheck` and verify it exits 0
