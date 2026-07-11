# Product Vision & Domain Model (MVP)

Binding context for the production MVP. Personas and partner scope follow [`CHARTER.md`](../CHARTER.md). Feature files land in step 03 under `docs/product/features/`.

## 1. Product vision

**Unveiled Berlin is a curated cultural-access membership**: members pay a flat monthly fee for a pool of monthly credits, which they spend booking tickets to a curated catalog of Berlin cultural events (theatre, cinema, exhibitions, concerts, nightlife) hosted by independent venues. The pitch to members is discovery + convenience; venues appear in the catalog as partner records managed by Unveiled staff.

### MVP personas

| Persona | Role / state | In MVP? |
|---|---|---|
| **Guest** | Unauthenticated visitor | Yes |
| **Member** | `USER` (signed in) | Yes |
| **Admin** | `ADMIN` (provisioned out-of-band) | Yes |
| **Partner** | `PARTNER` login / portal | **Post-MVP** |

- Venue / `partners` **records** remain: admins create venues and attach events; public UI may show venue name, address, and logo.
- No partner login, `/partner/*` portal, portal-access provisioning UI, or check-in UI in MVP.
- Credits do **not** roll over month to month.

**What makes this a real product:** the credit/subscription model and the atomic booking guarantee (never oversell a venue, never double-charge a member) are the non-negotiable core. Waitlist promotion, admin support tooling, and discovery filters are real MVP value on top of that core. Partner self-service and door check-in are **post-MVP**.

## 2. Domains (bounded contexts)

| # | Domain | Owns | Depends on (reads) | Feature file(s) (step 03) | MVP? |
|---|---|---|---|---|---|
| 1 | **Identity & Access** | User accounts, roles, sessions, auth methods, account deletion/data export | — | `auth.feature` | Yes |
| 2 | **Membership & Billing** | Subscription status/plan, credit balance, credit ledger, payment provider linkage | Identity | `credits-subscription.feature` | Yes |
| 3 | **Event Catalog** | Events, Partners (as catalog/venue entities), categories/tags, images | — | `admin-events.feature`, `admin-partners.feature` | Yes |
| 4 | **Discovery & Personalization** | Public Discover home, member feed filtering, saved events, onboarding preferences | Event Catalog, Identity | `event-discovery.feature`, `onboarding.feature` | Yes |
| 5 | **Booking & Ticketing** | Bookings, redemption codes, the atomic booking transaction | Event Catalog, Membership & Billing | `booking.feature` | Yes |
| 6 | **Waitlist** | Waitlist entries, promotion logic | Booking, Membership & Billing | `waitlist.feature` | Yes |
| 7 | **Check-In** | Attendance state, venue QR tokens | Booking | `checkin.feature` | **Post-MVP** |
| 8 | **Partner Operations** | Partner-scoped guest lists, partner event self-service, portal accounts | Catalog, Booking | `partner-portal.feature` | **Post-MVP** |
| 9 | **Admin Operations** | Member support, venue/catalog management, exports, overrides | Elevated privilege across domains | `admin-events.feature`, `admin-partners.feature`, `admin-users.feature` | Yes |
| 10 | **Content & Compliance** | Static/marketing pages, legal pages, cookie consent, i18n | — | `static-pages.feature` | Yes |

### Boundary rules

- **Only the Booking domain writes bookings and ledger entries for a purchase.** The one sanctioned exception is the **comp ticket** path (Admin), which skips the credit charge but still uses the same capacity-check/booking-creation path.
- **Waitlist promotion creates bookings by calling Booking’s transaction** — it does not duplicate booking-creation logic.
- **Membership & Billing is the single source of truth for “can this user book right now”** (subscription + credits) — checked inside the booking transaction.
- **Identity & Access is the only domain that creates `USER` accounts via self-service signup.** `ADMIN` accounts are provisioned out-of-band. `PARTNER` accounts are **post-MVP** (admin portal-access flow).
- **Partner Operations (post-MVP)** is scoped by session `partnerId` everywhere — never trust client-supplied `partnerId`. In MVP, only Admin writes catalog/venue data.

## 3. Explicit non-goals for v1 / MVP

- **No native mobile app.** Web-only, responsive.
- **No multi-city expansion.** Berlin only; no city selector.
- **No à la carte credit purchases** — credits from monthly subscription refill or admin adjustment/comp only.
- **No referral program.**
- **No real-time chat support** — email only (`support@unveiled.berlin`).
- **No preference-based algorithmic feed ranking** — filters only; preferences stored for later.
- **No newsletter product.**
- **No partner portal / check-in UI** — post-MVP (see charter parking lot).
- **No public full upcoming-events list for guests** — Discover preview + public event detail + auth CTA to member `/events`.

## 4. What “done” means

A domain is complete when:

1. Every scenario in its MVP feature file(s) is real (no open `@needs-decision` gaps).
2. Its data matches `database/schema-overview.md`.
3. Its authorization rules match `extras/authorization-matrix.md`.
4. Its pages exist in `sitemap/sitemap.md` with SSR form POSTs for mutations (no client-only mutation modals).
5. Its UI matches `ui/` docs.

Cross-check `extras/gaps-and-decisions.md` and `CHARTER.md` for decisions vs. the old app / migration extract.
