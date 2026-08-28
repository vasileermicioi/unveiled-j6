## Context

Parent feature: Admin event bookings (`.dev-plan/current-iteration/admin-event-bookings-parent-guide.md`). See `proposal.md` for motivation.

Step 01 shipped `@unveiled/db` list + cancel-all. Today:

- `ADMIN_TAB_ORDER` has no `bookings`. `inferAdminTab` maps any `/admin/bookings` path (including `/:locale/admin/bookings/:id/cancel`) to `users`.
- Single cancel lives at `apps/web/app/routes/[locale]/admin/bookings/[id]/cancel.tsx` → `AdminCancelBookingPage` (HeroUI `TextArea`, redirects to member detail `?ok=cancel-booking`). Refund policy stays no-refund + waitlist promotion.
- Events catalog `AdminEventsTable` actions: edit, gallery, clone, delete, export codes. No per-event bookings link.
- `listEventsWithBookingStats` already returns confirmed/used/cancelled/waiting counts plus `refundableCredits` and `compConfirmedCount` for the confirm-page summary (no need to page all bookings to total credits).
- `cancelAllBookingsForEvent` returns `{ cancelled, refundedCredits, waitlistCancelled, skippedUsed }` only — no recipient emails.
- Booking confirmation / waitlist promotion send post-commit via `@unveiled/email` + `DAILY_CODES_FROM_EMAIL`; callers log Resend failures and never throw.
- Constraints: SSR-only mutations; HeroUI markup + Tailwind layout only; native `textarea`/`select` (hard rule 14); confirm is draft-exempt (hard rule 15); locale-prefixed routes; `guardAdminRoute`; packages never depend on `apps/web`.

## Goals / Non-Goals

**Goals:**

- Bookings tab + path helpers + `inferAdminTab` so `/admin/bookings*` and `/admin/events/:id/bookings*` highlight Bookings.
- Stats index, per-event list, Events-table Bookings action, cancel-all GET/POST confirm.
- Verbatim DE/EN keys from the step-plan copy table; `ok=cancel-all` flash.
- Email builders/senders; POST emails after a successful commit; log-and-continue.
- `AdminTabNav` Bookings Ladle story. Lint, typecheck, and `bun test packages/email` green.

**Non-Goals:**

- Playwright / canonical Gherkin / sitemap / pagination extras / coverage matrix (03).
- Changing `cancelBookingAsAdmin` refund or promotion behavior.
- Event unpublish/delete after cancel-all; CSV export routes; `cancelled_by`; new env vars.
- HeroUI `Select` / `TextArea` / `Checkbox` for cancel-all reason or status filter.
- `FormDraftPersistence` on the confirm page.

## Decisions

1. **Tab order and `inferAdminTab` prefix order**
   - **Choice:** Add `"bookings"` to `AdminTab` and insert it in `ADMIN_TAB_ORDER` immediately after `"events"`. Path helpers: `adminBookingsPath(locale)` → `admin/bookings`; `adminEventBookingsPath(locale, eventId)` → `admin/events/${id}/bookings`; `adminEventBookingsCancelAllPath(locale, eventId)` → `admin/events/${id}/bookings/cancel-all`. In `inferAdminTab`, check `/admin/events/` + `/bookings` (per-event list and cancel-all) **before** the generic `/admin/events` Events tab; check `/admin/bookings` **before** the Users fallthrough. Single cancel (`/admin/bookings/:id/cancel`) therefore highlights Bookings.
   - **Rationale:** Step plan: stop mapping `/admin/bookings` to `users`; per-event bookings must not look like the Events catalog.
   - **Alternatives:** Keep single-cancel on Users (rejected — step plan says Bookings). Put the tab after Users (rejected — after Events).

2. **Routes stay SSR; lists are GET query-string pagination**
   - **Choice:** New files:
     - `apps/web/app/routes/[locale]/admin/bookings/index.tsx` (GET only)
     - `apps/web/app/routes/[locale]/admin/events/[id]/bookings/index.tsx` (GET only)
     - `apps/web/app/routes/[locale]/admin/events/[id]/bookings/cancel-all.tsx` (GET + POST)
     Existing `bookings/[id]/cancel.tsx` is unchanged aside from tab inference. Page size `ADMIN_LIST_PAGE_SIZE` (25). Index: `title`, `partner`, `page` via a small parser mirroring `parseAdminEventsListQuery` (dedicated filters, not combined `q`). Per-event: `status` (native `<select>` of booking statuses + empty = all) and `page`. Use `adminListPageRedirectPath` when `page` is past the last page. Filters are `<form method="get">`.
   - **Rationale:** Hard rules 1 + 14; pagination extras conventions; HonoX file routing already has `bookings/[id]/cancel.tsx`, so the index can coexist.
   - **Alternatives:** Island filters (rejected). Offset-only URLs (weaker SSR).

