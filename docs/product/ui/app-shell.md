# App Shell — Header & Footer (MVP)

Persistent chrome around every page. Compose with HeroUI (`Header` / drawer / `Link`, etc.). Visual styling via theme tokens — see `design-tokens.md` and `design-system.md`.

## Header

Role-aware header variants (guest, member, admin) composed from shared pieces — prefer distinct variants over one mega-branch component.

### Structure (left → right)

1. **Logo**
   - Wordmark (`Logo` asset) — clickable.
   - **Routing:** guest → `/:locale` (Discover); `USER` → `/events`; `ADMIN` → `/admin`.
   - Guests only: small tagline under logo (hidden on mobile): “Kuratierter Kulturzugang in Berlin” / “Curated cultural access in Berlin”.

2. **Primary nav**
   - **Guest (`lg+`):** Discover → `/:locale`; How it works → `/how-it-works`; Membership → `/membership`; FAQ → `/faq`. Active link: yellow highlight + border.
   - **Member (`USER`):** Discover / “What’s Included” → `/:locale`; FAQ. Plus Saved (bookmark, badge when count > 0) and Bookings / “My Tickets”.
   - **Admin:** admin section links under `/admin/*` (dashboard-focused chrome).

3. **Language toggle** — DE | EN; navigates to the same path under the other locale prefix.

4. **Credits badge** — `USER` only (coin + balance).

5. **Profile** — `USER` → `/profile`.

6. **Logout** — any signed-in role.

7. **Guest auth** — “Log in” + “Sign up” only (no separate “Become a member” header CTA; Membership is already a nav item).

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
2. **Navigation** — Discover → `/:locale`; How it works; Membership; FAQ (uppercase link style).
3. **Contact** — `SUPPORT@UNVEILED.BERLIN` mailto; “BERLIN, GERMANY” / “BERLIN, DEUTSCHLAND”.
4. **Legal** — Impressum, Privacy, Terms.

Stack columns on small screens. No social icons required for MVP. No partner footer variant.

Reference screenshots (if present in repo): `docs/footer.png`, `docs/footer-en.png`.
