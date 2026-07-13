## Context

Step 01 shipped `@unveiled/db` waitlist domain: `joinWaitlist`, `cancelWaitlistEntry`, `listUserWaitlistEntries`, `processWaitlistForEvent` (returns `{ promoted, skippedEntryIds, stoppedReason }`), and `promoteWaitlistEntry`. Auth middleware already treats `waitlist` as a reserved non-public segment under `/events/:id/*`.

Phase 6 book UX still hard-rejects on `SOLD_OUT` with copy only — `EventDetailPage` shows sold-out message without a join CTA; `book.tsx` maps `SOLD_OUT` to an error string. `@unveiled/email` has `sendBookingConfirmation` + ICS; no waitlist promotion sender yet. Admin capacity changes go through `updateEvent` in `packages/db/src/catalog/events.ts` (recalculates `remainingCapacity` when `totalCapacity` changes) and `apps/web/.../admin/events/[id]/edit.tsx` POST.

Product SoT: `docs/product/features/waitlist.feature`, booking sold-out scenarios, sitemap (`/events/:id/waitlist`, `/waitlist/:id/cancel`). Step plan: `.dev-plan/current-iteration/waitlist-account-02-waitlist-ui-and-email.md`.

## Goals / Non-Goals

**Goals:**

- SSR join + cancel routes and HeroUI components.
- Sold-out / insufficient-capacity waitlist CTAs on event detail and book failure path.
- `sendWaitlistPromotion` in `@unveiled/email` + post-promote send (log-only on failure).
- Capacity-increase → `processWaitlistForEvent` hook with documented call site.
- Seed sold-out demo event; lint/typecheck + email unit test green.

**Non-Goals:**

- Profile / billing / preferences (steps 03–04).
- `/admin/waitlist` or manual promote UI (Phase 8); `promoteWaitlistEntry` may stay unused by UI.
- Admin booking cancel UI (Phase 8) — processor export is enough.
- Playwright / full Ladle suite (step 05).
- GDPR routes; changing `bookEvent` transaction API.

## Decisions

### 1. Route and component layout

| Route | File | Behavior |
|---|---|---|
| `GET/POST /:locale/events/:id/waitlist` | `apps/web/app/routes/[locale]/events/[id]/waitlist.tsx` | Auth-gated; Select qty 1–3; POST → `joinWaitlist`; GET shows form or existing status |
| `GET/POST /:locale/waitlist/:id/cancel` | `apps/web/app/routes/[locale]/waitlist/[id]/cancel.tsx` | Auth-gated; load entry; owner-only; confirm + POST → `cancelWaitlistEntry` |

Page UI under `apps/web/app/components/` (e.g. `waitlist/WaitlistJoinPage.tsx`, `WaitlistCancelPage.tsx`) — HeroUI only; Tailwind layout only; yellow page backdrop via shell/theme.

Mirror book-route patterns: `getSessionIfConfigured`, `loginRedirect` with `returnTo`, `createTxDb`/`getCatalogDb` as appropriate, `robots: "noindex"`.

**Duplicate join:** on `created: false`, render confirmation/status view (position if cheap to compute — e.g. count of earlier `WAITING` for same event — or status-only if position is expensive; prefer a simple queue position from ordered list scoped to event).

**Cancel navigation:** join confirmation links to `/:locale/waitlist/:entryId/cancel`. Optional minimal list via `listUserWaitlistEntries` only if needed for discovery; do not build a full profile waitlist page (step 03 territory) — a link from confirmation is enough.

**Alternatives:** client modal join — rejected (SSR-only mutations). Combine cancel into event waitlist route — rejected (sitemap specifies `/waitlist/:id/cancel`).

### 2. Sold-out CTA wiring

**Event detail (`EventDetailPage`):** when upcoming + sold out (`remainingCapacity <= 0`) and viewer is `eligible`, show primary/secondary CTA to `/:locale/events/:id/waitlist` instead of dead-end sold-out copy only. Guests: sign-in CTA that returns to waitlist (or book — prefer waitlist return when sold out). Membership/past_due: keep existing membership/payment messaging; do not offer join if booking eligibility would fail at promote time for frozen states — **prefer:** offer waitlist join only for `eligible` (ACTIVE / CANCELLED_PENDING); guests → login; others → membership/payment paths as today.

**Book route:** on `BookingError` `SOLD_OUT`, render error **and** a Link/Button to waitlist join (same event, preserve requested qty as query `?qty=` optional). Do not auto-join on book failure — explicit join page POST only.

**Insufficient partial capacity:** same as sold-out (book rejects; offer waitlist with requested qty).

### 3. Promotion email

Add `packages/email/src/waitlist-promotion.ts` + `send-waitlist-promotion.ts` (or single module):