3. **Components: three pages + two tables; reuse AdminPageShell**
   - **Choice:**
     - `AdminEventBookingStatsTable` — index rows: event title, partner, datetime (Europe/Berlin), confirmed/used/cancelled/waitlist counts, remaining/total capacity; title links to per-event list.
     - `AdminEventBookingsTable` — columns: member (display name from `userProfile.first_name`/`last_name` plus email), status, occurrence datetime Europe/Berlin from `bookings.date_time`, tickets, credits charged (`total_credits`), created, actions. CONFIRMED → `adminBookingCancelPath`. Empty: `bookingsEmpty` / `bookingsIndexEmpty` verbatim.
     - `AdminCancelAllBookingsPage` — counts from `listEventsWithBookingStats({ eventId })` (one row): confirmed to cancel, `refundableCredits`, `compConfirmedCount`, `usedCount`, `waitingCount`. Copy: `cancelAllLead`, `cancelAllCatalogWarning`, `cancelAllSinglePathNote`, `cancelAllUsedNote`. Native `<textarea name="reason" required>`. Native submit. No `FormDraftPersistence`. When `confirmedCount === 0`, show `cancelAllEmpty` and **omit** the submit button (GET of cancel-all with no CONFIRMED is still 200, not a working POST).
     - Toolbar on the per-event list: Link to cancel-all **only if** `confirmedCount > 0` (from stats for that event, not the current page of 25).
   - **Rationale:** Stats row already has refund/comp aggregates from step 01 decision 4. Confirm must distinguish single-cancel (no refund, may promote) vs cancel-all (refund, close waitlist).
   - **Alternatives:** Reuse `AdminCancelBookingPage` (wrong copy and refund semantics). Sum credits from the current bookings page (undercounts).

4. **Events catalog Bookings action**
   - **Choice:** Add an `AdminTableActions` entry on `AdminEventsTable` with `label: copy.eventBookingsAction` linking to `adminEventBookingsPath`. Extend `AdminTableActionIcon` with `"bookings"` and a new `apps/web/public/icons/admin-bookings.svg` (same 16–24px stroke style as existing admin icons). Do not add a Bookings column.
   - **Rationale:** Other row actions are icon + `aria-label`; a fifth text button would break the actions cell.
   - **Alternatives:** Text-only Link (inconsistent). Reuse download icon (wrong meaning).

5. **Cancel-all POST: domain first, then emails; map errors**
   - **Choice:** `guardAdminRoute` → parse `reason` → `withAdminTxDb` → `cancelAllBookingsForEvent`. On success, send emails (decision 6) then `302` to `adminEventBookingsPath` + `?ok=cancel-all`. On `AdminCapacityError`, re-render confirm with `mapAdminOpsError` (already maps `INVALID_REASON` / `EVENT_NOT_FOUND`) and the posted reason. Missing event → same 404 pattern as event edit. Blank reason: domain rejects before touching rows; UI also keeps `required` on the textarea.
   - **Rationale:** Two-layer empty-reason guard matches single cancel. Success flash uses verbatim `okCancelAll`.
   - **Alternatives:** Client-only disable of submit (not enough). Email inside the DB transaction (rejected — parent: after commit only).

6. **Notification snapshots on the cancel-all result (additive domain)**
   - **Choice:** Extend `CancelAllBookingsForEventResult` with:
     - `cancelledMembers: { bookingId, userId, email, locale, totalCredits, ticketsCount, dateTime }[]` — one per previously CONFIRMED booking (including comps).
     - `closedWaitlistMembers: { userId, email, locale }[]` — one per WAITING entry closed (dedupe by `userId` if a user somehow had two WAITING rows; unique index should already prevent that).
     `locale` is `"de"` when `users.profile.language === "DE"`, `"en"` when `"EN"`, else `"de"`. Collect emails from the already-locked `users` rows for cancelled bookings; for waitlist, `RETURNING` `user_id` then load those users inside the same transaction (waitlist-only members were not in the booking lock set). Counts stay as today. Existing integration tests keep asserting counts; add a snapshot assertion that paid + comp bookings appear and USED does not.
   - **Rationale:** List queries are paginated (max 100). Snapshot-before-POST can miss a concurrent booking that cancel-all still cancels. Query-after-commit cannot tell this cancel-all apart from older CANCELLED rows. The transaction already has the cancelled set.
   - **Alternatives:** Web-layer `listEventBookings({ status: CONFIRMED, limit: 100 })` before POST (misses >100 and races). New `listCancelAllRecipients` helper (duplicate of data the write path already has).

