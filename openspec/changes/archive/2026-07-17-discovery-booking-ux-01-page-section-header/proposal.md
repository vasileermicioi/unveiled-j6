## Why

Discover already ships the brand section header (muted uppercase eyebrow, large bold headline, full-width rule on yellow — `.dev-plan/1-page-header.png`), but FAQ, auth, member feed, saved events, and similar surfaces still invent one-off heroes (`FaqPage` stack, plain `Heading`, `PageHero` card). This step extracts that Discover pattern into one reusable composition so non-admin pages share one header language before later booking-surface UX work.

## What Changes

- Add `PageSectionHeader` (HeroUI `Surface` + `Paragraph` eyebrow + `Heading`) with optional `id` / `level`, plus a Ladle story.
- Move/rename theme styles from `.discover-events-heading` to a shared class (e.g. `.page-section-header`) in `globals.css`; Discover adopts the shared class (thin alias OK during migrate).
- Adopt on Discover live-preview header, FAQ page header, `AuthPageLayout`, member feed title, saved events title, and membership info header **only if** it currently uses an on-yellow heading stack (not a card hero).
- Add/adjust DE/EN eyebrow strings where missing (auth pages especially); optional supporting copy stays **below** the ruled header block.
- Keep `PageHero` for How it works / legal card heroes — do not remove or replace it in this step.
- OpenSpec delta under `platform-foundation` (shared ruled section-header requirement). Product Gherkin / charter wording updates stay in step 04; light content-module eyebrow edits are in scope here.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `platform-foundation`: Web app SHALL provide a reusable `PageSectionHeader` (eyebrow + headline + full-width rule on brand yellow) and use it on Discover, FAQ, and auth login/signup (and listed peer surfaces that adopt the pattern).

## Impact

- **UI:** `apps/web/app/components/marketing/PageSectionHeader.tsx` (new) + story; `DiscoverPage.tsx`, `FaqPage.tsx`, `AuthPageLayout.tsx`, `EventFeedPage.tsx`, `SavedEventsPage.tsx`; `MembershipInfoPage.tsx` only if applicable.
- **Theme CSS:** `apps/web/app/styles/globals.css` — shared `.page-section-header` (retire or alias `.discover-events-heading`).
- **Copy:** `apps/web/app/lib/auth-content.ts` (eyebrows); content modules / `event-feed-content` / saved-events copy as needed for eyebrows.
- **Contrast (unchanged):** `PageHero.tsx` remains the bordered card hero for How it works / legal.
- **Planning:** `.dev-plan/current-iteration/discovery-booking-ux-parent-guide.md` — mark step 01 done after verification.
- **Depends on:** none (step 1).
- **Consumed by:** `discovery-booking-ux-02-event-card-book-now` (ordering), `discovery-booking-ux-04-hardening`.
- **Verification:** `bun run lint`, `bun run typecheck`, Ladle/`stories` for `PageSectionHeader`; manual smoke on `/de`, `/de/faq`, `/de/login`, `/de/events`.
