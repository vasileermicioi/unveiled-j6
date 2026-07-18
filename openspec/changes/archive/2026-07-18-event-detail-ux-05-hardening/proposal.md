## Why

Steps 01–04 shipped aligned checkout layout, dense DETAILS, brand map pin, and credit/capacity ticket bounds, but product SoT (`docs/product/`), Ladle stories, and Playwright still lag (notably booking.feature’s hard “1 and 3”). Without this pass, agents and e2e assert obsolete contracts and the parent **Event Detail UX** feature cannot be marked released.

## What Changes

- Update Gherkin: remove universal hard max of 3 for successful member bookings; document guest preview max 3 and member max = `min(floor(credits ÷ creditPrice), remainingCapacity)`.
- Update `ui-component-map.md` Event detail notes (aligned columns, responsive hero, dense DETAILS, pin marker, dynamic qty bounds).
- Expand Ladle stories for guest vs eligible qty max, metadata grid, and marker chrome if gaps remain.
- Add/adjust Playwright coverage with stable proximity selectors (DETAILS grid; guest qty disabled at 3; eligible member can select > 3 when seeded; map pin via DOM/CSS on `.event-map__marker` — skip if consent gate blocks CI unless fixture accepts consent).
- Append gaps/decisions entry if ticket-cap change is logged there by convention.
- Mark steps 01–05 done in the parent guide; note any deferred flakes.

**Out of scope:** Re-opening layout design debates; partner portal maps; staging deploy (operator) — one-line demo note in `DEPLOYMENT.md` only if needed; new product features beyond documenting 01–04.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `booking`: Product Gherkin ticket bounds — guest preview max 3; member max = credits ∩ capacity; SHALL NOT require a universal hard max of 3 for successful bookings when credits and capacity allow a higher count.
- `event-discovery`: Product docs and Gherkin for public event detail — aligned identity + summary card on large viewports; responsive hero; dense multi-column DETAILS; LOCATION map with pin marker; ticket qty affordance (guest max 3 / signed-in from credits+capacity); detail page still creates no bookings or ledger entries.

## Impact

- **Product docs:** `docs/product/features/booking.feature`, `event-discovery.feature`; `docs/product/ui/ui-component-map.md`; optionally `docs/product/extras/gaps-and-decisions.md`.
- **Stories:** `apps/web/app/components/catalog/EventDetailPage.stories.tsx`, `EventMap.stories.tsx` (or equivalent map stories).
- **E2E:** `e2e/specs/event-discovery.spec.ts`, `booking.spec.ts` (and static-pages only if detail assertions live there); follow `docs/product/testing/bdd-and-e2e.md` (proximity/layout; map pin may use stable marker class/aria — not pixel OCR).
- **Planning:** `.dev-plan/current-iteration/event-detail-ux-parent-guide.md` — mark 01–05 done; release criteria checkable against feedback PNGs.
- **Depends on:** `event-detail-ux-04-dynamic-ticket-limits` (and transitively 01–03) — shipped/archived.
- **Consumed by:** closes the Event Detail UX feature.
- **Source brief:** `.dev-plan/current-iteration/event-detail-ux-05-hardening.md`.
- **Verification:** `bun run lint`, `bun run typecheck`, targeted Playwright for discovery/booking/detail; manual release checklist vs feedback PNGs.
