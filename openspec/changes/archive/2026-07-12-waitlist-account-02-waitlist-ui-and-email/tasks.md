## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/waitlist-account-02-waitlist-ui-and-email.md`, parent guide non-goals, `docs/product/features/waitlist.feature`, sitemap waitlist routes, and this change’s `design.md` / specs
- [x] 1.2 Confirm step 01 exports exist (`joinWaitlist`, `cancelWaitlistEntry`, `listUserWaitlistEntries`, `processWaitlistForEvent`) and migration is applied locally
- [x] 1.3 Skim book route email-safe pattern (`sendConfirmationSafe` in `book.tsx`), `EventDetailPage` sold-out CTA, and admin `edit.tsx` `updateEvent` POST

## 2. Promotion email

- [x] 2.1 Add waitlist promotion content + `sendWaitlistPromotion` in `@unveiled/email` (redemption + ICS; subject/body distinguish waitlist promotion from normal booking confirmation)
- [x] 2.2 Export from package index; add unit test with mocked `fetchImpl` (no live Resend)
- [x] 2.3 Add a shared post-promote send helper in `apps/web` (mirror booking: skip/log when env unset; never throw into success path)

## 3. Waitlist SSR routes and components

- [x] 3.1 Build HeroUI `WaitlistJoinPage` (form with Select qty 1–3, confirmation/existing-status view, cancel link) under `apps/web/app/components/`
- [x] 3.2 Add `GET/POST` route `apps/web/app/routes/[locale]/events/[id]/waitlist.tsx` → `joinWaitlist`; auth redirect with `returnTo`; duplicate join shows existing status
- [x] 3.3 Build HeroUI `WaitlistCancelPage` (confirm + POST)
- [x] 3.4 Add `GET/POST` route `apps/web/app/routes/[locale]/waitlist/[id]/cancel.tsx` → `cancelWaitlistEntry` (owner only); auth-gated; handle not-found/forbidden

## 4. Sold-out CTA wiring

- [x] 4.1 Update `EventDetailPage` sold-out upcoming state: eligible members get waitlist join CTA; guests get sign-in with return to waitlist
- [x] 4.2 Update book failure path (`SOLD_OUT` / insufficient capacity): keep booking rejected; offer link to waitlist join (optional `?qty=` preserve)
- [x] 4.3 Audit new UI for HeroUI-only markup and theme tokens (no raw HTML; Tailwind layout only)

## 5. Capacity-increase hook + seed

- [x] 5.1 After successful admin event edit `updateEvent`, if `remainingCapacity` increased, call `processWaitlistForEvent` then send promotion emails for `promoted[]`; document call site (Phase 8 cancel must reuse)
- [x] 5.2 Add sold-out (zero-remaining) demo event to seed; comment stable title/id for step 05 `DEPLOYMENT.md`

## 6. Validation and handoff

- [x] 6.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 6.2 Run email package tests (promotion content/send mock) — pass without live Resend
- [x] 6.3 Manual smoke: join waitlist on sold-out seed event; increase capacity in admin edit; confirm entry `PROMOTED` + booking row (email optional if Resend unset)
- [x] 6.4 Confirm no profile/billing, `/admin/waitlist`, Playwright, or full Ladle suite was added
- [x] 6.5 Mark step 02 done in `waitlist-account-parent-guide.md`; note any new i18n strings for later inventory sync
