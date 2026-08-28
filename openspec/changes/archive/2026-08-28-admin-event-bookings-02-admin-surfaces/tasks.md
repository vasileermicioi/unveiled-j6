## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/admin-event-bookings-02-admin-surfaces.md` (all 5 proposal sections + copy table + spec deltas), the parent guide product-decision table / emails / UX rows, and archived `admin-event-bookings-01-domain` design
- [x] 1.2 Confirm prerequisites exist: `listEventBookings`, `listEventsWithBookingStats`, `cancelAllBookingsForEvent`; `admin-tabs.ts` / `AdminTabNav.tsx` / `AdminEventsTable.tsx` / `AdminCancelBookingPage.tsx`; `admin/bookings/[id]/cancel.tsx`; `admin-content.ts`; `packages/email/src/send-booking-confirmation.ts`

## 2. Admin chrome and copy

- [x] 2.1 Add `bookings` to `AdminTab` and `ADMIN_TAB_ORDER` immediately after `events`; add `adminBookingsPath`, `adminEventBookingsPath`, `adminEventBookingsCancelAllPath`
- [x] 2.2 Fix `inferAdminTab`: `/admin/events/…/bookings` (list + cancel-all) before `/admin/events`; `/admin/bookings` (index + `/:id/cancel`) before Users fallthrough; stop mapping `/admin/bookings` to `users`
- [x] 2.3 Wire `AdminTabNav` Bookings tab (`copy.tabBookings`) in the same slot as `ADMIN_TAB_ORDER`
- [x] 2.4 Add every DE/EN key from the step-plan copy table to `admin-content.ts` **verbatim** (`tabBookings`, index/event titles, cancel-all copy, column/filter/empty/success keys)
- [x] 2.5 Add `AdminTabNav / Bookings` Ladle story (`activeTab="bookings"`)

## 3. Bookings index and per-event list

- [x] 3.1 Add GET `/:locale/admin/bookings` (`admin/bookings/index.tsx`): `guardAdminRoute`; parse `title`/`partner`/`page`; `listEventsWithBookingStats`; page size 25; clamp/redirect past last page
- [x] 3.2 Build `AdminEventBookingStatsTable` (HeroUI table, Tailwind layout only): title, partner, datetime Europe/Berlin, confirmed/used/cancelled/waitlist, capacity; row/title links to per-event list; empty `bookingsIndexEmpty`; GET filter form
- [x] 3.3 Add GET `/:locale/admin/events/:id/bookings`: load event (404 if missing); `listEventBookings` + stats for toolbar; native status `<select>` + page; columns member (name/email), status, occurrence Europe/Berlin, tickets, credits charged, created, actions
- [x] 3.4 CONFIRMED rows link to existing `adminBookingCancelPath`; toolbar **Cancel all confirmed bookings** only when stats `confirmedCount > 0`; empty `bookingsEmpty`; flash `ok=cancel-all` → `okCancelAll`
- [x] 3.5 Add Events catalog Bookings action on `AdminEventsTable` (`eventBookingsAction` → per-event list); extend `AdminTableActionIcon` with `"bookings"` + `public/icons/admin-bookings.svg`

## 4. Cancel-all confirm and notification snapshots

- [x] 4.1 Extend `CancelAllBookingsForEventResult` with `cancelledMembers` and `closedWaitlistMembers` (email, locale from `profile.language` DE/EN else `de`, credits/tickets/datetime as in design.md); collect inside the existing transaction; keep count fields unchanged
- [x] 4.2 Assert snapshots in unit/integration tests: paid + comp CONFIRMED included, USED omitted; waitlist WAITING included; empty reason still rejects before `db.transaction`
- [x] 4.3 Add GET+POST `/:locale/admin/events/:id/bookings/cancel-all` (`AdminCancelAllBookingsPage`): counts from `listEventsWithBookingStats({ eventId })`; verbatim lead + catalog / single-path / used warnings; native `<textarea name="reason">`; **no** `FormDraftPersistence`
- [x] 4.4 When `confirmedCount === 0`, show `cancelAllEmpty` and omit submit; POST calls `cancelAllBookingsForEvent` then emails; `mapAdminOpsError` on failure; success 302 to per-event list `?ok=cancel-all`

## 5. Emails

- [x] 5.1 Add `buildBookingCancellationContent` / `sendBookingCancellation` in `@unveiled/email` (no ICS; from-address same as confirmation). Subject DE `Buchung storniert: ${title}` / EN `Booking cancelled: ${title}`. Body includes voided-ticket sentence; credit-return sentence iff `totalCredits > 0`
- [x] 5.2 Add `buildWaitlistClosedContent` / `sendWaitlistClosed`. Subject DE `Warteliste geschlossen: ${title}` / EN `Waitlist closed: ${title}`. No credit-return sentence. Export from `packages/email/src/index.ts`
- [x] 5.3 Tests in `packages/email`: paid cancellation has void + credit-return; comp has void and no credit-return; waitlist-closed has no credit sentence. Senders return `{ ok: false }` on HTTP error and do not throw
- [x] 5.4 Web `sendCancelAllEmailsSafe` after successful POST: loop snapshots; skip unset `RESEND_API_KEY` / `DAILY_CODES_FROM_EMAIL` with warn; log per-recipient failures; never throw into the redirect path

## 6. Verification and handoff

- [x] 6.1 Run `bun run lint` — exit 0
- [x] 6.2 Run `bun run typecheck` — exit 0
- [x] 6.3 Run `bun test packages/email` — exit 0 including the new content builders
- [x] 6.4 Manual/dev: ADMIN opens `/de/admin/bookings`, drills into an event, submits cancel-all with a reason, lands on the list with success copy; USER is denied; blank reason re-renders confirm with an error; Events list shows Buchungen action; single-cancel still no-refund
- [x] 6.5 Mark step done in `.dev-plan/current-iteration/admin-event-bookings-parent-guide.md`; leave canonical sitemap/Gherkin/Playwright for `admin-event-bookings-03-hardening`
