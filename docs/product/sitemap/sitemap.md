# Sitemap (MVP)

Legend: **Auth** = sign-in required. **Role** = required role beyond being signed in. All app routes are under `/:locale` (`de` | `en`) unless noted.

Locale is a **route segment**. Switching language re-navigates to the same path under the other locale (e.g. `/de/events/abc` ↔ `/en/events/abc`).

**Charter locks:** Guest marketing home = locale home; Discover at `/discover`; `/events/:id` is **public**; member feed `/events` is gated; partner portal is **post-MVP** (appendix only).

---

## Localization & crawlers

| Route | Auth | Notes |
|---|---|---|
| `/` | — | 302 → `/de` or `/en` by `Accept-Language` (fallback `de`) |
| `/robots.txt` | — | Static allow/disallow rules — see `extras/seo-and-metadata.md` |
| `/sitemap.xml` | — | Dynamic: marketing/legal locales + bookable public event detail URLs |

---

## Guest home, Discover & public marketing

**Guest marketing home is locale home.** `/:locale` renders the membership conversion landing (headline, phone mockup, plan card, benefits). **Discover** is `/:locale/discover` (admin-curated **featured events** + admin-curated **featured partners** Partner venues marquee — not an automatic catalog slice). Bare `/discover` **302** redirects to `/:locale/discover` via `Accept-Language`.

### Guest journey (Home → Discover → Events)

1. Guest lands on marketing home (`/:locale`) — CTA to `/signup`.
2. Navbar/footer **Discover** opens `/:locale/discover`.
3. Featured **EventCard** CTAs link to public `/events/:id` (“Discover” / “Entdecken”, or “Waitlist” / “Warteliste” when sold out); image and title are also detail links.
4. Path to the **full browse** experience: signup/login, complete onboarding, then an **active** (booking-eligible) subscription → member `/events`. Non-active members stay on Discover.
5. Guests do **not** get a public full upcoming-events list equivalent to `/events`.

| Route | Auth | Notes |
|---|---|---|
| `/:locale` | — | **Guest home** — membership marketing + signup CTA. Signed-in booking-eligible `USER` → `/events` (or onboarding); non-active `USER` → `/discover`; `ADMIN` → `/admin` |
| `/discover` | — | **302** → `/:locale/discover` |
| `/:locale/discover` | — | **Discover** — admin-featured events (including past featured) + Partner venues from admin-curated `featured_partners` (up to 8 by `sort_order`; section hidden when empty). Guests + non-booking-eligible `USER` OK; booking-eligible `USER` → **302** `/events`; `ADMIN` keeps access (QA) |
| `/how-it-works` | — | Static explainer |
| `/faq` | — | FAQ accordion |
| `/membership` | — | Plan details; Stripe checkout when signed in (Phase 6+) |
| `/impressum` | — | Imprint |
| `/privacy` | — | Privacy / Datenschutz |
| `/terms` | — | Terms / AGB |

---

## Public event detail

| Route | Auth | Notes |
|---|---|---|
| `/events/:id` | — | **Public** event detail (SSR). Indexable when bookable (future `date_time` + remaining capacity > 0). Sold-out/past: 200 + `noindex, follow`. Booking/waitlist/save actions require auth on dedicated routes. |

---

## Auth

| Route | Auth | Notes |
|---|---|---|
| `/login` | — | `@better-auth-ui/heroui`; email/password + Google |
| `/signup` | — | Registration → `USER`, onboarding incomplete |
| `/forgot-password` | — | Reset request |
| `/reset-password` | — | Token-based reset (`noindex`) |
| `/auth/callback/google` | — | Neon Auth OAuth callback |

---

## Onboarding

| Route | Auth | Role | Notes |
|---|---|---|---|
| `/onboarding/age` | ✅ | USER, incomplete | Step 1 (skippable) |
| `/onboarding/interests` | ✅ | USER, incomplete | Step 2 |
| `/onboarding/location` | ✅ | USER, incomplete | Step 3 |
| `/onboarding/timing` | ✅ | USER, incomplete | Step 4 → typically `/membership` or `/events` |

---

## Member app

