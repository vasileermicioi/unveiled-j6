## Context

Steps 01–03 shipped bookings schema, Stripe activation, atomic `bookEvent`, SSR book/confirm, and Resend+ICS. Confirm shows redemption inline in `BookConfirmPage`; there is no `/bookings` route, no user booking list query, and no “My Tickets” nav link (though `PROTECTED_PREFIXES` / onboarding already treat `bookings` as gated). Membership Ladle only covers `view="guest"`.

Canonical inputs: step plan `.dev-plan/current-iteration/payments-booking-04-ui-surfaces-and-ladle.md`, `docs/product/sitemap/sitemap.md` (`/bookings?page=`), `docs/product/extras/pagination-and-search.md` (page size **20**), `docs/product/ui/app-shell.md` (Member nav includes Bookings), `docs/product/ui/design-system.md` (page compositions → `apps/web` Ladle), `docs/product/features/booking.feature` (post-booking actions; no self-cancel).

## Goals / Non-Goals

**Goals:**

- Paginated SSR My Tickets list for the signed-in member (newest first, page size 20, empty state).
- Shared ticket/redemption UI reused by confirm and list rows.
- Member nav “My Tickets” wired (desktop + mobile).
- Ladle stories for booking confirm, ticket card, and membership checkout shells so Phase 6 is demable without Playwright.
- HeroUI-only markup; theme tokens; yellow backdrop; Work Sans; no credits-rollover claims.

**Non-Goals:**

- Playwright, staging deploy docs (step 05).
- Waitlist, profile/billing, admin cancel/export/comp UI.
- New Stripe/webhook or `bookEvent` behavior.
- Member self-cancel / refund controls.
- Moving booking page compositions into `packages/ui` (they stay in `apps/web`).

## Decisions

### 1. List query lives in `@unveiled/db` booking domain

```
packages/db/src/booking/
  list-user-bookings.ts   # listUserBookings({ userId, page, pageSize })
```

- Returns `{ items, total, page, pageSize }` where each item is booking + event summary fields needed by the card (at minimum: event `id`, `title`, `startAt`/`timezone`, `partnerName`, and booking redemption fields / `ticketsCount` / `status` / `createdAt`).
- Filter: `bookings.user_id = userId`; order `created_at DESC` (index `(user_id, created_at)` already exists).
- Default `pageSize = 20` (`BOOKINGS_PAGE_SIZE` constant, exportable).
- Use existing `createDb` (neon-http) for reads — no transaction required.
- Export from `packages/db/src/booking/index.ts` alongside `bookEvent`.

**Alternatives:** Ad-hoc query in the route — rejected (AGENTS: business logic in packages). New package — rejected.

### 2. SSR route + pagination mirror event-feed pattern

```
apps/web/app/routes/[locale]/bookings.tsx
apps/web/app/lib/bookings-list.ts          # parse page, clamp, redirect path
apps/web/app/components/booking/
  MyTicketsPage.tsx
  BookingTicketCard.tsx                   # shared list/confirm building block
  TicketRedemptionBlock.tsx               # code/voucher + copy + optional ICS/support
  BookingsPagination.tsx                  # or reuse a thin shared pagination if trivial
  BookConfirmPage.tsx                     # refactored to compose shared blocks
```

- Auth: already covered by `PROTECTED_PREFIXES` including `bookings`; route assumes session USER (ADMIN may hit route — show their bookings if any, or same empty list; do not add partner portal).
- `?page=` 1-indexed; omit `page` when ≤1 in links; out-of-range → clamp/redirect like `eventFeedPageRedirectPath`.
- Pagination UI: “Showing X–Y of Z” + prev/next `Link`s — works without JS. Prefer cloning `EventFeedPagination` shape over inventing infinite scroll.
- Empty state: HeroUI `Card` + copy pointing members toward Discover / events (match Saved empty-state tone).
- List is **read-only** — no cancel buttons, no mutation forms.
- Row CTA: link to `/:locale/events/:eventId/book/confirm?booking=:bookingId` for full confirm shell; optionally show compact redemption + copy on the card itself so browsing does not require a second click for the code. Prefer **card shows summary + redemption summary + link to confirm** (step plan); ICS download can stay primarily on confirm (card may link “View ticket” / open confirm).

**SEO:** `noindex` on `/bookings` per `seo-and-metadata.md` if the route sets meta — match other gated member pages.

### 3. Shared ticket/redemption components

Extract from current `BookConfirmPage`:

