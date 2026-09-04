## Why

The locale home (`/:locale`) and `/regular` still render static hardcoded teaser lists with credit labels and locked states, while the v3 membership landing (`.dev-plan/unveiled-membership-v3.html`) requires real upcoming events. This first step of `membership-landing-v3` establishes the v3 DE/EN content model plus a guest-safe live-teaser path so step 02 can rebuild the page without touching data wiring.

## What Changes

- Add `LandingV3Content` (+ `LandingLiveTeaser`: id, title, description, dateLabel, time, place, image) to `apps/web/app/lib/content/types.ts`; add `landing-v3.ts` with verbatim DE/EN copy ported from the mock; register a `landing-v3` page key (keep `landing`/`regular` keys intact — deletion happens in step 02).
- Add a guest-safe teaser mapper (route-level helper or `apps/web/app/lib/landing-teasers.ts`): `listUpcomingEvents(db, { limit: 3 })` → `LandingLiveTeaser[]` using locale title/description, Berlin date/time labels, partner-area place, primary image variant; strip `creditPrice`, capacity, redemption, and event URLs from the type.
- Wire `GET [locale]/index.tsx` to fetch teasers and pass them alongside v3 content, with static fallback (existing rail items minus credits) when DB is empty/unreachable so the build stays green. Leave `[locale]/regular.tsx` untouched.
- Add/extend unit tests for mapper guest-safety, ordering, limit, and empty fallback.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `static-marketing-pages`: Guest marketing home renders v3 content with a live-teaser rail (first 3 upcoming published events, guest-safe fields only) plus static fallback when no upcoming events exist.

## Impact

- **App (`apps/web`):** `app/lib/content/types.ts`, new `app/lib/content/landing-v3.ts`, `app/lib/content/index.ts` (new key), new or route-level `landing-teasers.ts` mapper, `app/routes/[locale]/index.tsx` loader wiring only (no visual rebuild this step).
- **DB (`packages/db`):** Read-only reuse of `listUpcomingEvents` in `catalog/events.ts` (published-only, `dateTime >= now`, soonest first) — no schema/migration.
- **Images:** Reuse existing primary-image variant helper for teaser `image`; no new variants, no base64 blobs.
- **Docs / source brief:** `.dev-plan/current-iteration/02-membership-landing-v3-01-content-and-teasers.md` (source step plan), `.dev-plan/unveiled-membership-v3.html` (copy source), parent guide `01-membership-landing-v3-parent-guide.md`.
- **Out of scope:** Visual rebuild / route swap (step 02); hard-deleting legacy `LandingPage`, `landing.ts`, `regular.ts`, legacy components, `/regular` routes (step 02); SEO/meta changes (step 03).
