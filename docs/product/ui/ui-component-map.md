# UI Component / Layout / Page Map (MVP)

Mapping aid for HeroUI rebuilds. Visual language: `design-tokens.md`. Ownership: `design-system.md`. Routes: `sitemap/sitemap.md`.

**Controls:** prefer **native** HTML choice/number/date/file controls (`select`, checkbox/radio/number/date/time/file inputs); HeroUI for text fields, buttons, and layout. Exceptions: image/Pica, map/geo, `@better-auth-ui/*` — see `design-system.md` Form controls.

---

## Global / layout

| Component | Owner | Notes |
|---|---|---|
| Navbar / Header | `apps/web` | Slim marketing nav: Discover (guests / non-active) or Browse events (booking-eligible) + FAQ; **ADMIN omits Discover/FAQ**; guest auth Log in only; How it works / Membership / Sign up out of header and footer nav — see `app-shell.md` |
| Logo | `@unveiled/ui` | Three SVG tones — `assets-inventory.md`; Ladle stories under `packages/ui` |
| Footer | `apps/web` | Guest/member: Discover → `/:locale/discover` (no Browse events swap) + FAQ; **ADMIN omits Navigation column**; legal (Impressum / Privacy / Terms) + contact remain (no How it works / Membership) |
| **PageSectionHeader** | `apps/web` | Default on-yellow page/section header: muted uppercase eyebrow + bold headline + full-width rule. Used on Discover, FAQ, auth, member feed/browse, book/confirm, waitlist join/cancel, Saved, My Tickets, member account/profile pages (`/profile*`), and admin `AdminPageShell` titles (eyebrow Admin/Verwaltung) — distinct from bordered `PageHero` card heroes and the membership marketing hero card |
| Help / FAQ accordion | `apps/web` | HeroUI `Accordion` in `Card` |
| Legal pages | `apps/web` | `LegalPage` + `help-section` card + shared `FaqAccordion`; foreground body (not muted) |
| Cookie banner | `apps/web` island | Accept/decline; gates map tiles |

---

## Design-system primitives (`@unveiled/ui`)

### Logo

Three SVG tones (`black` / `white` / `yellow`) via public `/logos/*` paths. Ladle stories under **`packages/ui`**.

### EventCard

Fields (top → bottom): image (`medium-640` / `small-320` srcset), category badge, title, partner name, zip code + Lucide `MapPin`, primary CTA. **Subscribed members only** (`subscriptionActive`): **next upcoming** datetime (denormalized `date_time`) + Lucide `Calendar`, and credit price (large black number + smaller muted “credits” unit). Guests and inactive members do **not** see date or credits on the card. Save toggle (Lucide `Bookmark`, bordered; **signed-in only** — hidden for guests). No availability / capacity yellow strip. Country/city need not dominate the card while the product is Berlin-only.

**Hover / focus (pointer + keyboard):** On `@media (hover: hover)`, `:hover` and `:focus-within` apply to the **whole card**: colorize the cover, hard offset `box-shadow` (8px / brand border color), and a slight `scale(1.02)` — layout-neutral so siblings do not move. Image is full-bleed to the card border. `prefers-reduced-motion: reduce` disables image/shadow/scale transitions. Cards in a grid stretch to equal row height. Ladle story `EventCard / Hover — colorized cover` forces the cover colorize for theme review.

**CTA precedence (guest first):**

1. Sold out → “Waitlist” / “Warteliste” (links to public `/events/:id` — no waitlist POST on the card)
2. Otherwise (guest, inactive, or `ACTIVE`) → “Discover” / “Entdecken” (always links to public `/events/:id` — never `/membership` or `/events/:id/book` from the card). Image and title are also links to the same detail URL.

Membership unlock / login messaging lives on the **event detail** checkout card, not as a separate EventCard CTA label. Ladle stories for CTA states live under **`packages/ui`**. Theme Overview story: see `design-system.md`.

---

## Event discovery

