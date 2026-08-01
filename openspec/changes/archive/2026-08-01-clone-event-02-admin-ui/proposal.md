## Why

Step 01 shipped `cloneEvent` and removed `createEventSeries`, leaving the series admin route as a redirect stub and no replacement workflow. Admins need an SSR clone surface and series create UI/routes must be deleted so the app builds cleanly and cloning is the supported way to reuse event metadata for another occurrence.

## What Changes

- Add ADMIN-only SSR routes `/:locale/admin/events/:id/clone` (GET prefilled form + POST calling `cloneEvent`).
- Prefill from the source event; require a date/time for the new occurrence; for `VOUCHER_PROMO` / `VOUCHER_PDF`, require new inventory (create semantics). Reuse source primary image (no new upload required).
- Add Clone entry points on the Events list and/or event edit page.
- **BREAKING (admin UI):** Delete series create route(s), list CTA, `EventSeriesForm` components/islands/builders, and dead `newEventSeries*` copy keys.
- Fix compile/import fallout from series removal; leave Gherkin/sitemap/Playwright rewrites to step 03.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Add admin SSR clone page + entry points; remove series-create requirements (manual slots, date-range builder, series Markdown/image/weekday scenarios tied to series UI).
- `event-catalog`: Modify admin event SSR routes requirement — include clone; series create route SHALL NOT be offered.

## Impact

- **Routes:** new `apps/web/app/routes/[locale]/admin/events/[id]/clone.tsx`; delete `.../admin/events/series/new.tsx` (and series directory if empty).
- **UI:** `AdminEventsListPage.tsx` (remove series CTA; add Clone links — also edit page / table row actions as needed); remove `EventSeriesForm` component + island and any series-only builders.
- **Forms / parsers:** reuse create voucher inventory helpers and event form defaults mapping; clone POST calls `cloneEvent` (inventory applied in domain — do not double-apply).
- **Copy:** `admin-content.ts` — add clone labels/errors; remove unused series keys.
- **Domain (unchanged):** `@unveiled/db` `cloneEvent` / `CloneEventInput` (`dateTime` + optional `voucherInventory`).
- **Out of scope:** product Gherkin, sitemap, Playwright/coverage matrix, DEPLOYMENT product notes (03); partner portal.
- **Source brief:** `.dev-plan/current-iteration/clone-event-02-admin-ui.md`
- **Parent:** `.dev-plan/current-iteration/clone-event-parent-guide.md`
- **Depends on:** `clone-event-01-domain` (done)
- **Consumed by:** `clone-event-03-docs-and-e2e`
- **Verification:** `bun run lint`; `bun run typecheck`; manual smoke — clone SECRET_CODE with new date → new row; series URL gone; voucher clone demands inventory
