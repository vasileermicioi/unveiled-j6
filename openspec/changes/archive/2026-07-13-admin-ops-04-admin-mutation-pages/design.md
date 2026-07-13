## Context

Steps 01–03 shipped Membership HQ domain APIs, capacity ops (`cancelBookingAsAdmin`, `listAdminWaitlistEntries`, `promoteWaitlistEntryAsAdmin`, `createCompTicket`), and read-only list/detail UI with stub links to mutation paths. Those paths still 404. Admin event delete/edit routes already show the SSR confirm + POST + on-page error pattern (`AdminFormError`, `guardAdminRoute`, `renderAdminPage`).

This is Phase 8 step 04 (`admin-ops-04-admin-mutation-pages`): wire dedicated mutation pages only — no new domain writers, no Playwright, no GDPR delete.

Product SoT: `docs/product/sitemap/sitemap.md` (routes already listed), `admin-users.feature`, `booking.feature`, `waitlist.feature`, `credits-subscription.feature`.

## Goals / Non-Goals

**Goals:**

- SSR GET + POST pages for adjust-credits, freeze/unfreeze, comp-ticket, refund under `/:locale/admin/users/:id/*`.
- SSR `/admin/waitlist` list (`eventId`, `status`, `page`) + `/admin/waitlist/:id/promote`.
- SSR `/admin/bookings/:id/cancel` with required reason; no auto-refund.
- Call existing package APIs only; map domain errors to on-page messages.
- Wire navigation from Membership HQ detail, waitlist list, and confirmed booking cancel entry points.
- HeroUI-only forms; Select for event/status; no Radio/Checkbox; ADMIN + `noindex`.

**Non-Goals:**

- `/admin/users/:id/delete-account` (→ `gdpr-rights-02`).
- Playwright / full Ladle polish (step 05).
- New domain functions or schema changes.
- `/admin/bookings/export` (separate sitemap item; not this step).
- Partner portal routes.

## Decisions

### 1. Mirror admin event delete/edit route shape

Each mutation route:

```
apps/web/app/routes/[locale]/admin/users/[id]/adjust-credits.tsx
apps/web/app/routes/[locale]/admin/users/[id]/freeze.tsx
apps/web/app/routes/[locale]/admin/users/[id]/comp-ticket.tsx
apps/web/app/routes/[locale]/admin/users/[id]/refund.tsx
apps/web/app/routes/[locale]/admin/waitlist/index.tsx
apps/web/app/routes/[locale]/admin/waitlist/[id]/promote.tsx
apps/web/app/routes/[locale]/admin/bookings/[id]/cancel.tsx
```

Pattern per mutation page:

1. `guardAdminRoute` on GET and POST.
2. Load context (member / booking / waitlist entry); 404 if missing.
3. GET: render confirm/form via `renderAdminPage` + `AdminPageShell`.
4. POST: parse form → call domain → on success `302` back to a sensible parent (member detail, waitlist list, or booking context); on error re-render same page with `AdminFormError`.

Small form components under `apps/web/app/components/admin/` (e.g. `AdminAdjustCreditsForm`, `AdminFreezeForm`, `AdminCompTicketForm`, `AdminRefundForm`, `AdminWaitlistListPage`, `AdminWaitlistPromotePage`, `AdminCancelBookingPage`).

**Rationale:** Matches existing delete confirm POST; keeps business logic in packages.

**Alternatives:** Client dialogs — rejected (SSR-only mutations hard rule).

### 2. Domain wiring (existing exports only)

| Page | Call |
|---|---|
| adjust-credits | `adjustMemberCredits(db, { userId, amount, description })` |
| freeze | If subscription `ACTIVE` → `freezeMember`; if `UNPAID` → `unfreezeMember` (`@unveiled/billing`). Show wrong-status as on-page error when neither applies. |
| refund | `refundMemberCredits(db, { userId, amount, description })` |
| comp-ticket | `createCompTicket(db, { userId, eventId, ticketsCount?, idempotencyKey, adminUserId })` — generate idempotency key server-side (`crypto.randomUUID()` or `admin-comp:{userId}:{eventId}:{uuid}`) |
| waitlist list | `listAdminWaitlistEntries(db, { eventId?, status?, limit, offset })` |
| promote | `promoteWaitlistEntryAsAdmin(db, { entryId, adminUserId })` |
| cancel | `cancelBookingAsAdmin(db, { bookingId, reason, adminUserId })` |

Pass `adminUserId` from session where the input type requires it. Map `AdminMemberError`, `AdminCapacityError`, `FreezeMemberError`, `BookingError`, `WaitlistError` to locale copy via a small mapper (extend `mapCatalogError` pattern or add `mapAdminOpsError`).

