# App Shell — Header & Footer (MVP)

Persistent chrome around every page. Compose with HeroUI (`Header` / drawer / `Link`, etc.). Visual styling via theme tokens — see `design-tokens.md` and `design-system.md`.

## Header

Role-aware header variants (guest, member, admin) composed from shared pieces — prefer distinct variants over one mega-branch component.

### Structure (left → right)

1. **Logo**
   - Wordmark (`Logo` asset) — clickable.
   - **Routing:** guest → `/:locale` (Discover); `USER` → `/events`; `ADMIN` → `/admin`.
   - No logo tagline in the sticky header (footer brand tagline is separate).

2. **Primary nav (marketing)**
   - **Guest (`lg+`):** Discover → `/:locale`; FAQ → `/faq`. Active link: yellow highlight + border.
   - **Member (`USER`):** Discover → `/:locale`; FAQ → `/faq`. Plus role tools: Saved (bookmark, badge when count > 0) and Bookings / “My Tickets”.
   - **Admin:** admin section links under `/admin/*` (dashboard-focused chrome). Where admin shares marketing primary nav with other roles, that set is Discover + FAQ only.
   - **Not in header:** How it works, Membership (remain in footer Navigation and Discover page CTAs).

3. **Language toggle** — DE | EN; navigates to the same path under the other locale prefix.

4. **Credits badge** — `USER` only (coin + balance).

5. **Profile** — `USER` → `/profile`.

6. **Logout** — any signed-in role.

7. **Guest auth** — “Log in” only. Sign up is **not** in the header; guests create accounts via Discover / membership CTAs and auth routes (`/signup`, etc.).

### Discover → Events (nav / CTA contract)

- Discover link always points at **`/:locale`**, never a separate orphan marketing home.
- Guests reach the **full event browse** via signup/login (landing on `/events` after auth/onboarding), not via an ungated `/events` list.
- Preview cards on Discover link to public `/events/:id`.

### Behavior

- Active-route highlighting (yellow + border) is the primary “you are here” affordance.
- **Mobile:** hamburger + drawer (HeroUI drawer / menu), not “hide everything.”
- Sticky header on all pages.

---

## Footer

White bordered block on yellow page background; thick dark top border; near-zero radius; **no shadow**.

### Columns

1. **Brand** — “UNVEILED BERLIN” eyebrow; tagline “KURATIERTER KULTURZUGANG IN BERLIN.” / “CURATED CULTURAL ACCESS IN BERLIN.”; body: discover theatre/cinema/exhibitions copy (verbatim DE/EN from product screenshots).
2. **Navigation** — Discover → `/:locale`; How it works; Membership; FAQ (uppercase link style). These keep How it works and Membership reachable after they left the header.
3. **Contact** — `SUPPORT@UNVEILED.BERLIN` mailto; “BERLIN, GERMANY” / “BERLIN, DEUTSCHLAND”.
4. **Legal** — Impressum, Privacy, Terms.

Stack columns on small screens. No social icons required for MVP. No partner footer variant.

Reference screenshots (if present in repo): `docs/footer.png`, `docs/footer-en.png`.
