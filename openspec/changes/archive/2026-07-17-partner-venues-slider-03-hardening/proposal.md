## Why

Steps 01–02 shipped Discover’s Partner venues logo marquee (structure + continuous CSS motion), but Ladle stories still show a single-partner Default, product docs still say motion is a “follow-up step,” and a11y/empty-state close-out is incomplete. Without this hardening pass, the parent **Partner Venues Slider** feature is not releasable.

## What Changes

- Update Discover Ladle stories for the partners marquee (multi-partner strip; empty list); document in story description that reduced-motion is a CSS `@media` fallback (not a separate story prop).
- Ensure the Partner venues section has a single accessible name (visible eyebrow + `aria-labelledby` / optional `aria-label` on the region).
- Spot-check duplicate-track a11y: clone sequence stays out of the accessibility tree (`aria-hidden` on clone cells / duplicate track); logos remain decorative (`alt=""`).
- Define empty-partner behavior: **hide the Partner venues section** when there are zero partners (no empty marquee, no new empty-copy string) — document in `static-pages-content.md`.
- Final product-doc sync: `static-pages-content.md` (marquee + motion + empty hide), `ui-component-map.md` Discover home row, and any i18n inventory lines that still imply an address-card “grid of up to 8 partner tiles.”
- Confirm proximity e2e that assert the partners eyebrow still hold; do not reintroduce address-card grid.
- Mark step 03 done and the parent feature complete after verification.

**Out of scope:** New partner detail routes, admin partner CRUD, header/event-card work, reworking marquee motion CSS unless a11y/empty-state requires a minimal markup tweak, inventing empty-state marketing copy for partners.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `static-marketing-pages`: Add **Partner marquee accessibility** — the partner logo marquee SHALL expose a single accessible section name; duplicated logo nodes used only for seamless looping SHALL be hidden from the accessibility tree; logo images SHALL be decorative when the venue name is otherwise available to AT. Empty partner list SHALL hide the Partner venues section (no broken marquee).

## Impact

- **UI:** `apps/web/app/components/marketing/DiscoverPage.tsx` — region labeling; hide section when `partners.length === 0`; verify clone `aria-hidden` / decorative `alt`.
- **Stories:** `apps/web/app/components/marketing/DiscoverPage.stories.tsx` — marquee + empty variants; story notes for reduced-motion.
- **Product docs:** `docs/product/ui/static-pages-content.md` § Partner venues; `docs/product/ui/ui-component-map.md` Discover home row; `docs/product/extras/content-i18n-inventory.md` only if outdated “grid of up to 8” / address-tile wording remains.
- **E2E (spot-check):** `e2e/specs/event-discovery.spec.ts` partners eyebrow assertion — proximity selectors only; adjust only if empty-hide or labeling breaks seeded Discover.
- **Planning:** `.dev-plan/current-iteration/partner-venues-slider-parent-guide.md` — mark step 03 done and feature complete.
- **Depends on:** `partner-venues-slider-02-continuous-motion` (merged/archived).
- **Consumed by:** closes the Partner Venues Slider feature.
- **Verification:** `bun run lint`, `bun run typecheck`, Discover stories via `bun run stories` (or package equivalent); manual AT skim — section announced once; logos decorative.