**Rationale:** Step plan forbids new domain APIs; packages already encode validation (required reason/description, no cancel refund, etc.).

### 3. Form fields and Select usage

- **Adjust credits:** integer amount (signed allowed), required description/reason text field.
- **Freeze:** confirm copy that reflects current action (freeze vs unfreeze) based on subscription status; optional note field only if feature requires — domain takes no reason today, so confirm + submit is enough.
- **Refund:** positive integer amount, required description.
- **Comp ticket:** HeroUI `Select` of bookable events (reuse `listEvents` with a practical limit / search-by-title if list is long — prefer upcoming/published events; tickets count default 1 via Select or number field). No Radio/Checkbox.
- **Waitlist filters:** GET form — optional `eventId` (text or Select), `status` Select (`WAITING` | `PROMOTED` | `CANCELLED` | empty), `page`; reuse `AdminPagination` / list query helpers (page size 25).
- **Promote / cancel:** confirm + required reason for cancel only (domain enforces).

### 4. Success redirects

| Mutation | Redirect |
|---|---|
| adjust / freeze / refund / comp | `/:locale/admin/users/:id` (member detail) |
| promote | `/:locale/admin/waitlist` (preserve filters via query if easy) |
| cancel | Prefer member detail if `booking.userId` known, else waitlist list or admin overview |

Optional `?ok=adjust-credits` (etc.) flash query for a one-line success Paragraph on the destination — same style as admin seed flash. Not required if redirect alone is clear; prefer a simple success query for smoke testing.

### 5. Navigation wiring

- Membership HQ detail already links adjust/freeze/comp/refund — leave hrefs; pages now exist.
- Add **Waitlist** admin tab (or Overview link) → `/admin/waitlist` so the list is discoverable without a bookmark.
- On member detail, add a short **Confirmed bookings** list using existing `listUserBookings` (filter/display CONFIRMED) with Link to `/admin/bookings/:id/cancel`. Keeps cancel reachable without a full bookings admin index (export remains out of scope).
- Waitlist table: each `WAITING` row → promote Link; show `skippedOnce` and status columns.

**Alternatives:** Cancel only via typed booking id URL — workable for smoke tests but poor UX; rejected as sole entry point.

### 6. Auth, SEO, i18n

- Every route: `guardAdminRoute` / ADMIN role; `renderAdminPage` already sets `robots: noindex`.
- Locale from URL param; all copy in `admin-content.ts` (de + en): titles, labels, errors, empty states, confirm bodies.
- Do **not** link delete-account.

### 7. Ladle

Minimal stories for new form/list compositions with fixture props (errors, empty waitlist, freeze vs unfreeze). Full e2e deferred to step 05.

## Risks / Trade-offs

- **[Freeze only from ACTIVE; unfreeze only from UNPAID]** → Page must choose action from current subscription status; show clear error if status is neither (e.g. PAST_DUE). Document Stripe interaction for operators (parent guide); no Stripe calls here.
- **[Cancel does not refund]** → Confirm copy MUST state credits are not returned; manual refund is a separate page.
- **[Comp ticket uses bookEvent]** → Capacity/eligibility errors surface as BookingError — map them for admins.
- **[Large event Select]** → If `listEvents` returns many rows, cap or filter to upcoming; document if Select becomes unwieldy (step 05 can harden).
- **[Idempotency on double-submit]** → Comp ticket requires key; generate per GET render (hidden field) or per POST. Prefer generate on POST to avoid stale keys; accept rare double-submit creating two comps if user double-clicks with two keys — optional: disable button via progressive enhancement later. Hidden key from GET is also fine if form is single-use.
- **[Waitlist promote out of queue]** → Domain already supports; confirm copy should say this may skip queue order.

## Migration Plan

1. Add admin-content strings + path helpers (`adminWaitlistPath`, cancel/promote path builders).
2. Add Waitlist tab (or nav link) + waitlist list/promote routes.
3. Add user mutation routes + forms; verify detail CTAs resolve.
4. Add booking cancel route; wire cancel links from member detail confirmed bookings.
5. Error mappers + success redirects.
6. `bun run lint` / `bun run typecheck`; manual smoke on seed data.
7. Mark step 04 done in `admin-ops-parent-guide.md`. Rollback = remove routes/components; no DB migration.

## Open Questions

- None blocking. Tab label default: “Waitlist” / “Warteliste” alongside Users. If product prefers waitlist only under Membership HQ without a tab, a single link from Users list/detail is acceptable — prefer a tab for discoverability matching Partners/Events/Users.
