# UI Component / Layout / Page Map (MVP)

Mapping aid for HeroUI rebuilds. Visual language: `design-tokens.md`. Ownership: `design-system.md`. Routes: `sitemap/sitemap.md`.

**Controls:** prefer **native** HTML choice/number/date/file controls (`select`, checkbox/radio/number/date/time/file inputs); HeroUI for text fields, buttons, and layout. Exceptions: image/Pica, map/geo, `@better-auth-ui/*` — see `design-system.md` Form controls.

---

## Global / layout

| Component | Owner | Notes |
|---|---|---|
| Navbar / Header | `apps/web` | Slim marketing nav: Discover (guests / non-active) or Browse events (booking-eligible) + FAQ; **ADMIN omits Discover/FAQ**; guest auth Log in only; How it works / Membership / Sign up out of header and footer nav — see `app-shell.md` |
| Logo | `@unveiled/ui` | Three SVG tones — `assets-inventory.md`; Ladle stories under `packages/ui` |
| Footer | `apps/web` | Guest/member: Discover → `/:locale/discover` (no Browse events swap) + FAQ; **ADMIN omits Navigation column**; legal + contact remain (no How it works / Membership) |
| **PageSectionHeader** | `apps/web` | Default on-yellow page/section header: muted uppercase eyebrow + bold headline + full-width rule. Used on Discover, FAQ, auth, member feed/browse, book/confirm, waitlist join/cancel, Saved, My Tickets, member account/profile pages (`/profile*`), and admin `AdminPageShell` titles (eyebrow Admin/Verwaltung) — distinct from bordered `PageHero` card heroes and the membership marketing hero card |
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
| **Discover** | `/:locale/discover` | `PageSectionHeader` + admin-**featured** EventCards including past featured (not automatic catalog slice; no upcoming-only filter); empty featured state copy; Partner venues logo marquee from admin-curated `featured_partners` (up to 8 by `sort_order`; eyebrow + continuous strip; hidden when empty — not first N of all partners); Book Now / Bin dabei (or Waitlist) → public detail. Booking-eligible USER redirected to `/events`. |
| **Member feed** | `/events` | Booking-eligible USER only (non-active → Discover). `PageSectionHeader`; filters (GET query params), pagination, EventCard grid |
| **Map** | `/events/map` | Same audience gate as feed. MapLibre + OSM island; cookie-gated; marker popups expose a large close control (~44px hit target, keyboard-accessible) |
| **Admin Featured events** | `/admin/featured*` | Tab label **Featured events** / **Empfohlene Events**. SSR list / search-add / remove-from-featured (keeps catalog event); see `admin-events.feature` |
| **Admin Featured partners** | `/admin/featured-partners*` | Tab label **Featured partners** / **Empfohlene Partner**. Gallery-style grid: drag reorder + Save order POST, checkbox multi-select → SSR remove confirm (keeps catalog partners); search-add unchanged; see `admin-partners.feature` |
| **Saved** | `/saved` | Member saved list |
| **Event detail** | `/events/:id` | **Public** checkout-focused SSR page (no auth): identity column (category // partner, title, description, location, large hero) + dark summary/action card. On **lg+**, identity and checkout card share a common top alignment; hero fills the identity column width and scales across sm/md/lg (not a permanently undersized inset). Close control is a Link (Discover / feed / safe `returnTo`), not a client modal. **Booking-eligible members only** see ticket quantity (max = `min(floor(credits ÷ creditPrice), remainingCapacity)`, creditPrice ≤ 0 → capacity-only), credit total, and DETAILS date/time chrome; guests and other non–eligible viewers omit ticket qty, credits, and date (JSON-LD `startDate` still for crawlers) and see unlock/membership CTAs instead. Qty on detail is navigation state only — **no** booking/ledger POST; credit charge stays on `/events/:id/book`. Below the fold: dense multi-column **DETAILS** metadata grid (EventCard-inspired density on md+) + **LOCATION** card with address and MapLibre map using a brand **pin marker** (not a black square); marker popups use the same large close control as `/events/map` (~44px hit target). When the event has gallery photos (`event_gallery_images`), an end-of-page **Gallery / Galerie** section shows thumbnails; activating a thumb opens the `EventGallerySlider` island (prev/next/close). Zero gallery images → section omitted (no empty block). Gallery display is **not** gated on Discover featured membership. Primary hero remains `events.image_id` (OG/JSON-LD unchanged). |

---

## Booking & membership

| Surface | Route | Notes |
|---|---|---|
| Book | `/events/:id/book` | Dedicated SSR page (not modal); `PageSectionHeader` + form; full-bleed yellow treatment |
| Confirm | `/events/:id/book/confirm` | `PageSectionHeader` + redemption + ICS |
| Waitlist | `/events/:id/waitlist` | `PageSectionHeader` + join form (cancel pages same header pattern) |
| Membership / checkout | `/membership` | Stripe Billing (Phase 6+); **single** bordered marketing card with headline/CTA and **vertical** icon-bullet benefits list inside (not a second benefits card; not three-up perk cards). Checkout/guest views omit muted subtitle/guarantee marketing filler. |
| My Tickets | `/bookings` | `PageSectionHeader` + list + empty state |
| Profile | `/profile`, `/profile/details`, `/profile/billing`, `/profile/preferences`, GDPR pages | `ProfileLayout`: `ProfileTabNav` (`.admin-tabs*`) **above** `PageSectionHeader`, then tab panel; tablist + header + content share admin-width `max-w-7xl` shell (tabs wrap). `/profile` = membership manage card (portal CTA / inactive checkout) — not credit wallet. No stacked Account link card; no muted subtitle under the title |

---

## Onboarding

Four SSR steps: `/onboarding/age` → `interests` → `location` → `timing`. Native checkbox/radio/select preference controls (themed in `globals.css`).

---

## Admin

| Area | Routes | Notes |
|---|---|---|
| **AdminPageShell** | `/admin/*` (authenticated admin pages) | Shared page chrome: breadcrumbs (optional) → `PageSectionHeader` (eyebrow Admin/Verwaltung + title + rule) → optional muted subtitle below rule → optional actions → card/overview children. Admin tab nav stays **above** the shell title (same order as member profile tabs). |
| Dashboard | `/admin` | Ops overview + demo seed control if present |
| Events | `/admin/events/*` | SSR CRUD, series, codes export; primary image upload; **gallery manage** at `/admin/events/:id/gallery*` (grid + DnD reorder with Save order + checkbox select → SSR remove confirm; multi-add via Pica; max 12; entry from **Featured** list only — not Events list or event edit) |
| Partners (venues) | `/admin/partners/*` | Venue CRUD only — **no** portal-access / venue-QR pages in MVP |
| Users | `/admin/users/*` | Support actions as dedicated pages |
| Waitlist / bookings | `/admin/waitlist/*`, cancel, export | |

---

## Static / marketing

How it works, FAQ, legal pages — copy in `static-pages-content.md`. Guest marketing home is locale home; Discover is `/:locale/discover`.

---

## Post-MVP (do not build in MVP)

Partner portal UI, check-in UI, partner-scoped EventCard admin flows.
