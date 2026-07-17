## 1. Setup

- [x] 1.1 Study `.dev-plan/2-event-details-checkout.png` and the current `EventDetailPage` CTA matrix / viewer kinds
- [x] 1.2 Confirm `BookEventPage` + `TicketCountSelect` contract and whether `/book` already reads a `qty` query (add minimal support if missing)
- [x] 1.3 Confirm `buildDetailHeroSrc` / `buildDetailHeroSrcSet` are suitable for a larger identity-column hero

## 2. Layout & close control

- [x] 2.1 Restructure `EventDetailPage` into identity column (category // partner, title, description, rule, location) + larger hero image
- [x] 2.2 Add dark checkout card column; stack columns on mobile with CTA card usable above the fold when possible
- [x] 2.3 Add close Link (**X**) with aria-label → Discover for guests, safe `returnTo` or `/:locale/events` for members
- [x] 2.4 Move map and accessibility/languages/age/type metadata below the fold (or compact block); keep address text in identity; do not remove JSON-LD from the route

## 3. Checkout card behavior

- [x] 3.1 Add tickets control (`TicketCountSelect` or HeroUI steppers) + **GESAMT** / **TOTAL** credits display (`qty * creditPrice`); no form POST / ledger writes on detail
- [x] 3.2 Wire qty into eligible book href (`?qty=`) and guest login/signup `returnTo` (detail or book URL)
- [x] 3.3 Restyle guest / eligible / membership_required / past_due / sold-out / past CTAs into the dark card; preserve waitlist and membership behaviors
- [x] 3.4 Add membership/include notice + “Secure RSVP // No refunds” footer microcopy (DE/EN)

## 4. Theme & copy

- [x] 4.1 Add `.event-detail--checkout` (and children) rules in `globals.css` for dark card, yellow total/CTA harmony, typography; Tailwind for grid/gap only; keep brand-yellow page backdrop
- [x] 4.2 Add/adjust DE/EN strings for tickets, total, unlock CTA, membership notice, secure RSVP, close aria-label

## 5. Stories & validation

- [x] 5.1 Update `EventDetailPage.stories.tsx` for guest + eligible + sold-out (add membership/past_due if cheap)
- [x] 5.2 Run `bun run lint` (exit 0)
- [x] 5.3 Run `bun run typecheck` (exit 0)
- [x] 5.4 Manual smoke: guest detail → checkout card + unlock/login → return path works; eligible → book CTA → SSR POST still charges; public GET ungated
- [x] 5.5 Confirm mobile stacked layout and JSON-LD script still emitted by the route

## 6. Handoff

- [x] 6.1 Mark step 03 done in `.dev-plan/current-iteration/discovery-booking-ux-parent-guide.md`
- [x] 6.2 Note deferred map/metadata placement and `docs/product/` SoT updates for `discovery-booking-ux-04-hardening`
