## Why

The public event-detail primary image still forces fill-width framing (`width: 100%` / stretch-to-fill feel), so portraits and non-banner aspect ratios look distorted or over-expanded. Parent UX polish step 03 locks the contract: full-width rectangular frame, horizontally centered image, no stretch-to-fill (`max-width: 100%` downscale OK).

## What Changes

- Theme-owned hero CSS (and minimal markup only if needed) so the primary image sits in a full-width rectangular band, centered horizontally, preserving aspect ratio without stretch-to-fill.
- Update `ui-component-map` Event detail notes (+ gaps if the prior wording implied stretch/cover-fill) and EventDetail Ladle stories to match the non-stretch framing contract.
- Adjust Playwright only if an existing assertion hard-codes the old sizing behavior; otherwise leave e2e alone.
- Out of scope: gallery; image pipeline / variants; EventCard covers; `ux-polish-04`–`05`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-discovery`: Public event detail SHALL present the primary image in a full-width rectangular hero frame, horizontally centered, not stretched to fill the frame (`max-width: 100%` downscale allowed).
- `design-system`: Hero framing rules SHALL live in theme CSS; routes MUST NOT reintroduce ad-hoc stretch-to-fill utilities.

## Impact

- **Theme / UI:** `apps/web/app/styles/globals.css` (`.event-detail--checkout__hero` / `__hero-image`; retire or neutralize unused `.event-detail__hero-image` cover rules if still present); `EventDetailPage.tsx` markup only if centering needs a structural tweak (HeroUI `Surface` + `<img>` exception).
- **Docs / stories:** `docs/product/ui/ui-component-map.md` Event detail entry; optional `gaps-and-decisions.md` note; `EventDetailPage.stories.tsx`.
- **E2e:** `e2e/specs/event-discovery.spec.ts` only if old hero sizing was explicitly asserted.
- **Source brief:** `.dev-plan/current-iteration/ux-polish-03-event-detail-hero.md`
- **Parent:** `.dev-plan/current-iteration/ux-polish-parent-guide.md`
- **Depends on:** none (independently mergeable; preferred after 02 for delivery order only)
- **Consumed by:** none (next planned: `ux-polish-04-event-subtitles`)
- **Verification:** `bun run lint`; `bun run typecheck`; visual smoke — centered in full-width band, not stretch-filled
