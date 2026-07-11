# Static & Marketing Pages — Detailed Content & Component Breakdown (MVP)

Exact DE/EN copy and section structure for marketing pages. Rebuild with HeroUI. See `ui-component-map.md`, `app-shell.md`, and `../extras/content-i18n-inventory.md`.

**MVP route lock:** Discover **is** locale home `/:locale`. Legacy `/discover` 301s to `/:locale`. There is no separate marketing landing with an inline auth card — auth is `/login` and `/signup`.

---

## Discover (locale home `/:locale`)

Public page without login. Navbar “Discover” / “Entdecken” points here. Sections, top to bottom:

### 1. Hero panel (bordered card, large)
Two-column layout (stacks on mobile):
- **Left column:**
  - Eyebrow: "Das kannst du aktuell mit unveiled erleben" / "This is what you can currently access with unveiled"
  - Large headline: "Berlin entdecken, wie du es willst." / "Discover Berlin the way you want."
  - Subheadline: "Deine Mitgliedschaft für Theater, Kino, Ausstellungen und neue Leute in Berlin." / "Your membership for theatre, cinema, exhibitions, and new people in Berlin."
  - Two buttons:
    - "Mitgliedschaft ansehen" / "View membership" → `/membership`
    - "Live Events ansehen" / "Browse live events" → **signup or login** (after auth + onboarding → member `/events`). Guests do **not** get an ungated `/events` list. Preview cards below still link to public `/events/:id`.
- **Right column: three stacked stat/info tiles**
  - Tile 1 (yellow): live count of upcoming events, labeled "Live im Feed" / "Live in the feed" above the number and "kommende Events" / "upcoming events" below
  - Tile 2 (white): live count of featured partner venues, labeled "Partnerorte" / "Partner venues" above, "aktive Häuser" / "active venues" below
  - Tile 3 (grey): a static reassurance statement — "Mitgliedschaft" / "Membership" label, then "Alles, was du brauchst, um Berlin zu entdecken." / "Everything you need to discover Berlin."

### 2. Value proposition cards (3-column grid)
Three cards, each with a bold title and supporting text:
1. "Finde Dinge, die zu dir passen" / "Find things that fit you" — "Theater, Kino, Ausstellungen und Events in Berlin, die man sonst leicht verpasst." / "Theatre, cinema, exhibitions, and events in Berlin that are easy to miss otherwise."
2. "Buche spontan mit deinen Credits" / "Book spontaneously with your credits" — "Mit deiner Mitgliedschaft kannst du jederzeit flexibel buchen, worauf du gerade Lust hast." / "With your membership, you can book flexibly whenever something feels right."
3. "Werde Teil der unveiled Community" / "Become part of the unveiled community" — "Triff Leute, die genauso Lust haben, Neues zu entdecken wie du." / "Meet people who are just as eager to discover something new as you are."

### 3. Live event preview grid
- Section header: eyebrow "Live synchronisiert" / "Live synced", headline "unveiled App: Event-Übersicht in Berlin" / "unveiled app: live event selection in Berlin"
- Grid of up to 6 upcoming events (soonest first), each an `EventCard` with guest CTA **"See details" / "Mehr sehen"** → public `/events/:id` (not booking modal)
- Empty state (dashed border box): "Aktuell keine kommenden Events." / "No upcoming events right now."

### 4. Membership categories
- Section header: eyebrow "Mitgliedschaft" / "Memberships", headline "Was du mit unveiled entdecken kannst" / "What you can discover with unveiled", subtext "Mit deiner Mitgliedschaft entdeckst du Dinge in Berlin, die zu dir passen." / "With your membership, you discover things in Berlin that match your interests."
- Grid of numbered category tiles (numbered `01`–`06`): Kino/Cinema, Ausstellungen/Exhibitions, Theater/Theatre, Museen/Museums, Konzerte/Concerts, Besondere Orte/Special venues
- A callout box below the grid: "Fehlt dein Lieblingsort?" / "Missing your favorite venue?" with body text inviting suggestions ("Dein Lieblingskino, Theater oder Museum fehlt noch?..." / "If your favorite cinema, theatre, or museum is missing...") and a "Schreib uns" / "Write to us" mailto link to `support@unveiled.berlin`

### 5. Partner venues grid
- Section header: eyebrow "Partnerorte" / "Partner venues" (no big headline here, just the eyebrow)
- Grid of up to 8 partner tiles, each showing the partner's logo (or a large initial letter if no logo), name, and address

### Dropped from old landing (not on Discover)
- Venue check-in success banner (check-in is **post-MVP**)
- Inline auth card / GUEST EXPLORER / ADMIN ACCESS — use `/login` and `/signup` instead
- Separate `/` marketing page distinct from Discover

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
- Eyebrow: "Support" (same in both languages)
- Headline: "FAQ" (same in both languages, styled as a large display headline)
- Subheadline: "Alles Wichtige zu Mitgliedschaft und Buchung an einem Ort." / "Everything important about membership and booking in one place."

### 2. Help/FAQ card (`HelpSection`, reused elsewhere too — see below)
- Eyebrow: "FAQ & SUPPORT" (same in both languages)
- Headline: "Häufige Fragen." / "Everything you need to know."
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

- All of these pages share the same "bordered white/dark card on a page-level max-width container" pattern with an eyebrow + big uppercase headline + supporting paragraph — this is a strong candidate for a shared `PageHero`/`SectionCard` HeroUI-based layout primitive rather than one-off styling per page.
- Every headline/eyebrow/CTA is manually translated inline via `language === 'DE' ? ... : ...` ternaries rather than pulled from the `translations.ts` catalog — when porting to whatever i18n system the new app uses, all of this copy needs to move into locale files (see `../extras/content-i18n-inventory.md` for the "not yet captured" note on this).
- Two small pieces of copy are **not translated at all** today (identical in DE/EN): the landing page's three trust badges ("Member-owned", "Verified Events", "Berlin Focused") and the "How Unveiled works" eyebrow. **Decided: intentional, keep as brand-English terms** in both locales — short badge-style English phrases are a common, deliberate stylistic choice in German consumer marketing (reads as confident/international rather than untranslated), and these three are consistent with that pattern rather than an oversight. Don't translate them during the rewrite.
