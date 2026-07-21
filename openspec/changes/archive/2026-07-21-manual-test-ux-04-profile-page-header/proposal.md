## Why

Member surfaces such as Saved and My Tickets already use `PageSectionHeader` (eyebrow + headline). The account/profile stack still uses a plain `Heading` level-1 plus muted subtitle (see `.dev-plan/manual-test-profile.png`), so the member app chrome feels inconsistent. Align profile and sibling account pages to the shared header before step 05 adds tab navigation.

## What Changes

- Add locale `eyebrow` (and keep a headline) in profile/billing/GDPR copy modules for the main account page and each subpage that currently uses a raw H1 + muted subtitle intro.
- Replace those intro blocks with `PageSectionHeader` (`eyebrow` + `headline`) on: `ProfilePage`, `PreferencesPage`, `BillingPage`, `SecurityPage`, `DataExportPage`, `DeleteAccountPage`, `BillingCancelPage`.
- Drop the muted subtitle under the title so headers match Saved/Tickets (eyebrow + headline only). Essential instructional copy that lived only in a subtitle (e.g. cancel/export/delete context) may move into existing card body copy — not a second muted line under the header.
- Update profile Ladle stories if they assume the old H1 + muted subtitle intro.
- Update `docs/product/ui/` notes (component map / static pages) if account chrome is listed without `PageSectionHeader`.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-profile`: Account pages under `/:locale/profile*` SHALL use the shared `PageSectionHeader` pattern (eyebrow + headline) used by other member surfaces such as Saved and My Tickets, instead of a standalone heading plus muted subtitle-only intro.

## Impact

- **UI:** `apps/web/app/components/profile/{ProfilePage,PreferencesPage,BillingPage,SecurityPage,DataExportPage,DeleteAccountPage,BillingCancelPage}.tsx` (+ related `.stories.tsx`).
- **Copy:** `apps/web/app/lib/profile-content.ts`, `billing-content.ts`, `gdpr-content.ts` — add eyebrows; stop rendering page-level muted subtitles under the title.
- **Shared component:** reuse `apps/web/app/components/marketing/PageSectionHeader.tsx` (no API change expected).
- **Product docs:** `docs/product/ui/ui-component-map.md` / `static-pages-content.md` if account routes omit `PageSectionHeader`.
- **Unchanged:** form fields and POST handlers; membership page (step 03); tab navigation (step 05); HeroUI-only markup; theme tokens.
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-04-profile-page-header.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Depends on:** none (may proceed after or in parallel with 01–03; required before step 05)
- **Consumed by:** `manual-test-ux-05-profile-account-tabs`
- **Verification:** `bun run lint`, `bun run typecheck`; manual `/en/profile` header matches `/en/saved` and `/en/bookings` eyebrow/headline pattern