| Surface | Route | Notes |
|---|---|---|
| **Guest marketing home** | `/:locale` | Guests only (signed-in → role home). Headline + phone + plan card + signup CTA + benefits |
| **Discover** | `/:locale/discover` | `PageSectionHeader` + admin-**featured** EventCards including past featured (not automatic catalog slice; no upcoming-only filter); empty featured state copy; Partner venues logo marquee from admin-curated `featured_partners` (up to 8 by `sort_order`; eyebrow + continuous strip; hidden when empty — not first N of all partners); Discover / Entdecken (or Waitlist) → public detail. Booking-eligible USER redirected to `/events`. |
| **Member feed** | `/events` | Booking-eligible USER only (non-active → Discover). `PageSectionHeader`; filters (GET query params), pagination, EventCard grid |
| **Map** | `/events/map` | Same audience gate as feed. MapLibre + OSM island; cookie-gated; marker popups show **next upcoming** datetime plus a large close control (~44px hit target, keyboard-accessible) |
| **Admin Featured events** | `/admin/featured*` | Tab label **Featured events** / **Empfohlene Events**. SSR list: table-equivalent rows (thumb, title, partner, date) with drag reorder + Save order POST and native-checkbox bulk remove → `/admin/featured/remove?eventIds=` (keeps catalog event); no gallery-manage shortcut. Search-add (`AdminFeaturedAddResults`) with Events-list-style filters (title/partner/language; language matches spoken or subtitle), column sort, Languages + Subtitles columns, Reset filters; list + add-results rows show primary-image thumbs (`small-320.webp` via `buildEventImageUrls`) or placeholder — missing/broken thumbs must not block select, drag, add, or remove; see `admin-events.feature` |
| **Admin Featured partners** | `/admin/featured-partners*` | Tab label **Featured partners** / **Empfohlene Partner**. Gallery-style grid: drag reorder + Save order POST, checkbox multi-select → SSR remove confirm (keeps catalog partners); search-add unchanged; see `admin-partners.feature` |
| **Saved** | `/saved` | Member saved list |
| **Event detail** | `/events/:id` | **Public** checkout-focused SSR page (no auth). On **lg+**: (1) identity (category-only eyebrow → title → location) \| dark summary/action card; then full-width primary hero frame with a horizontally centered, non-stretch-to-fill image (`max-width: 100%` downscale OK; theme-owned); when `images.credit` is non-empty, a dark footer note on the hero shows the stored string as-is (no auto Foto:/Photo: prefix) and the hero `<img>` `alt`/`title` include that credit; then **Markdown description** via `MarkdownContent` (GFM; no `rehype-raw`). Partner logo thumbnail + name live in the **DETAILS** card (native `alt` includes the logo credit in parentheses and `title` is the credit when the logo’s `images.credit` is non-empty; no visible caption under the thumb; not in the identity strip, not overlaid on the hero). When the hosting partner has `has_opening_hours` true with a valid weekly schedule that includes at least one open weekday, the same DETAILS attribution block lists **working days only** (closed weekdays omitted), Monday→Sunday among remaining days, as `HH:MM – HH:MM` in Europe/Berlin wall times for the active locale; when hours are disabled/null/malformed or every weekday is closed the list is omitted. Hours are ungated (guests and members). DETAILS Accessibility / Barrierefreiheit is sourced from the hosting partner’s `barrier_free` (`true` → Barrier-free / Barrierefrei; unset → Not specified / Keine Angabe), also ungated. Mobile stacks: title → location → checkout → image → description → below-fold. Meta/JSON-LD description uses plain-text extraction from Markdown. Close control is a Link (Discover / feed / safe `returnTo`), not a client modal. **Booking-eligible members only** see ticket quantity (max = `min(floor(credits ÷ selected occurrence creditPrice), remainingCapacity)`, creditPrice ≤ 0 → capacity-only), credit total, and DETAILS Date chrome (Europe/Berlin; next upcoming emphasized): **date only** (unique Berlin calendar days) when the partner hours list is visible, date+time listing `date_times` when hours are omitted. When two or more **future** occurrences exist, the checkout card shows a native datetime `<select>` (`Datum und Uhrzeit` / `Date and time`) with full slot date+time; changing it updates unit credits, qty × credits, and max qty. Guests and other non–eligible viewers omit the dropdown, ticket qty, credits, and date (JSON-LD `startDate` = next upcoming for crawlers) and see unlock/membership CTAs instead. Qty on detail is navigation state only — **no** booking/ledger POST; credit charge stays on `/events/:id/book`. Below the fold: **DETAILS** (partner thumbnail + dense multi-column metadata on md+ — **no** Zip code / PLZ row; event target age groups are not collected) + **LOCATION** card with address whenever present (MapLibre map with brand **pin marker** only when derived coordinates exist; not a black square); marker popups use the same large close control as `/events/map` (~44px hit target). When the event has gallery photos (`event_gallery_images`), an end-of-page **Gallery / Galerie** section shows thumbnails; activating a thumb opens the `EventGallerySlider` island (prev/next/close); thumbs expose credit via native `alt` (appended) and `title` when non-empty; lightbox shows that photo’s credit as a footer note when non-empty. Zero gallery images → section omitted (no empty block). Gallery display is **not** gated on Discover featured membership. Primary hero remains `events.image_id` (OG/JSON-LD unchanged). Compact EventCards and map popups omit image credit. |

---

## Booking & membership