- Reuse redemption + ICS patterns from booking confirmation; subject/body MUST state the member was **promoted from the waitlist** (distinct from normal confirmation).
- Export `sendWaitlistPromotion` from `@unveiled/email`.
- Unit test with mocked `fetchImpl` (no live Resend) — mirror `email.test.ts`.

**Who sends:** after `processWaitlistForEvent` returns `promoted[]`, the **call site that triggered processing** (capacity hook / admin edit) loops promotions and calls `sendWaitlistPromotion` post-commit — same `sendConfirmationSafe` pattern as `book.tsx` (skip if env unset; log failures; never throw into the mutation success path).

Load user email + event fields needed for the template from DB after promote (booking result already has redemption fields). Prefer member `users` email from session API / public users table as booking path does.

**Do not** send from inside `@unveiled/db` waitlist domain (packages must not depend on email; keeps domain testable without Resend).

**Alternatives:** reuse `sendBookingConfirmation` verbatim — weaker UX (subject won’t mention waitlist); prefer thin wrapper/shared content builder with a `reason: "waitlist_promotion"` flag or dedicated copy functions.

### 4. Capacity-increase → `processWaitlistForEvent` call site

**Chosen:** after successful `updateEvent` in **admin edit POST** (`edit.tsx`), if `remainingCapacity` increased vs pre-update snapshot, call `processWaitlistForEvent(createTxDb(...), eventId)`, then send promotion emails for `result.promoted`.

Rationale:

- Keeps catalog `updateEvent` free of email/TxDb side effects and app env coupling.
- Phase 7 demo path is “admin raises capacity on edit form” — matches parent-guide risk mitigation.
- Document in code comment + this design that Phase 8 admin booking-cancel MUST also call the same processor.

**Also acceptable (implementer choice, pick one and document):** thin helper in `apps/web` e.g. `maybeProcessWaitlistAfterCapacityIncrease({ eventId, previousRemaining, nextRemaining })` used only from admin edit.

**Do not** silently call from every `updateEvent` consumer without an increase check (avoid spurious processor runs on title-only edits).

**Detect increase:** compare `existing.remainingCapacity` before update to returned event’s `remainingCapacity` (or recompute expected remaining from `recalculateRemainingCapacity` when `totalCapacity` input present).

**TxDb:** processor requires `TxDb` because `bookEvent` does — use `createTxDb` in the route after HTTP `updateEvent` commits (book-then-mark already spans its own transactions; calling processor after catalog update is correct).

### 5. Seed sold-out event

Extend demo seed (catalog seed module used by `scripts/seed-demo.ts`) with one upcoming event that has `totalCapacity > 0` and `remainingCapacity = 0` (or capacity filled by seed bookings if that is the only honest way — prefer directly setting remaining 0 if seed API allows). Comment with stable title e.g. `DEMO_SOLD_OUT_WAITLIST` for step 05 `DEPLOYMENT.md`.

If seed currently always sets `remainingCapacity = totalCapacity`, add an explicit override after create or a dedicated seed fixture flag.

### 6. Auth and robots

- Join/cancel: require session; owner check on cancel via domain.
- Keep `robots` noindex on waitlist mutation pages (already in `robots-config` for waitlist paths).
- Public event detail remains public; only the waitlist **action** route is gated.

## Risks / Trade-offs

- **[Processor after updateEvent is best-effort]** If promote emails fail mid-loop, earlier promotions already committed — acceptable (same as booking confirmation policy).
- **[Admin edit is only Phase 7 trigger]** Booking cancel UI is Phase 8 — document call-site obligation; demo uses capacity increase.
- **[Position display accuracy]** Approximate queue position can race; show “WAITING” + optional position as best-effort, not a strong SLA.
- **[Eligible-only waitlist CTA]** Members who join then become ineligible get `skipped_once` at promote time — correct per feature; UI may still allow join for ACTIVE members only to reduce doomed entries.
- **[Seed vs existing DB]** `--reset` or empty-catalog path required for sold-out fixture; document for staging.

## Migration Plan

1. Implement email sender + unit test.
2. Add waitlist routes/components; wire sold-out CTAs.
3. Hook admin capacity increase → process + email.
4. Seed sold-out event.
5. `bun run lint`, `bun run typecheck`, email package tests.
6. Manual smoke: join seed event → admin raise capacity → `PROMOTED` + booking (email optional if Resend unset).
7. Mark step 02 done in parent guide; hand off to step 05 for Playwright/`DEPLOYMENT.md`.

Rollback: remove routes/hooks; domain from step 01 remains valid. No schema migration in this step.

## Open Questions

- None blocking apply. If product copy inventory lacks waitlist DE/EN strings, add route-local copy modules now and note inventory sync for later (step plan cleanup).
