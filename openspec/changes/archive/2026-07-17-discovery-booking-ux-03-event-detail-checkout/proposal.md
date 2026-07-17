## Why

Step 02 already lands every card CTA on public `/:locale/events/:id`, but `EventDetailPage` is still a stacked marketing detail (hero, metadata cards, map, bottom CTA strip). Guests and members need a checkout-focused decision surface — bold event identity plus a dark summary/action card — so login, membership, waitlist, and SSR book next-steps are obvious without making the detail page itself charge credits.

## What Changes

- Redesign `EventDetailPage` into a two-column (stacking on mobile) checkout layout per `.dev-plan/2-event-details-checkout.png`:
  - **Identity column:** category // partner, large title, short description, rule, location label + address, larger hero image.
  - **Checkout card (dark/inverted):** tickets control, total credits (**GESAMT** / **TOTAL**), membership/auth notice, primary CTA, “Secure RSVP // No refunds” footer.
- Close control (**X**) as a Link (Discover for guests; member feed / referrer-safe `returnTo` when provided) — not a client modal.
- Restyle existing viewer CTA matrix into the dark card: guest login/signup with `returnTo`, eligible → `/events/:id/book` (optional `?qty=`), membership/past_due/waitlist/past as today.
- Ticket quantity on detail is navigation state only (no credit POST); charge remains on the dedicated SSR book form.
- Theme CSS (e.g. `.event-detail--checkout`) for dark card + typography; Tailwind for grid/gap only.
- Preserve JSON-LD + public indexing; update Ladle stories for guest / eligible / sold-out.
- Product SoT rewrites (`docs/product/`) deferred to `discovery-booking-ux-04-hardening`.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Public event detail becomes checkout-focused (identity + summary/action card, close Link, quantity affordance) while remaining unauthenticated and indexable per SEO rules.
- `booking`: Explicit requirement that the public detail page MUST NOT create bookings or ledger entries; quantity on detail only influences navigation into SSR book / auth `returnTo`.

## Impact

- **UI:** `apps/web/app/components/catalog/EventDetailPage.tsx` (+ `EventDetailPage.stories.tsx`); route `apps/web/app/routes/[locale]/events/[id].tsx` only for props/`returnTo`/qty wiring.
- **Islands:** reuse `TicketCountSelect` (or HeroUI steppers) — no radios/checkboxes.
- **Theme:** `apps/web/app/styles/globals.css` — checkout surface rules; yellow page backdrop unchanged.
- **Copy:** DE/EN strings for tickets, total, membership notice, secure RSVP, close aria-label.
- **Unchanged:** `/events/:id/book`, `/book/confirm`, booking domain charge path, Stripe membership UI, admin preview.
- **Depends on:** `discovery-booking-ux-02-event-card-book-now` (done).
- **Consumed by:** `discovery-booking-ux-04-hardening`.
- **Verification:** `bun run lint`, `bun run typecheck`; guest smoke (checkout card + login return); eligible smoke (CTA → book SSR POST); public GET remains ungated.