| Surface | Route | Notes |
|---|---|---|
| Book | `/events/:id/book` | Dedicated SSR page (not modal); `PageSectionHeader` + form; full-bleed yellow treatment; shows selected occurrence datetime and slot unit price; native datetime `<select>` when two or more future slots remain; POST `date_time` |
| Confirm | `/events/:id/book/confirm` | `PageSectionHeader` + `TicketRedemptionBlock` (per-ticket rows) + ICS |
| **TicketRedemptionBlock** (+ compact) | confirm + My Tickets cards | One row per `booking_tickets` ordinal; `SECRET_CODE` / `VOUCHER_PROMO` use **RevealSecretIsland** (masked by default, eye toggle, copy-while-masked); `VOUCHER_PDF` links to ownership-gated voucher.pdf route; promo website link when URL present |
| **RevealSecretIsland** | `apps/web/app/islands/` | Client-only show/hide for textual codes (UX shoulder-surfing protection; value still in props) |
| PDF voucher download | `/bookings/:bookingId/tickets/:ticketId/voucher.pdf` | Auth + booking ownership; proxies R2 PDF as attachment |
| Waitlist | `/events/:id/waitlist` | `PageSectionHeader` + join form (cancel pages same header pattern) |
| Membership / checkout | `/membership` | Stripe Billing (Phase 6+); **single** bordered marketing card with headline/CTA and **vertical** icon-bullet benefits list inside (not a second benefits card; not three-up perk cards). Checkout/guest views omit muted subtitle/guarantee marketing filler. |
| My Tickets | `/bookings` | `PageSectionHeader` + list + empty state; compact redemption block per card |
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
| Events | `/admin/events/*` | SSR CRUD; **create/edit** use a three-step `EventAdminForm` (General → Date & tickets → Image; HeroUI `ProgressBar` + step links; dedicated routes `/new`, `/new/dates`, `/new/image` and `/edit`, `/edit/dates`, `/edit/image`; inactive steps stay mounted so create Next POSTs prior fields). **Clone is not this wizard** (`/:locale/admin/events/:id/clone` — `CloneEventForm`, dates/inventory only; primary image reused; voucher inventory not copied), codes export; list: **Event title** / **Partner name** / **Language** filters (language matches spoken languages or subtitle language; preserves sort), column-header sort (`title`/`partner`/`date`/`created`/`capacity`; default last-created desc), **Reset filters**, **Languages** + **Subtitles** + **Created** columns; date column shows **next upcoming** datetime with optional `+N` when multiple; Date & tickets order is Timing mode first (All day hides clock times; Time slot shows them), then Capacity allocation (Shared vs Per date) plus a capacity number for every ticket type, then ticket type / secret or voucher inventory, then inline **range builder** (start/end × time slots, rebuild-from-scratch; partner opening hours default slots on create) and add/remove datetime rows with **per-row credits** and **per-row capacity when Per date**; totals below the list (credits, datetime capacity, and voucher available codes/tickets — theme danger when capacity and inventory disagree); primary image upload (`EventImageUpload` + `AdminImageVariantGallery` — five WebP tiles; optional **Bildnachweis** / **Image credit** `TextField` `image_credit` max 200; client errors block submit); description field = **MDXEditor** island (`EventDescriptionEditor`) submitting Markdown via form POST `description`; ticket type `SECRET_CODE` \| `VOUCHER_PROMO` \| `VOUCHER_PDF` — **PromoCodeInventoryFields** (TXT/CSV/paste preview island) and **PdfVoucherInventoryFields** (split master PDF with skip ranges, or multi-file one-ticket-each; ticket count preview + staged upload); inventory persists only via SSR form POST; voucher save requires datetime-capacity total to equal inventory count (mismatch reject; capacity field stays visible); **gallery manage** at `/admin/events/:id/gallery*` (grid + DnD reorder with Save order that also persists per-tile credits `image_credit_<uuid>`; gallery add per-file `image_credit_{index}`; checkbox select → SSR remove confirm; multi-add via Pica → five WebP; no hard count cap; entry from **Events list and/or event edit** for any catalog event; the Featured events list does not offer a gallery shortcut). Series create removed. |
| Partners (venues) | `/admin/partners/*` | Venue CRUD with **required** logo upload (`PartnerLogoUpload` + `AdminImageVariantGallery`; optional **Bildnachweis** / **Image credit** `TextField` `image_credit` — keeping the logo still allows changing credit); native **barrier-free** Yes/No select on create/edit (near opening hours; Yes → `partners.barrier_free` true, No → `NULL`); optional native **Bank details** / **Bankverbindung** textarea (`bank_details`, admin-only, for future accounting; empty → `NULL`); list: **Name** search (preserves sort), column-header sort (`name`/`created`/`events`=active count; default last-created desc), **Reset filters**, **Active events** + **Created** columns, toolbar **Export** → `/admin/partners/export` (period + **Event title** / **Partner name** filters; CSV respects filters); **no** portal-access / venue-QR pages in MVP |
| Users | `/admin/users/*` | Support actions as dedicated pages |
| Waitlist / bookings | `/admin/waitlist/*`, cancel, export | |

---

## Static / marketing

How it works, FAQ, legal pages — copy in `static-pages-content.md`. Guest marketing home is locale home; Discover is `/:locale/discover`.

---

## Post-MVP (do not build in MVP)

Partner portal UI, check-in UI, partner-scoped EventCard admin flows.