| Component | Responsibility |
|---|---|
| `TicketRedemptionBlock` | Label, code/voucher text, `CopyRedemptionButton` island, voucher external link, secret-desc copy |
| `BookingTicketCard` | Event title/partner/qty/date summary + redemption block (compact) + link to confirm |
| `BookConfirmPage` | Page chrome (title, subtitle, ICS primary CTA, back to event, support) composing the shared block |

Props stay presentational (locale, copy structs, booking/event fields, hrefs) so Ladle can mount without DB.

Copy: extend `booking-content.ts` / `copy.ts` with My Tickets strings (`myBookings`, empty state, pagination labels) from `content-i18n-inventory.md`; reuse confirm redemption keys.

### 4. Nav “My Tickets”

- Add `myBookings` to `apps/web/app/lib/copy.ts` (DE: Meine Tickets / EN: My Tickets).
- `AppNavbar` + `AppNavbarMenu`: for signed-in USER (same condition as Saved), show Bookings link → `localizedPath(locale, "bookings")` beside Saved.
- Pass through `AppShell` like `savedHref` / `savedCount` (bookings count optional — not required by spec; skip badge unless trivial).
- Update `AppNavbar.stories` if it documents USER extras.

### 5. Ladle ownership — all Phase 6 shells in `apps/web`

Per `design-system.md`: page compositions stay in `apps/web`. Document booking as an allowed page-level story group in `docs/product/ui/design-system.md` (one-line addition under allowed groups) so ownership stays honest.

Stories (port **61001** via `bun --filter @unveiled/web stories`):

| Story file | States |
|---|---|
| `BookConfirmPage.stories.tsx` | SECRET_CODE confirm; VOUCHER confirm (optional second story) |
| `BookingTicketCard.stories.tsx` | With code; empty/minimal redemption if needed |
| `MembershipInfoPage.stories.tsx` | Expand beyond guest: `checkout`, `active`, `frozen`, and optionally `error` |
| `BookEventPage.stories.tsx` (optional but recommended) | `view="past_due"` frozen book-gate messaging called out by the step plan |

Add `mockBooking` (+ event fixture) to `apps/web/app/components/stories/fixtures.ts`.

**Alternatives:** Put ticket card in `packages/ui` — rejected; it is booking-domain page UI, not a shared DS primitive. Primitives stay in `@unveiled/ui`.

### 6. Membership checkout shells for Ladle

`MembershipInfoPage` already exports `MembershipViewState`. Stories pass static `view` + `getPageContent` — no Stripe. Cover:

- `guest` (exists)
- `checkout` (signed-in start checkout)
- `active` (already-active)
- `frozen` (`UNPAID` payment-stopped messaging)
- Past-due: use `BookEventPage` `view="past_due"` story (not membership page — current product split)

No production behavior change required for membership unless extracting a tiny presentational tweak for story ergonomics.

### 7. Markup / theme audit

- HeroUI only on new surfaces; Tailwind layout-only.
- Primary/secondary CTAs: `button button--primary` / `button button--secondary`.
- Yellow page backdrop via shell; no grey.
- Grep new files for raw `<p>`, `<a>`, `<button>`, `<section>`, color utilities; fix before handoff.
- Do not introduce “credits roll over” copy.

## Risks / Trade-offs

- **[Confirm refactor regresses confirm UX]** → Mitigation: keep confirm copy/CTAs identical; shared block is presentational only; spot-check confirm after extract.
- **[List N+1 or heavy joins]** → Mitigation: single query with event join/select; page size 20.
- **[ICS on every list card clutter]** → Mitigation: confirm remains primary ICS surface; list emphasizes code + “View ticket” link.
- **[ADMIN navigating to /bookings]** → Mitigation: same query by session user id — empty or their bookings; no role-specific admin bookings UI this step.
- **[design-system.md story-group omission]** → Mitigation: document booking group in the same PR as stories.

## Migration Plan

1. Add `listUserBookings` + export; add list route + pagination helpers + My Tickets page.
2. Extract shared redemption/ticket components; refactor confirm to use them.
3. Wire nav + copy; add Ladle stories + fixtures; update design-system ownership line.
4. Run `bun run lint`, `bun run typecheck`, `bun run stories` (spot-check shells).
5. Rollback: remove route/nav/stories; DB list helper unused — no schema migration.

## Open Questions

- Whether list cards should embed full copy+ICS or only link to confirm — **default:** compact redemption + copy on card when `redemptionInfo` present; ICS + full support chrome on confirm only.
- Whether to show `CANCELLED` / `USED` bookings — **default:** list all statuses for the user (newest first) with status visible if non-`CONFIRMED`; do not hide unless product later filters. Prefer showing `CONFIRMED` prominently; cancelled rows may still appear for history.
- Bookings count badge in nav — **default:** omit (Saved already has count pattern; avoid extra query on every page).