7. **Email builders in `@unveiled/email`; web log-and-continue**
   - **Choice:** Mirror `booking-confirmation.ts` + `send-booking-confirmation.ts`:
     - `buildBookingCancellationContent` / `sendBookingCancellation` — no ICS. Subject DE `Buchung storniert: ${title}` / EN `Booking cancelled: ${title}`. Body MUST include a voided-ticket sentence. When `totalCredits > 0`, MUST include a credit-return sentence with that amount; when `0`, MUST NOT. Event title/when/partner in the member’s locale (`titleDe`/`titleEn` + Europe/Berlin datetime from the booking occurrence).
     - `buildWaitlistClosedContent` / `sendWaitlistClosed` — subject DE `Warteliste geschlossen: ${title}` / EN `Waitlist closed: ${title}`. Body states the waitlist is closed and they were not promoted. MUST NOT include a credit-return sentence.
     From-address: `DAILY_CODES_FROM_EMAIL`. Senders never throw on HTTP errors (return `{ ok: false }` like confirmation). Web helper `sendCancelAllEmailsSafe` in `apps/web/app/lib/` loops snapshots after commit, skips unset env with `console.warn`, logs per-recipient failures, swallows throws. Event payload: `getEventById` after commit for address/partner; occurrence datetime from the snapshot.
   - **Rationale:** Step verification: `bun test packages/email` asserts voided ticket + credit sentence when amount > 0; waitlist-closed has no credit sentence. Same post-commit policy as booking confirmation.
   - **Alternatives:** One combined email type (wrong for waitlist). Use admin request locale for every member (wrong for DE members when admin is on `/en`).

8. **Copy keys and success flash**
   - **Choice:** Add every key from the step-plan copy table to `AdminCopy` + DE/EN objects **verbatim**. Per-event list reads `ok=cancel-all` and shows `okCancelAll` via existing admin success-paragraph pattern (same as `?ok=cancel-booking` on member detail). Do not add email strings to `admin-content.ts` (they live in `@unveiled/email`).
   - **Rationale:** Hard rule 5 — match spec copy verbatim.
   - **Alternatives:** Approximate wording (rejected).

9. **Ladle**
   - **Choice:** Add `AdminTabNav / Bookings` story (`activeTab="bookings"`) next to the existing tab stories. No new table stories required this step (03 can add them).
   - **Rationale:** Step deliverable is the tab story only.
   - **Alternatives:** Stories for every new table (defer).

10. **Confirm page breadcrumbs**
    - **Choice:** Bookings tab → event bookings list → cancel-all title. Do not breadcrumb through Users.
    - **Rationale:** This path is event-scoped, unlike single cancel which started from member HQ.
    - **Alternatives:** Mirror single-cancel Users breadcrumbs (confusing).

## Risks / Trade-offs

- **[Risk] Email send after a large cancel-all delays the 302** → Mitigation: curated-catalog scale; sequential Resend like waitlist promotion; no background job in this feature (parent).
- **[Risk] Extending cancel-all result is a step-01 API change** → Mitigation: additive fields only; counts and transaction semantics unchanged; existing tests stay green.
- **[Risk] `inferAdminTab` `/admin/events/.../bookings` matching gallery/edit** → Mitigation: require the `/bookings` segment (path includes `/admin/events/` and `/bookings`), not a prefix of `/admin/events` alone.
- **[Risk] HeroUI `TextArea` copy-paste from single cancel** → Mitigation: native `<textarea>` + `Label` / `Surface` chrome only (hard rule 14).
- **[Risk] Resend failure looks like cancel failed** → Mitigation: always redirect on domain success; flash success copy; log email errors.
- **[Trade-off] Waitlist-only events have no cancel-all toolbar** → Accepted: toolbar requires confirmed count > 0; waitlist-only rows still appear on the Bookings index.

## Migration Plan

1. Tab + copy + `inferAdminTab` (safe; no new routes yet).
2. Index + per-event list + Events action (read-only).
3. Extend cancel-all result; add email package; wire confirm GET/POST.
4. Ladle story; `bun run lint` / `typecheck` / `bun test packages/email`.
5. Mark step done in the parent guide. Canonical Gherkin/sitemap stay for 03.
6. Rollback: revert the web + email PR; domain snapshot fields unused is harmless. Cancelled bookings and refunds from a successful POST are not undone.

## Open Questions

- None blocking. Email subject wording is fixed in decision 7 so package tests have a stable assertion target.
