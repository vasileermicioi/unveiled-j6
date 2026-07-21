## Why

The membership page stacks two bordered cards (hero CTA + benefits list). QA marked the gray muted lines under the title for removal (`Full Access…`, `No hidden fees…`) and asked for one card, centered icons, and aligned icon/text rows (see `.dev-plan/manual-test-membership-page.png`). Members should see a single membership card with headline/CTA and perks; gray filler gone; perk icons centered and vertically aligned with their labels.

## What Changes

- Merge the hero `Card` and benefits `Card` into a single `Card` in `MembershipInfoPage.tsx` (headline + CTA + perk list in one surface).
- Stop rendering the muted `subtitle` and `guarantee` paragraphs on the checkout/guest hero (the crossed-out gray lines). Keep title, primary CTA, and `secure` line. Preserve `active` / `frozen` / `error` status messaging that is not the same gray filler.
- Fix perk row layout: vertical centering (`items-center`), fixed icon box with centered Lucide icons, tighten icon↔text alignment in theme CSS (`.membership-benefits__*` → rename/merge under the single-card class if needed).
- Trim unused content fields from `membership.ts` / types only if nothing else references them; otherwise leave strings unused rather than a wide content refactor.
- Update any Ladle story for `MembershipInfoPage` if present (stories already exist; ensure they reflect one-card layout).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `credits-subscription`: Membership page SHALL present upgrade headline, primary subscription CTA (or state-specific action), secure-payment note when relevant, and perk list inside a single card surface. Gray muted marketing subtitle/guarantee lines under the checkout title SHALL NOT be shown on checkout/guest views. Perk rows SHALL vertically center icons with their labels.

## Impact

- **UI:** `apps/web/app/components/marketing/MembershipInfoPage.tsx` (+ `MembershipInfoPage.stories.tsx`).
- **Copy:** `apps/web/app/lib/content/membership.ts`, `apps/web/app/lib/content/types.ts` (`MembershipCheckoutContent`) — stop rendering `subtitle`/`guarantee` on guest/checkout; trim fields only if unused elsewhere.
- **Theme:** `apps/web/app/styles/globals.css` — `.membership-hero`, `.membership-benefits*` merge/cleanup for single-card block.
- **Unchanged:** Stripe/pricing behavior; profile/onboarding (steps 04–05); yellow page backdrop; HeroUI-only markup.
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-03-membership-card-merge.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Depends on:** none (independent of steps 01–02)
- **Verification:** `bun run lint`, `bun run typecheck`; manual `/en/membership` (checkout) shows one card, no gray filler lines, aligned perk icons