| Route | Auth | Role | Notes |
|---|---|---|---|
| `/events` | ✅ | USER, booking-eligible | Member discovery feed (filters + pagination). Guests → auth redirect; non-active `USER` → **302** `/discover`. **Not** a public guest list. |
| `/events?category=&partnerId=&from=&to=&page=` | ✅ | USER, booking-eligible | Filtered + paginated feed (GET query params, SSR) |
| `/events/map?category=&partnerId=&from=&to=&page=` | ✅ | USER, booking-eligible | Map view — same filters + pagination as list; same audience gate as `/events` |
| `/events/:id/book` | ✅ | USER, ACTIVE subscription | Booking form (ticket quantity) |
| `/events/:id/book/confirm` | ✅ | USER | Confirmation / redemption code / ICS |
| `/events/:id/waitlist` | ✅ | USER | Join waitlist when sold out |
| `/waitlist/:id/cancel` | ✅ | USER | Cancel own waitlist entry |
| `/saved` | ✅ | USER | Saved events |
| `/bookings?page=` | ✅ | USER | My Tickets (masked codes + reveal; PDF download links) |
| `/bookings/:bookingId/tickets/:ticketId/voucher.pdf` | ✅ | USER (owner) | Auth-gated PDF voucher download (`Content-Disposition: attachment`); `noindex`; guests → login; non-owners → 404 |
| `/profile` | ✅ | USER | Account home (membership manage; Stripe portal CTA) |
| `/profile/details` | ✅ | USER | Personal details tab (identity form POST) |
| `/profile/billing` | ✅ | USER | Billing tab; cancel sub, Stripe portal |
| `/profile/billing/cancel` | ✅ | USER | Cancel subscription confirm (billing tab active) |
| `/profile/preferences` | ✅ | USER | Vibes / preferences tab |
| `/profile/security` | ✅ | USER | Change password tab (Neon Auth / Better Auth UI) |
| `/profile/data-export` | ✅ | USER | GDPR export tab |
| `/profile/delete-account` | ✅ | USER | GDPR deletion tab |

### Guest vs member nav (summary)

| Audience | Primary nav (header) | Events path |
|---|---|---|
| **Guest** | Discover → `/discover`, FAQ; Log in (Sign up via auth routes; How it works / Membership via direct URL / in-flow CTAs) | Featured preview → `/events/:id`; full feed via signup/login + active sub → `/events` |
| **Member (`USER`) non-active** | Discover → `/discover`, FAQ; Saved + Bookings; credits badge; profile; logout | Discover featured list; `/events` / map redirect to Discover; public detail |
| **Member (`USER`) booking-eligible** | **Browse events** → `/events`, FAQ; Saved + Bookings; credits badge; profile; logout | `/events`, `/events/map`, `/saved`, public detail |
| **Admin** | Discover + FAQ where shared; admin chrome → `/admin` | Catalog via `/admin/events`; **Featured events** at `/admin/featured`; **Featured partners** at `/admin/featured-partners` |

See `ui/app-shell.md` for header/footer detail.

---

## Admin (MVP)

