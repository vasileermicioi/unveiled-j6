# UI Component / Layout / Page Map (MVP)

Mapping aid for HeroUI rebuilds. Visual language: `design-tokens.md`. Ownership: `design-system.md`. Routes: `sitemap/sitemap.md`.

**Controls:** use HeroUI **Select** (and documented multi-select) — not Radio/Checkbox groups for MVP forms.

---

## Global / layout

| Component | Owner | Notes |
|---|---|---|
| Navbar / Header | `apps/web` | Slim marketing nav Discover + FAQ; guest auth Log in only; How it works / Membership / Sign up out of header and footer nav — see `app-shell.md` |
| Logo | `@unveiled/ui` | Three SVG tones — `assets-inventory.md`; Ladle stories under `packages/ui` |
| Footer | `apps/web` | Discover → `/:locale`; FAQ; legal column (no How it works / Membership) |
| Help / FAQ accordion | `apps/web` | HeroUI `Accordion` in `Card` |
| Cookie banner | `apps/web` island | Accept/decline; gates map tiles |

---

## Design-system primitives (`@unveiled/ui`)

### Logo

Three SVG tones (`black` / `white` / `yellow`) via public `/logos/*` paths. Ladle stories under **`packages/ui`**.

### EventCard

Fields (top → bottom): image (`medium-640` / `small-320` srcset), category badge, availability strip (capacity + ticket type on sm+; between image and title), title, partner name, date + Lucide `Calendar`, neighborhood + Lucide `MapPin`, credit price (large black number + smaller muted “credits” unit), save toggle (Lucide `Bookmark`, bordered; **signed-in only** — hidden for guests), primary CTA.

**Hover / focus (pointer + keyboard):** On `@media (hover: hover)`, `:hover` and `:focus-within` apply to the **whole card**: colorize the cover, reveal a yellow availability strip **in the card body** (space always reserved so the grid/partners below do not shift), hard offset `box-shadow` (8px / brand border color), and a slight `scale(1.02)` — both layout-neutral so siblings do not move. Image and strip are full-bleed to the card border. On `@media (hover: none)` (touch), the yellow availability strip stays visible without hover. `prefers-reduced-motion: reduce` disables image/strip/shadow/scale transitions. Ladle story `EventCard / Hover — availability visible` forces the reveal for theme review.

**CTA precedence (guest first):**

1. Not signed in → always “See details” / “Mehr sehen” (links to public `/events/:id`)
2. Signed in, sold out → “Waitlist”
3. Signed in, subscription not `ACTIVE` → “Unlock event”
4. Signed in, `ACTIVE` → “Book Now”

Ladle stories for all CTA states live under **`packages/ui`**. Theme Overview story: see `design-system.md`.

---

## Event discovery

| Surface | Route | Notes |
|---|---|---|
| **Discover home** | `/:locale` | Marketing + up to 6 upcoming EventCards; guest CTAs → public detail; auth CTAs → signup/login → `/events` |
| **Member feed** | `/events` | Filters (GET query params), pagination, EventCard grid; subscription gate banner |
| **Map** | `/events/map` | MapLibre + OSM island; cookie-gated |
| **Saved** | `/saved` | Member saved list |
| **Event detail** | `/events/:id` | **Public** SSR page; hero srcset; map + address; CTA to book/waitlist/login |

---

## Booking & membership

| Surface | Route | Notes |
|---|---|---|
| Book | `/events/:id/book` | Dedicated SSR page (not modal); full-bleed yellow treatment |
| Confirm | `/events/:id/book/confirm` | Redemption + ICS |
| Waitlist | `/events/:id/waitlist` | Join form |
| Membership / checkout | `/membership` | Stripe Billing (Phase 6+) |
| My Tickets | `/bookings` | List + empty state |
| Profile | `/profile`, `/billing`, `/preferences`, GDPR pages | Split SSR forms |

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

How it works, FAQ, legal pages — copy in `static-pages-content.md`. Discover content is locale home, not a separate `/discover` page.

---

## Post-MVP (do not build in MVP)

Partner portal UI, check-in UI, partner-scoped EventCard admin flows.
