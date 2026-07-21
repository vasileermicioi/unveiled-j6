# Static & Marketing Pages — Detailed Content & Component Breakdown (MVP)

Exact DE/EN copy and section structure for marketing pages. Rebuild with HeroUI. See `ui-component-map.md`, `app-shell.md`, and `../extras/content-i18n-inventory.md`.

**MVP route lock:** Guest marketing home **is** locale home `/:locale`. Discover is `/:locale/discover`. Bare `/discover` 302s to `/:locale/discover`. Auth is `/login` and `/signup` (no inline auth card on home).

---

## Guest marketing home (`/:locale`)

Public conversion landing for **guests only**. Signed-in members/admins who hit this URL are redirected to their role home (`/events` or onboarding for `USER`, `/admin` for `ADMIN`). Logo (guest) points here. Navbar still links **Discover** / **Entdecken** to `/discover`. Sections, top to bottom:

1. **Hero** — H1 + subheadline (all-caps brand tone): membership for Berlin’s cultural scene / monthly credits framing
2. **Showcase** — phone mockup (`/images/guest-home-phone.png`) + black plan card (29€ / month, four perks, cream CTA panel)
3. **Primary CTA** — “Registrier dich jetzt” / “Register now” → `/signup` (no limited-offer / bonus-credits block)
4. **Benefits strip** — three columns: save time / save money / meet people

---

## Discover (`/:locale/discover`)

Public page without login. Navbar “Discover” / “Entdecken” points here. Sections, top to bottom:

### 1. Live event preview grid
- Section header via shared `PageSectionHeader` (`h1`): eyebrow "Mit deiner Mitgliedschaft buchbar" / "Bookable with your membership", headline "Aktuelle Events in Berlin." / "Current events in Berlin." (full-width rule under the title)
- Grid of up to 6 upcoming events (soonest first), each an `EventCard` with guest CTA **"Book Now" / "Bin dabei"** (or **"Waitlist" / "Warteliste"** when sold out) → public `/events/:id` (not booking modal; not deep-link to `/book`)
- Empty state (dashed border box): "Aktuell keine kommenden Events." / "No upcoming events right now."
- Guests do **not** get an ungated `/events` list; signup/login for the full feed is via auth routes (`/signup`, `/login`).

### 2. Partner venues slider
- Section header: eyebrow "Partnerorte" / "Partner venues" (no big headline here, just the eyebrow); section is a named region (`aria-labelledby` / accessible name from the eyebrow)
- Horizontal logo strip of up to 8 featured partners — logo image or large initial-letter fallback; name for accessibility context only (not address cards); logos decorative (`alt=""`)
- Markup duplicates the partner sequence for a seamless continuous CSS marquee (default preference); duplicate cells are `aria-hidden`
- `prefers-reduced-motion: reduce`: strip stays static (wrapped); no auto-scroll; clone sequence hidden
- Empty featured-partners list: **hide** the Partner venues section entirely (no empty marquee, no partner empty-state copy)

### Dropped from old Discover-as-home era
- Discover as locale home (home is now the guest marketing landing)
- Hero panel (stats + membership / browse CTAs) on Discover
- Value proposition cards and membership category tiles / venue callout (parked — not shown on Discover)
- Venue check-in success banner (check-in is **post-MVP**)
- Inline auth card / GUEST EXPLORER / ADMIN ACCESS — use `/login` and `/signup` instead
- Limited-offer / bonus-credits promo on the guest home plan card

---

## How It Works (`/how-it-works`, component `HowItWorksPage.tsx`)

### 1. Hero panel (bordered card)
- Eyebrow: "How Unveiled works" (same text in both languages)
- Headline: "Erst verstehen, dann entscheiden." / "Understand the value before you commit."
- Subheadline: "Unveiled verbindet Mitgliedschaft, kuratierte Event-Auswahl und unkomplizierte Buchung in einem klaren Flow." / "Unveiled combines membership, a curated event selection, and simple booking in one clear flow."

### 2. Three-step explainer (3-column grid of cards)
1. "1. Auswahl ansehen" / "1. Browse the selection" — "Du siehst vorab, welche Events und Kulturhäuser aktuell im Abo enthalten sind." / "See which events and venues are currently included before making any commitment."
2. "2. Mitglied werden" / "2. Become a member" — "Mit der Mitgliedschaft bekommst du Zugang zu kuratierten Kulturangeboten in Berlin." / "Membership gives you access to curated cultural experiences across Berlin."
3. "3. Event buchen" / "3. Book an event" — "Sobald du ein Event buchen willst, nutzt du deine Credits und erhältst direkt alle Einlassdetails." / "Once you want to attend, you use your credits and receive the entry details right away."

### 3. "Why this works" panel (dark, inverted colors)
- Eyebrow: "Warum das funktioniert" / "Why this works"
- Three bordered value-point tiles in a row: "Kuratiert statt beliebig"/"Curated instead of random", "Live synchronisierte Event-Auswahl"/"Live synced event selection", "Transparenz vor dem Paywall-Moment"/"Transparency before the paywall moment"

