# UI Component / Layout / Page Map (MVP)

Mapping aid for HeroUI rebuilds. Visual language: `design-tokens.md`. Ownership: `design-system.md`. Routes: `sitemap/sitemap.md`.

**Controls:** use HeroUI **Select** (and documented multi-select) — not Radio/Checkbox groups for MVP forms.

---

## Global / layout

| Component | Owner | Notes |
|---|---|---|
| Navbar / Header | `apps/web` | Slim marketing nav: Discover (guests / non-active) or Browse events (booking-eligible) + FAQ; guest auth Log in only; How it works / Membership / Sign up out of header and footer nav — see `app-shell.md` |
| Logo | `@unveiled/ui` | Three SVG tones — `assets-inventory.md`; Ladle stories under `packages/ui` |
| Footer | `apps/web` | Discover → `/:locale/discover` (no Browse events swap); FAQ; legal column (no How it works / Membership) |
| **PageSectionHeader** | `apps/web` | Default on-yellow page/section header: muted uppercase eyebrow + bold headline + full-width rule. Used on Discover, FAQ, auth, member feed/browse, book/confirm, waitlist join/cancel, Saved, My Tickets, and member account/profile pages (`/profile*`) — distinct from bordered `PageHero` card heroes and the membership marketing hero card |
| Help / FAQ accordion | `apps/web` | HeroUI `Accordion` in `Card` |
| Cookie banner | `apps/web` island | Accept/decline; gates map tiles |

---

## Design-system primitives (`@unveiled/ui`)

### Logo

Three SVG tones (`black` / `white` / `yellow`) via public `/logos/*` paths. Ladle stories under **`packages/ui`**.

### EventCard

Fields (top → bottom): image (`medium-640` / `small-320` srcset), category badge, title, partner name, neighborhood + Lucide `MapPin`, primary CTA. **Subscribed members only** (`subscriptionActive`): date + Lucide `Calendar`, and credit price (large black number + smaller muted “credits” unit). Guests and inactive members do **not** see date or credits on the card. Save toggle (Lucide `Bookmark`, bordered; **signed-in only** — hidden for guests). No availability / capacity yellow strip.

**Hover / focus (pointer + keyboard):** On `@media (hover: hover)`, `:hover` and `:focus-within` apply to the **whole card**: colorize the cover, hard offset `box-shadow` (8px / brand border color), and a slight `scale(1.02)` — layout-neutral so siblings do not move. Image is full-bleed to the card border. `prefers-reduced-motion: reduce` disables image/shadow/scale transitions. Cards in a grid stretch to equal row height. Ladle story `EventCard / Hover — colorized cover` forces the cover colorize for theme review.

**CTA precedence (guest first):**

1. Sold out → “Waitlist” / “Warteliste” (links to public `/events/:id` — no waitlist POST on the card)
2. Otherwise (guest, inactive, or `ACTIVE`) → “Book Now” / “Bin dabei” (always links to public `/events/:id` — never `/membership` or `/events/:id/book` from the card)

Membership unlock / login messaging lives on the **event detail** checkout card, not as a separate EventCard CTA label. Ladle stories for CTA states live under **`packages/ui`**. Theme Overview story: see `design-system.md`.

---

## Event discovery

| Surface | Route | Notes |
|---|---|---|
| **Guest marketing home** | `/:locale` | Guests only (signed-in → role home). Headline + phone + plan card + signup CTA + benefits |
| **Discover** | `/:locale/discover` | `PageSectionHeader` + admin-**featured** upcoming EventCards (not automatic catalog slice); empty featured state copy; Partner venues logo marquee (eyebrow + continuous strip; hidden when empty); Book Now / Bin dabei (or Waitlist) → public detail. Booking-eligible USER redirected to `/events`. |
| **Member feed** | `/events` | Booking-eligible USER only (non-active → Discover). `PageSectionHeader`; filters (GET query params), pagination, EventCard grid |
| **Map** | `/events/map` | Same audience gate as feed. MapLibre + OSM island; cookie-gated; marker popups expose a large close control (~44px hit target, keyboard-accessible) |
| **Admin Featured** | `/admin/featured*` | SSR list / search-add / remove-from-featured (keeps catalog event); see `admin-events.feature` |
| **Saved** | `/saved` | Member saved list |
| **Event detail** | `/events/:id` | **Public** checkout-focused SSR page (no auth): identity column (category // partner, title, description, location, large hero) + dark summary/action card. On **lg+**, identity and checkout card share a common top alignment; hero fills the identity column width and scales across sm/md/lg (not a permanently undersized inset). Close control is a Link (Discover / feed / safe `returnTo`), not a client modal. **Booking-eligible members only** see ticket quantity (max = `min(floor(credits ÷ creditPrice), remainingCapacity)`, creditPrice ≤ 0 → capacity-only), credit total, and DETAILS date/time chrome; guests and other non–eligible viewers omit ticket qty, credits, and date (JSON-LD `startDate` still for crawlers) and see unlock/membership CTAs instead. Qty on detail is navigation state only — **no** booking/ledger POST; credit charge stays on `/events/:id/book`. Below the fold: dense multi-column **DETAILS** metadata grid (EventCard-inspired density on md+) + **LOCATION** card with address and MapLibre map using a brand **pin marker** (not a black square); marker popups use the same large close control as `/events/map` (~44px hit target). |

---

## Booking & membership

| Surface | Route | Notes |
|---|---|---|
| Book | `/events/:id/book` | Dedicated SSR page (not modal); `PageSectionHeader` + form; full-bleed yellow treatment |
| Confirm | `/events/:id/book/confirm` | `PageSectionHeader` + redemption + ICS |
| Waitlist | `/events/:id/waitlist` | `PageSectionHeader` + join form (cancel pages same header pattern) |
| Membership / checkout | `/membership` | Stripe Billing (Phase 6+); **single** bordered marketing card with headline/CTA and **vertical** icon-bullet benefits list inside (not a second benefits card; not three-up perk cards). Checkout/guest views omit muted subtitle/guarantee marketing filler. |
| My Tickets | `/bookings` | `PageSectionHeader` + list + empty state |
| Profile | `/profile`, `/profile/details`, `/profile/billing`, `/profile/preferences`, GDPR pages | `ProfileLayout` (`PageSectionHeader` + `ProfileTabNav` reusing `.admin-tabs*`) + per-tab SSR panels; no stacked Account link card; no muted subtitle under the title |

---

## Onboarding

Four SSR steps: `/onboarding/age` → `interests` → `location` → `timing`. Prefer Select / multi-select patterns over Radio/Checkbox.

---

## Admin

| Area | Routes | Notes |
|---|---|---|
| Dashboard | `/admin` | Ops overview + demo seed control if present |
| Events | `/admin/events/*` | SSR CRUD, series, codes export; image upload |
| Partners (venues) | `/admin/partners/*` | Venue CRUD only — **no** portal-access / venue-QR pages in MVP |
| Users | `/admin/users/*` | Support actions as dedicated pages |
| Waitlist / bookings | `/admin/waitlist/*`, cancel, export | |

---

## Static / marketing

How it works, FAQ, legal pages — copy in `static-pages-content.md`. Guest marketing home is locale home; Discover is `/:locale/discover`.

---

## Post-MVP (do not build in MVP)

Partner portal UI, check-in UI, partner-scoped EventCard admin flows.
