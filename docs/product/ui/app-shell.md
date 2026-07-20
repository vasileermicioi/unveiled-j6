# App Shell — Header & Footer (MVP)

Persistent chrome around every page. Compose with HeroUI (`Header` / drawer / `Link`, etc.). Visual styling via theme tokens — see `design-tokens.md` and `design-system.md`.

## Header

Role-aware header variants (guest, member, admin) composed from shared pieces — prefer distinct variants over one mega-branch component.

### Structure (left → right)

1. **Logo**
   - Wordmark (`Logo` asset) — clickable.
   - **Routing:** guest → `/:locale` (guest marketing home); `USER` → `/events`; `ADMIN` → `/admin`.
   - No logo tagline in the sticky header (footer brand tagline is separate).

2. **Primary nav (marketing)**
   - **Guest (`lg+`):** Discover → `/discover`; FAQ → `/faq`. Active link: yellow highlight, no border (same in mobile drawer).
   - **Member (`USER`):** Discover → `/discover`; FAQ → `/faq`. Plus role tools: Saved (bookmark, badge when count > 0) and Bookings / “My Tickets”.
   - **Admin:** admin section links under `/admin/*` (dashboard-focused chrome). Where admin shares marketing primary nav with other roles, that set is Discover + FAQ only.
   - **Not in header or footer nav:** How it works, Membership (pages remain at `/how-it-works` and `/membership`; reachable via direct URL / in-flow CTAs).

3. **Language toggle** — DE | EN; navigates to the same path under the other locale prefix.

4. **Credits badge** — `USER` only (coin + balance).

5. **Profile** — `USER` → `/profile`.

6. **Logout** — any signed-in role.

7. **Guest auth** — “Log in” only. Sign up is **not** in the header; guests create accounts via auth routes (`/signup`, etc.) and in-flow membership CTAs.

### Discover → Events (nav / CTA contract)

- Discover link always points at **`/:locale/discover`**. Guest marketing home is `/:locale` (guests only).
- Guests reach the **full event browse** via signup/login (landing on `/events` after auth/onboarding), not via an ungated `/events` list.
- Preview cards on Discover link to public `/events/:id`.

### Behavior

- Active-route highlighting (yellow + border) is the primary “you are here” affordance.
- **Mobile (`< lg`):** sticky bar is logo + hamburger only. Drawer lists uppercase links under section labels in order **Account → Navigation → Language** (login/profile/auth first); active + hover match desktop nav (yellow selected, invert on hover).
- Sticky header on all pages.

---

## Footer

White bordered block on yellow page background; thick dark top border; near-zero radius; **no shadow**.

### Columns

1. **Brand** — “UNVEILED BERLIN” eyebrow; tagline “KURATIERTER KULTURZUGANG IN BERLIN.” / “CURATED CULTURAL ACCESS IN BERLIN.”; body: discover theatre/cinema/exhibitions copy (verbatim DE/EN from product screenshots).
2. **Navigation** — Discover → `/:locale`; FAQ (uppercase link style). How it works and Membership are **not** listed.
3. **Contact** — `SUPPORT@UNVEILED.BERLIN` mailto; “BERLIN, GERMANY” / “BERLIN, DEUTSCHLAND”.
4. **Legal** — Impressum, Privacy, Terms.

Stack columns on small screens. No social icons required for MVP. No partner footer variant.

Reference screenshots (if present in repo): `docs/footer.png`, `docs/footer-en.png`.