---

## FAQ (`/faq`, component `FaqPage.tsx` + `HelpSection.tsx`)

### 1. Page header
- Shared `PageSectionHeader` on the yellow page background (not a bordered `PageHero` card): eyebrow "Support" (same in both languages), headline **"Häufig gestellte Fragen" / "FAQ"** (large display headline), full-width rule under the title
- Subheadline below the header: "Alles Wichtige zu Mitgliedschaft, Buchung und Check-in an einem Ort." / "Everything important about membership, booking, and check-in in one place."
- Shell nav/footer DE label for this route is also **"Häufig gestellte Fragen"** / **"HÄUFIG GESTELLTE FRAGEN"** (not the English acronym "FAQ")

### 2. Help/FAQ card (`HelpSection`, reused elsewhere too — see below)
- Eyebrow: "HILFE & SUPPORT" / "FAQ & SUPPORT"
- Headline: "Häufig gestellte Fragen." / "Everything you need to know."
- Support email link: `support@unveiled.berlin` (mailto)
- **Accordion with exactly 3 Q&As, one open at a time (first one open by default):**

  1. **DE:** "Wie buche ich ein Event?" → "Öffne ein Event, wähle die Anzahl der Tickets und bestätige die Buchung mit deinen Credits. Danach findest du alle Details direkt unter Meine Tickets."
     **EN:** "How does booking work?" → "Open an event, choose the number of tickets, and confirm the booking with your credits. All details, codes, or vouchers will then appear in My Tickets."

  2. **DE:** "Was passiert nach der Buchung?" → "Je nach Event bekommst du entweder einen Einlasscode oder einen Promo-Code mit Link zur externen Ticketseite. Alle Details findest du unter Meine Tickets — zeige den Code bei Bedarf an der Tür vor."
     **EN:** "What do I receive after booking?" → "Depending on the event, you will receive either an entry code or a voucher or promo code with a link to the external ticket page. All details appear under My Tickets — show the code at the door when needed."
     _(Venue QR self-check-in is **post-MVP**; do not document it as a required guest step in MVP copy.)_

  3. **DE:** "Was mache ich, wenn etwas nicht funktioniert?" → "Schreib uns an support@unveiled.berlin. Am besten mit Eventname, Uhrzeit und einem Screenshot, damit wir dir schnell helfen können."
     **EN:** "What if something is not working?" → "Email us at support@unveiled.berlin. The fastest way for us to help is if you include the event name, time, and a screenshot."

### 3. Back button
**Decided (rewrite):** no Back / Zurück button on the FAQ page — guests leave via header, footer, or other in-page links.

### Reuse note
`HelpSection` also renders in a `compact` mode (smaller padding/type scale). **Decided: keep the compact variant** in the rewrite — it's a natural fit as an embedded help widget on pages like checkout/booking confirmation (contextual "need help?" without leaving the page), not just the standalone FAQ page, so the reusability is worth preserving rather than collapsing to a single full-page-only component.

---

## Cross-page observations for the rewrite

- **Default page/section header:** shared `PageSectionHeader` (on-yellow eyebrow + headline + rule) for Discover, FAQ, auth (`AuthPageLayout`), member browse, book/confirm, waitlist, Saved, My Tickets, and member account/profile surfaces (`/profile*`). **Optional bordered card hero:** `PageHero` for long-form marketing/legal intros (e.g. How it works). Membership `/membership` uses a **single** bordered marketing card: headline/CTA plus a **vertical icon-bullet** perk list inside the same surface (not a second benefits card; not a horizontal three-up strip). Checkout/guest views omit the muted subtitle/guarantee marketing lines. Account pages use Account/`Konto` eyebrow + page headline (no muted subtitle under the title). Do not invent one-off FAQ/auth/book heroes.
- Auth pages (`/login`, `/signup`, …) use `PageSectionHeader` via `AuthPageLayout` with locale eyebrows such as "Willkommen zurück" / "Welcome back" (login) and "Loslegen" / "Get started" (signup). Auth form cards fill the same column width as the header (no post-hydrate shrink from better-auth-ui `max-w-sm`).
- Every headline/eyebrow/CTA is manually translated inline via `language === 'DE' ? ... : ...` ternaries rather than pulled from the `translations.ts` catalog — when porting to whatever i18n system the new app uses, all of this copy needs to move into locale files (see `../extras/content-i18n-inventory.md` for the "not yet captured" note on this).
- Two small pieces of copy are **not translated at all** today (identical in DE/EN): the landing page's three trust badges ("Member-owned", "Verified Events", "Berlin Focused") and the "How Unveiled works" eyebrow. **Decided: intentional, keep as brand-English terms** in both locales — short badge-style English phrases are a common, deliberate stylistic choice in German consumer marketing (reads as confident/international rather than untranslated), and these three are consistent with that pattern rather than an oversight. Don't translate them during the rewrite.
- **FAQ is localized:** DE uses "Häufig gestellte Fragen" (nav, page H1, help card); EN keeps "FAQ". Do not leave the English acronym as the DE nav/page label.
