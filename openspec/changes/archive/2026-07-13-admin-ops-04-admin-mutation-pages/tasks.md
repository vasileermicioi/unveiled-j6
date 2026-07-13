## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/admin-ops-04-admin-mutation-pages.md`, parent guide, and this change’s proposal/design/specs
- [x] 1.2 Confirm domain exports (`adjustMemberCredits`, `freezeMember`/`unfreezeMember`, `refundMemberCredits`, `createCompTicket`, `listAdminWaitlistEntries`, `promoteWaitlistEntryAsAdmin`, `cancelBookingAsAdmin`, `listUserBookings`) and copy patterns from `admin/events/[id]/delete.tsx`

## 2. Shared admin UX — copy, paths, errors, nav

- [x] 2.1 Add de/en mutation + waitlist + cancel copy in `admin-content.ts` (titles, field labels, confirm bodies noting cancel does not refund, success/empty/error strings)
- [x] 2.2 Add path helpers (`adminWaitlistPath`, user mutation paths, booking cancel path) and a Waitlist tab (or equivalent discoverable nav link) in `admin-tabs.ts` / `AdminTabNav`
- [x] 2.3 Add `mapAdminOpsError` (or extend existing mapper) for `AdminMemberError`, `AdminCapacityError`, `FreezeMemberError`, `BookingError`, `WaitlistError`

## 3. Member mutation SSR pages

- [x] 3.1 Implement adjust-credits GET/POST route + form (amount + required reason → `adjustMemberCredits`; redirect to member detail)
- [x] 3.2 Implement freeze GET/POST route (ACTIVE→freeze / UNPAID→unfreeze; on-page error for other statuses)
- [x] 3.3 Implement refund GET/POST route + form (positive amount + reason → `refundMemberCredits`)
- [x] 3.4 Implement comp-ticket GET/POST route + form (event Select, optional tickets count, server idempotency key → `createCompTicket`)
- [x] 3.5 Verify Membership HQ detail CTAs resolve to these pages; leave delete-account unlinked

## 4. Waitlist admin list + promote

- [x] 4.1 Build waitlist list page/components with `eventId`/`status` filters (Select), pagination, status + `skippedOnce` columns, promote links for `WAITING` rows
- [x] 4.2 Add route `admin/waitlist/index.tsx` — `guardAdminRoute`, `listAdminWaitlistEntries`, `renderAdminPage` (`noindex`)
- [x] 4.3 Implement promote confirm/POST at `admin/waitlist/[id]/promote.tsx` → `promoteWaitlistEntryAsAdmin`; redirect to waitlist list with on-page errors on failure

## 5. Booking cancel + navigation wiring

- [x] 5.1 Implement `admin/bookings/[id]/cancel.tsx` confirm/POST with required reason → `cancelBookingAsAdmin` (no refund); confirm copy states credits unchanged
- [x] 5.2 On member detail, list confirmed bookings via `listUserBookings` with Links to cancel paths
- [x] 5.3 Surface domain errors as on-page `AdminFormError` messages across all mutation pages

## 6. Validation and handoff

- [x] 6.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 6.2 Smoke locally on seed: adjust credits, freeze/unfreeze, cancel booking (capacity/waitlist side effects), promote waitlist entry
- [x] 6.3 Mark step 04 done in `admin-ops-parent-guide.md`; note handoff for `admin-ops-05-ladle-e2e`; no `docs/product/` edits unless sitemap paths diverged
