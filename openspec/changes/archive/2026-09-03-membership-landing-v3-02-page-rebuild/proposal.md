## Why

Step 01 landed v3 content + guest-safe live teasers but the locale home still renders the old founding/deposit `LandingPage` with static credit-tagged rail and login links; guests see stale pricing and `/regular` duplicates the funnel. Rebuilding `/:locale` on `LandingPageV3` and hard-deleting `/regular` unifies conversion on one mock-faithful landing.

## What Changes

- Build `LandingPageV3` (+ `landing-v3/*` sections) from HeroUI primitives: hero gallery + 29 € offer card (17 credits, +5 extra, +1 bring-a-friend, join CTA, cancel note — no deposit/invoice UI), live rail of up to 3 upcoming teasers, credits / flexibility-partners / community / final-CTA sections per mock.
- Rebuild rail so cards are NOT links: no credit tags, no `href` to `/events/:id`, no guest-hidden details; only clickables are registration CTAs to `/:locale/signup`.
- Point `apps/web/app/routes/[locale]/index.tsx` at `LandingPageV3`; keep guest-only guard and bare `/` 302 unchanged.
- **BREAKING** Hard-delete (git rm, no archive): `apps/web/app/routes/[locale]/regular.tsx` and `apps/web/app/routes/regular.tsx` (both now 404); `apps/web/app/components/marketing/LandingPage.tsx` + superseded `landing/*` sections; `apps/web/app/lib/content/landing.ts` + `regular.ts` (repoint `landing` PageKey at v3, remove `regular` PageKey); `LandingPage.legacy.tsx` + `landing.legacy.ts`; dead `landing.legacy` Ladle stories and `.guest-home*` theme blocks. Fix all imports so typecheck is green.

## Capabilities

### New Capabilities

- None — this step composes existing v3 content/teaser models into a page; no new spec domain.

### Modified Capabilities

- `static-marketing-pages`: single v3 landing on locale home; `/regular` hard-deleted (404); rail cards signup-only with no credit prices or detail links.

## Impact

- Affected code: `apps/web/app/components/marketing/LandingPageV3.tsx` (new) + `landing-v3/*` sections, `apps/web/app/routes/[locale]/index.tsx`, deleted `/regular` routes, deleted legacy landing components/content keys, `apps/web/app/styles/globals.css` (`.landing-*` theme cleanup), `apps/web/app/islands/LandingImageGallery.tsx` (reuse-or-delete).
- APIs/systems: none — SSR-only, no new endpoints, no Stripe/billing, no image-pipeline changes (R2/seed variants only, no base64).
- Consumers: step `membership-landing-v3-03-hardening` (SEO, stories, e2e, docs) builds on this; member `/events` feed and `/:locale/discover` untouched.
