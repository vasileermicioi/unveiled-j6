# Sitemap (MVP)

Legend: **Auth** = sign-in required. **Role** = required role beyond being signed in. All app routes are under `/:locale` (`de` | `en`) unless noted.

Locale is a **route segment**. Switching language re-navigates to the same path under the other locale (e.g. `/de/events/abc` ↔ `/en/events/abc`).

**Charter locks:** Discover = locale home; `/events/:id` is **public**; member feed `/events` is gated; partner portal is **post-MVP** (appendix only).

---

## Localization & crawlers

| Route | Auth | Notes |
|---|---|---|
| `/` | — | 302 → `/de` or `/en` by `Accept-Language` (fallback `de`) |
| `/robots.txt` | — | Static allow/disallow rules — see `extras/seo-and-metadata.md` |
| `/sitemap.xml` | — | Dynamic: marketing/legal locales + bookable public event detail URLs |

---

## Discover & public marketing

**Discover is locale home.** `/:locale` renders the Discover marketing experience (curated upcoming events + partner venue highlights). Legacy `/:locale/discover` **301** redirects to `/:locale`. Do not invent a third home.

### Guest journey (Discover → Events)

1. Guest lands on Discover (`/:locale`).
2. Preview **EventCard** CTAs link to public `/events/:id` (“See details” / “Mehr sehen”).
3. Path to the **full browse** experience: primary CTA to **signup or login**; after auth (and onboarding if incomplete), land on member `/events`.
4. Guests do **not** get a public full upcoming-events list equivalent to `/events`.

| Route | Auth | Notes |
|---|---|---|
| `/:locale` | — | **Discover** — marketing + curated event preview; CTAs to detail + auth |
| `/discover` | — | **301** → `/:locale` |
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
| `/events` | ✅ | USER | Member discovery feed (filters + pagination). **Not** a public guest list. |
| `/events?category=&partnerId=&from=&to=&page=` | ✅ | USER | Filtered + paginated feed (GET query params, SSR) |
| `/events/map` | ✅ | USER | Map view of current filter set |
| `/events/:id/book` | ✅ | USER, ACTIVE subscription | Booking form (ticket quantity) |
| `/events/:id/book/confirm` | ✅ | USER | Confirmation / redemption code / ICS |
| `/events/:id/waitlist` | ✅ | USER | Join waitlist when sold out |
| `/waitlist/:id/cancel` | ✅ | USER | Cancel own waitlist entry |
| `/saved` | ✅ | USER | Saved events |
| `/bookings?page=` | ✅ | USER | My Tickets |
| `/profile` | ✅ | USER | Identity / profile |
| `/profile/billing` | ✅ | USER | Billing, cancel sub, Stripe portal |
| `/profile/preferences` | ✅ | USER | Vibes / preferences |
| `/profile/data-export` | ✅ | USER | GDPR export |
| `/profile/delete-account` | ✅ | USER | GDPR deletion |

### Guest vs member nav (summary)

| Audience | Primary nav (header) | Events path |
|---|---|---|
| **Guest** | Discover (`/:locale`), FAQ; Log in (Sign up via auth routes; How it works / Membership via direct URL / in-flow CTAs) | Preview → `/events/:id`; full feed via signup/login → `/events` |
| **Member (`USER`)** | Discover, FAQ; Saved + Bookings; credits badge; profile; logout | `/events`, `/events/map`, `/saved`, public detail |
| **Admin** | Discover + FAQ where shared; admin chrome → `/admin` | Catalog via `/admin/events` |

See `ui/app-shell.md` for header/footer detail.

---

## Admin (MVP)

| Route | Auth | Role | Notes |
|---|---|---|---|
| `/admin` | ✅ | ADMIN | Dashboard |
| `/admin/events?q=&page=` | ✅ | ADMIN | Event list |
| `/admin/events/new` | ✅ | ADMIN | Create event |
| `/admin/events/series/new` | ✅ | ADMIN | Event series |
| `/admin/events/:id/edit` | ✅ | ADMIN | Edit event |
| `/admin/events/:id/delete` | ✅ | ADMIN | Delete confirmation |
| `/admin/events/:id/codes` | ✅ | ADMIN | Export redemption codes (CSV) |
| `/admin/bookings/:id/cancel` | ✅ | ADMIN | Cancel booking (+ waitlist promo path) |
| `/admin/waitlist?eventId=&status=&page=` | ✅ | ADMIN | Waitlist list |
| `/admin/waitlist/:id/promote` | ✅ | ADMIN | Manual promote |
| `/admin/partners?q=&page=` | ✅ | ADMIN | Venue list |
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