| Route | Auth | Role | Notes |
|---|---|---|---|
| `/admin` | ✅ | ADMIN | Dashboard |
| `/admin/events?title=&partner=&language=&sort=&dir=&page=` | ✅ | ADMIN | Event list (title/partner/language filters; language matches spoken or subtitle; column sort; default last-created desc; Reset filters; Languages + Subtitles columns) |
| `/admin/events/new` | ✅ | ADMIN | Create event (three-step wizard: general → date & tickets → image; one POST) |
| `/admin/events/:id/clone` | ✅ | ADMIN | Clone event (new date/time; voucher inventory not copied; not the create/edit stepper) |
| `/admin/events/:id/edit` | ✅ | ADMIN | Edit event (same three-step stepper; Save from any step) |
| `/admin/events/:id/gallery` | ✅ | ADMIN | Event gallery list |
| `/admin/events/:id/gallery/add` | ✅ | ADMIN | Multi-upload gallery photos |
| `/admin/events/:id/gallery/remove` | ✅ | ADMIN | Remove one or many gallery photos (confirm) |
| `/admin/events/:id/delete` | ✅ | ADMIN | Delete confirmation |
| `/admin/events/:id/codes` | ✅ | ADMIN | Export redemption codes (CSV) |
| `/admin/featured` | ✅ | ADMIN | Featured events list (tab label **Featured events** / **Empfohlene Events**) |
| `/admin/featured/add?title=&partner=&language=&sort=&dir=` | ✅ | ADMIN | Search and add featured event (title/partner/language filters; language matches spoken or subtitle; column sort; Languages + Subtitles columns; Reset filters; default last-created) |
| `/admin/featured/:eventId/remove` | ✅ | ADMIN | Remove from featured (catalog event kept) |
| `/admin/featured-partners` | ✅ | ADMIN | Featured partners grid (drag reorder + Save order; tab label **Featured partners** / **Empfohlene Partner**) |
| `/admin/featured-partners/add?q=` | ✅ | ADMIN | Search and add featured partner |
| `/admin/featured-partners/remove?partnerIds=` | ✅ | ADMIN | Remove one or many from featured (catalog partners kept) |
| `/admin/bookings/:id/cancel` | ✅ | ADMIN | Cancel booking (+ waitlist promo path) |
| `/admin/waitlist?eventId=&status=&page=` | ✅ | ADMIN | Waitlist list |
| `/admin/waitlist/:id/promote` | ✅ | ADMIN | Manual promote |
| `/admin/partners?q=&sort=&dir=&page=` | ✅ | ADMIN | Venue list (Name search; column sort `name`\|`created`\|`events`=active; default last-created desc; Reset filters; **Active events** + **Created** columns; toolbar **Export**) |
| `/admin/partners/export?from=&to=&title=&partner=&format=` | ✅ | ADMIN | Sales export — tickets sold per event for inclusive `from`/`to` (Europe/Berlin); optional `title`/`partner` substring filters (HTML + CSV); `format=csv` attachment |
| `/admin/partners/new` | ✅ | ADMIN | Create venue |
| `/admin/partners/:id/edit` | ✅ | ADMIN | Edit venue |
| `/admin/partners/:id/delete` | ✅ | ADMIN | Delete confirmation |
| `/admin/users?q=&page=` | ✅ | ADMIN | Member list |
| `/admin/users/:id` | ✅ | ADMIN | Member detail |
| `/admin/users/:id/adjust-credits` | ✅ | ADMIN | Credit adjust |
| `/admin/users/:id/freeze` | ✅ | ADMIN | Freeze/unfreeze |
| `/admin/users/:id/comp-ticket` | ✅ | ADMIN | Comp ticket |
| `/admin/users/:id/refund` | ✅ | ADMIN | Manual refund |
| `/admin/users/:id/delete-account` | ✅ | ADMIN | Support deletion |
| `/admin/bookings/export` | ✅ | ADMIN | Bookings CSV export |

No `/admin/users/new` — members self-signup only.

**Deferred to post-MVP (not in MVP tables):** `/admin/partners/:id/portal-access`, `/admin/partners/:id/venue-qr`.

---

## Error pages

| Condition | Notes |
|---|---|
| 404 | Locale-aware not-found; `noindex`; same template for bad route vs missing `:id` |
| 500 | Generic error (+ Sentry when configured) |
| 403 | Wrong role — prefer redirect/404 over leaking existence |

---

## Conventions

- **SSR-only mutations** — every create/update/delete is a dedicated page with form POST. No client-only mutation modals.
- **Query-param filters** on `/events` stay bookmarkable and SSR-friendly.
- **Cookie consent** is a layout overlay, not a route.
- Indexability: `extras/seo-and-metadata.md`. Authorization: `extras/authorization-matrix.md`.

---

## Appendix: post-MVP partner & check-in

Not in MVP docs/plan phases. Detail: [`features/post-mvp/`](../features/post-mvp/) and charter parking lot.

| Route | Auth | Role | Notes |
|---|---|---|---|
| `/checkin?venuePartner=&venueToken=` | ✅ | — | Venue QR self-check-in |
| `/partner` | ✅ | PARTNER | Partner dashboard |
| `/partner/events` | ✅ | PARTNER | Own events list |
| `/partner/events/new` | ✅ | PARTNER | Create event (scoped) |
| `/partner/events/:id/edit` | ✅ | PARTNER | Edit own event |
| `/partner/events/:id/delete` | ✅ | PARTNER | Delete confirmation |
| `/partner/guests?q=&eventId=&page=` | ✅ | PARTNER | Guest list |
| `/partner/guests/:bookingId/checkin` | ✅ | PARTNER | Manual check-in |
| `/admin/partners/:id/portal-access` | ✅ | ADMIN | Provision partner login |
| `/admin/partners/:id/venue-qr` | ✅ | ADMIN | Venue check-in QR |
