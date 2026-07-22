# App Shell — Header & Footer (MVP)

Persistent chrome around every page. Compose with HeroUI (`Header` / drawer / `Link`, etc.). Visual styling via theme tokens — see `design-tokens.md` and `design-system.md`.

## Header

Role-aware header variants (guest, member, admin) composed from shared pieces — prefer distinct variants over one mega-branch component.

### Structure (left → right)

1. **Logo**
   - Wordmark (`Logo` asset) — clickable.
   - **Routing:** guest → `/:locale` (guest marketing home); booking-eligible `USER` → `/events`; non-booking-eligible `USER` → `/discover`; `ADMIN` → `/admin`.
   - No logo tagline in the sticky header (footer brand tagline is separate).

2. **Primary nav (marketing)**
   - **Guest (`lg+`):** Discover / Entdecken → `/discover`; FAQ → `/faq`. Active link: yellow highlight, no border (same in mobile drawer).
   - **Member (`USER`) non-booking-eligible:** Discover / Entdecken → `/discover`; FAQ → `/faq`. Plus role tools: Saved (bookmark, badge when count > 0) and Bookings / “My Tickets”.
   - **Member (`USER`) booking-eligible (`ACTIVE` | `CANCELLED_PENDING` via `isBookingEligibleStatus`):** **Browse events** / **Events entdecken** → `/events`; FAQ → `/faq`. Same role tools as above.
   - **Admin:** no Discover / FAQ in header or mobile drawer — dashboard-focused chrome only (Admin + Log out; logo → `/admin`). Discover/FAQ remain reachable by direct URL for QA.
   - **Not in header or footer nav:** How it works, Membership (pages remain at `/how-it-works` and `/membership`; reachable via direct URL / in-flow CTAs).

3. **Language toggle** — DE | EN; navigates to the same path under the other locale prefix.

4. **Credits badge** — `USER` only (coin + balance).

5. **Profile** — `USER` → `/profile`.

6. **Logout** — any signed-in role.

7. **Guest auth** — “Log in” only. Sign up is **not** in the header; guests create accounts via auth routes (`/signup`, etc.) and in-flow membership CTAs.

### Discover → Events (nav / CTA contract)

- Guests and non-booking-eligible members: primary nav **Discover** → `/:locale/discover` (admin-featured preview, including past featured).
- Booking-eligible members: primary nav **Browse events** → `/:locale/events` (full feed). Hitting `/discover` redirects to `/events`.
- Guests reach the **full event browse** via signup/login **and** an active subscription — not via an ungated `/events` list. Inactive members land on Discover when they hit `/events` or `/events/map`.
- Preview cards on Discover link to public `/events/:id`.
- Sticky header and mobile drawer use the same Discover ↔ Browse events label/href swap. Footer Navigation keeps Discover → `/discover` (no Browse events parity unless product later chooses it).

### Behavior

- Active-route highlighting uses the resolved href (Discover or Browse events). Discover/Browse uses theme primary button when current, secondary otherwise; FAQ stays text nav.
- **Mobile (`< lg`):** sticky bar is logo + hamburger only. Drawer lists uppercase links under section labels in order **Account → Navigation → Language** (login/profile/auth first); active + hover match desktop nav (yellow selected, invert on hover).
- Sticky header on all pages.

---

## Footer

White bordered block on yellow page background; thick dark top border; near-zero radius; **no shadow**.

### Columns

1. **Brand** — “UNVEILED BERLIN” eyebrow; tagline “KURATIERTER KULTURZUGANG IN BERLIN.” / “CURATED CULTURAL ACCESS IN BERLIN.”; body: discover theatre/cinema/exhibitions copy (verbatim DE/EN from product screenshots).
2. **Navigation** — Guest/member only: Discover → `/:locale/discover`; FAQ (uppercase link style). How it works and Membership are **not** listed. Footer does **not** swap to Browse events for active members (deferred parity). **Hidden for `ADMIN`** (entire Navigation column omitted).
3. **Contact** — `SUPPORT@UNVEILED.BERLIN` mailto; “BERLIN, GERMANY” / “BERLIN, DEUTSCHLAND”.
4. **Legal** — Impressum, Privacy, Terms.

Stack columns on small screens. No social icons required for MVP. No partner footer variant.

Reference screenshots (if present in repo): `docs/footer.png`, `docs/footer-en.png`.
