## Why

Discover’s Partner venues block still uses a multi-column address-card grid, which blocks the continuous logo marquee planned for this feature. This step replaces that layout with a logo-forward horizontal track (prefix + duplicated sequence) so step 02 can add seamless motion without rewriting structure.

## What Changes

- Keep the Partner venues eyebrow (“Partnerorte” / “Partner venues”) on Discover (`/:locale`).
- Replace the `sm:grid-cols-2 lg:grid-cols-4` address cards with a horizontal **viewport + track** of logo cells (logo image or initial-letter fallback).
- Duplicate the partner sequence in the DOM (two identical tracks or a doubled list) so step 02 can seamless-loop without restructuring.
- Name may be visually hidden / aria context; **do not** show address lines as primary marquee UI.
- Add BEM structure hooks in `globals.css` (e.g. `.discover-partners`, `__viewport`, `__track`, `__item`) — flat bordered surfaces, theme tokens only; no motion beyond optional `animation: none` baseline.
- Update `docs/product/ui/static-pages-content.md` § Partner venues to describe prefix + logo strip (not an address grid of up to 8).
- Preserve existing Discover partner data sourcing (`listPartners` limit 8 unless a fuller strip clearly needs a documented bump).

**Out of scope:** keyframes / infinite scroll (step 02), stories/e2e (step 03), admin partner UI, partner click-through pages, inspiration offset shadows / off-white band.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `static-marketing-pages`: Discover Partner venues section SHALL show the eyebrow prefix and a horizontal logo strip (logo or initial fallback), not a multi-column address-card grid as the primary layout.

## Impact

- **UI:** `apps/web/app/components/marketing/DiscoverPage.tsx` — partners block (~51+).
- **Theme CSS:** `apps/web/app/styles/globals.css` — replace/retire `.discover-partner-tile*` address-card styles with `.discover-partners*` track structure.
- **Mapper (read-only unless needed):** `apps/web/app/lib/catalog-mappers.ts` (`DiscoverPartnerTile`) — keep mapping in helpers; drop address from primary UI only.
- **Data:** `apps/web/app/routes/[locale]/index.tsx` — keep `listPartners({ limit: 8 })` unless strip fullness requires a documented limit change.
- **Product copy SoT:** `docs/product/ui/static-pages-content.md` § “Partner venues grid”.
- **Planning:** `.dev-plan/current-iteration/partner-venues-slider-parent-guide.md` — mark step 01 done after verification.
- **Depends on:** none (step 1).
- **Consumed by:** `partner-venues-slider-02-continuous-motion`.
- **Verification:** `bun run lint`, `bun run typecheck`; manual Discover — eyebrow visible, logos/initials in a horizontal strip, addresses no longer primary tile content.
