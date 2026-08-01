## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/clone-event-02-admin-ui.md`, parent guide, and archived `clone-event-01-domain` design/API notes
- [x] 1.2 Confirm `cloneEvent` / `CloneEventInput` (`dateTime`, optional `voucherInventory`) and error codes (`EVENT_NOT_FOUND`, voucher assert failures)
- [x] 1.3 Inventory series UI files to delete: `series/new.tsx`, `EventSeriesForm` component + island, list CTA, `newEventSeries*` copy, any series-only builders

## 2. Clone SSR route and form

- [x] 2.1 Add DE+EN copy in `admin-content.ts` (clone page title/subtitle, submit, `cloneAction`, dateTime/inventory helpers, errors as needed)
- [x] 2.2 Implement `/:locale/admin/events/:id/clone` GET: ADMIN guard, load source event, render prefilled slim form (source summary + required dateTime + voucher inventory when applicable; show source image; no required image upload)
- [x] 2.3 Implement clone POST: parse dateTime + voucher payload; call `cloneEvent` only (do not double-apply inventory); map errors; redirect to edit of new id (or events list)
- [x] 2.4 Reuse create-mode voucher staging islands/helpers for inventory fields where applicable; keep partner/address out of mutating POST (domain copies source)

## 3. Entry points and series removal

- [x] 3.1 Add Clone action on `AdminEventsTable` row actions and on event edit page
- [x] 3.2 Remove series CTA from `AdminEventsListPage`
- [x] 3.3 Delete series route file(s), `EventSeriesForm` component/island, and unused series builders; grep-clean imports
- [x] 3.4 Remove dead `newEventSeries*` (and related unused) keys from `admin-content.ts`

## 4. Verification and handoff

- [x] 4.1 Run `bun run lint` — exit 0
- [x] 4.2 Run `bun run typecheck` — exit 0
- [x] 4.3 Manual smoke: clone SECRET_CODE with new date → new row; series URL/CTA gone; voucher clone without inventory rejected
- [x] 4.4 Confirm no admin UI path to series create
- [x] 4.5 Mark step done in parent guide; leave sitemap/Gherkin/Playwright for `clone-event-03-docs-and-e2e`; note change ID for PR/handoff
