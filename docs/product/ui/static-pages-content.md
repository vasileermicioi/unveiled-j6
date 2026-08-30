# Static & Marketing Pages — Detailed Content & Component Breakdown (MVP)

Exact DE/EN copy and section structure for marketing pages. Rebuild with HeroUI. See `ui-component-map.md`, `app-shell.md`, and `../extras/content-i18n-inventory.md`.

**MVP route lock:** Guest marketing home **is** locale home `/:locale`. Discover is `/:locale/discover`. Bare `/discover` 302s to `/:locale/discover`. Auth is `/login` and `/signup` (no inline auth card on home).

---

## Guest marketing home (`/:locale`)

Public conversion landing for **guests only**. Signed-in members/admins who hit this URL are redirected to their role home (booking-eligible `USER` → `/events`, non-active `USER` → `/discover` or onboarding, `ADMIN` → `/admin`). Logo (guest) points here. Navbar links **Discover** / **Entdecken** to `/discover` for guests (active members see **Browse events** → `/events` instead). Sections, top to bottom:

1. **Hero** — H1 + subheadline (all-caps brand tone): membership for Berlin’s cultural scene / monthly credits framing
2. **Showcase** — phone mockup (`/images/guest-home-phone.png`) + black plan card (29€ / month, four perks, cream CTA panel)
3. **Primary CTA** — “Registrier dich jetzt” / “Register now” → `/signup` (no limited-offer / bonus-credits block)
4. **Benefits strip** — three columns: save time / save money / meet people

---

## Discover (`/:locale/discover`)

Public page without login for guests and non-booking-eligible members. Navbar “Discover” / “Entdecken” points here for those audiences. Booking-eligible `USER` members are redirected to `/events` (they see **Browse events** in the nav instead). `ADMIN` may open Discover for QA. Sections, top to bottom:

### 1. Featured event preview grid
- Section header via shared `PageSectionHeader` (`h1`): eyebrow "Mit deiner Mitgliedschaft buchbar" / "Bookable with your membership", headline "Aktuelle Events in Berlin." / "Current events in Berlin." (full-width rule under the title)
- Grid of **admin-featured** events (`listFeaturedEvents` without upcoming-only filter — past featured still shown; ordered by `sort_order` then `date_time`), each an `EventCard` with guest CTA **"Discover" / "Entdecken"** (or **"Waitlist" / "Warteliste"** when sold out) → public `/events/:id` (not booking modal; not deep-link to `/book`); image and title also link to detail
- Non-featured catalog events do **not** appear solely for being soon
- Empty state (dashed border box): "Aktuell keine empfohlenen Events." / "No featured events right now."
- Guests do **not** get an ungated `/events` list; signup/login + active subscription for the full feed is via auth routes (`/signup`, `/login`) and membership

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

## Legal pages (`/impressum`, `/privacy`, `/terms`)

Footer LEGAL column → three links. Component: `LegalPage.tsx`. Content module: `apps/web/app/lib/content/legal.ts`.

| Route | DE title | EN title |
|---|---|---|
| `/:locale/impressum` | Impressum | Imprint |
| `/:locale/privacy` | Datenschutz | Privacy Policy |
| `/:locale/terms` | AGB | Terms of Service |

- Layout matches FAQ: on-yellow `PageSectionHeader` + intro; then a `help-section` card with eyebrow, page title, `support@unveiled.berlin` mailto, and the shared **`FaqAccordion`** island (~3 sections per page; `answer` may be `string[]`). Body text uses **foreground** color (not muted gray).
- Operator identity on Impressum; Privacy/Terms refer to it instead of repeating full contact blocks.
- Sections use `title` + `body: string[]`. Single-open accordion; first section expanded by default.
- Copy is **operational** MVP text; formal counsel review still recommended before production launch.
- Terms currently state that unused **credits do not roll over**. The FAQ's 2-month rollover promise is the approved marketing forward copy pending credit-engine implementation — deliberate interim inconsistency; see the decision entry in `extras/gaps-and-decisions.md` (follow-up feature will align Terms/billing copy with the promise).
- Full bilingual prose lives in `legal.ts`.

---

## FAQ (`/faq`, component `FaqPage.tsx` + `HelpSection.tsx`)

### 1. Page header
- Shared `PageSectionHeader` on the yellow page background (not a bordered `PageHero` card): eyebrow "Support" (same in both languages), headline **"Häufig gestellte Fragen" / "FAQ"** (large display headline), full-width rule under the title
- Subheadline below the header: "Alles Wichtige zu Mitgliedschaft, Credits, Buchung und Storno an einem Ort." / "Everything important about membership, credits, booking, and cancellation in one place."
- Shell nav/footer DE label for this route is also **"Häufig gestellte Fragen"** / **"HÄUFIG GESTELLTE FRAGEN"** (not the English acronym "FAQ")

### 2. Help/FAQ card (`HelpSection`, reused elsewhere too — see below)
- Eyebrow: "HILFE & SUPPORT" / "FAQ & SUPPORT"
- Headline: "Häufig gestellte Fragen." / "Everything you need to know."
- Support email link: `support@unveiled.berlin` (mailto)
- **Accordion with 11 Q&As, one open at a time (first one open by default).** Copy approved in `.dev-plan/FAQs.md` (EN verbatim) with DE translation; shipped in `apps/web/app/lib/content/faq.ts` and pinned by the guard test `apps/web/app/lib/content/faq.test.ts` (item count + non-empty copy + JSON-LD parity):

  1. **DE:** "Wie funktioniert die unveiled Mitgliedschaft?" → "Jeden Monat erhältst du Credits für kulturelle Erlebnisse in ganz Berlin. Nutze sie, um mit der unveiled Community Erfahrungen zu teilen oder die Stadt auf eigene Faust zu entdecken — von Museen und Ausstellungen über Theater und Konzerte bis mehr. Buche einfach über unveiled, dein Ticket ist in der Mitgliedschaft enthalten."
     **EN:** "How does the unveiled membership work?" → "Every month, you receive Credits to spend on cultural experiences across Berlin. Use them to join experiences with the unveiled community or explore on your own, from museums and exhibitions to theatre, concerts and more. Simply book through unveiled and your ticket is included in your membership."

  2. **DE:** "Wofür kann ich meine Credits nutzen?" → "Deine Credits schalten kulturelle Erlebnisse in ganz Berlin frei — ob mit der Community oder allein. Nimm an einem unserer Community Experiences teil und entdeckt gemeinsam Kultur, oder nutze deine Credits, um unsere Partner-Venues zu besuchen, wann immer du Lust auf einen Solo-Besuch hast. Und wir fangen gerade erst an: Jede Woche kommen neue Kulturpartner und Erlebnisse hinzu."
     **EN:** "What can I use my Credits for?" → "Your Credits unlock cultural experiences across Berlin, whether you want to experience them with the community or on your own. Join one of our Community Experiences and discover culture together, or use your Credits to visit our partner venues whenever you feel like going solo. And we’re just getting started. New cultural partners and experiences are added every week."

  3. **DE:** "Wie viele Credits kostet ein Erlebnis?" → "Das hängt vom Erlebnis ab. Die benötigte Anzahl an Credits kann je nach regulärem Ticketpreis, Nachfrage, Zeitpunkt und dem jeweiligen Partner variieren. Den genauen Credit-Preis siehst du immer vor der Buchung. Nach der Buchung ändert sich der Credit-Preis deiner bestätigten Buchung nicht."
     **EN:** "How many Credits does an experience cost?" → "It depends on the experience. The number of Credits required can vary based on factors such as the regular ticket price, demand, timing and the individual partner. You’ll always see the exact Credit price before booking. Once you’ve booked, the Credit price of your confirmed booking won’t change."

  4. **DE:** "Was passiert mit ungenutzten Credits?" → "Keine Sorge, ungenutzte Credits verschwinden nicht am Ende des Monats. Sie werden in den nächsten Monat übertragen, sodass du dir bis zu 2 Monatskontingente ansparen kannst."
     **EN:** "What happens to unused Credits?" → "Don’t worry, unused Credits don’t disappear at the end of the month. They roll over to the next month, so you can save up to 2 months’ worth of Credits."
     _(Deliberate forward promise — see the rollover decision in `extras/gaps-and-decisions.md`; support fulfills it manually until the credit-engine feature ships.)_

  5. **DE:** "Kann ich ein gebuchtes Erlebnis stornieren?" → "Da wir gerade erst starten, schreib uns einfach kurz eine E-Mail an support@unveiled.berlin — mindestens 12 h vor Beginn des Events. Wir finden immer eine gute Lösung für dich."
     **EN:** "Can I cancel an experience I booked?" → "Since we’re just getting started, just send us a quick email at support@unveiled.berlin at least 12h before the event starts. We’ll always do our best to find a good solution for you."

  6. **DE:** "Was passiert, wenn ich zu spät storniere oder nicht erscheine?" → "Wenn du nach Ablauf der Stornofrist stornierst oder das Erlebnis nicht besuchst, können die für die Buchung verwendeten Credits verfallen und werden nicht erstattet."
     **EN:** "What happens if I cancel too late or don’t show up?" → "If you cancel after the cancellation deadline or don’t attend the experience, the Credits used for the booking may be forfeited and won’t be refunded."

  7. **DE:** "Was passiert, wenn ein Event abgesagt wird?" → "Wenn ein Erlebnis abgesagt wird und du Anspruch auf eine Erstattung hast, werden dir die Credits der Buchung auf deinem unveiled-Konto gutgeschrieben."
     **EN:** "What happens if an event is cancelled?" → "If an experience is cancelled and you are entitled to a refund, the Credits you used for the booking will be returned to your unveiled account."

  8. **DE:** "Was passiert, wenn ein Event verschoben wird?" → "Wenn ein Erlebnis auf einen neuen Termin verschoben wird, kannst du entweder am neuen Termin teilnehmen oder die Buchung stornieren und deine Credits zurückerhalten. Falls wir dich um eine Entscheidung bitten, hast du drei Tage Zeit. Reagierst du in dieser Frist nicht, werden deine Credits automatisch deinem Konto gutgeschrieben."
     **EN:** "What happens if an event is rescheduled?" → "If an experience is moved to a new date, you can either attend on the new date or cancel the booking and receive your Credits back. If we ask you to make a choice, you’ll have three days to do so. If you don’t respond within that time, your Credits will automatically be returned to your account."

  9. **DE:** "Kann ich meine Mitgliedschaft jederzeit kündigen?" → "Ja. Du kannst deine Mitgliedschaft jederzeit kündigen. Deine Mitgliedschaft bleibt bis zum Ende des aktuellen bezahlten Abrechnungszeitraums aktiv. Eine zusätzliche Kündigungsfrist gibt es nicht."
     **EN:** "Can I cancel my membership anytime?" → "Yes. You can cancel your membership at any time. Your membership will remain active until the end of your current paid billing period. There is no additional notice period."

  10. **DE:** "Kann ich mein unveiled-Konto mit anderen teilen?" → "Nein. Dein Konto ist persönlich und darf nicht mit einer anderen Person geteilt oder von ihr genutzt werden. Jede Person darf nur ein Konto erstellen."
      **EN:** "Can I share my unveiled account with someone else?" → "No. Your account is personal and may not be shared with or used by another person. Each person may only create one account."

  11. **DE:** "Wer organisiert eigentlich die kulturellen Erlebnisse?" → "Die auf unveiled verfügbaren Erlebnisse werden von unseren Kulturpartnern organisiert und durchgeführt. unveiled hilft dir, sie zu entdecken und zu buchen, aber wir sind nicht Veranstalter der einzelnen Events. Daher können auch die Regeln und Bedingungen der Venues gelten."
      **EN:** "Who actually organises the cultural experiences?" → "The experiences available on unveiled are organised and operated by our cultural partners. unveiled helps you discover and book them, but we are not the organiser of the individual events. The venue’s own rules and conditions may therefore also apply."

- Support email addresses inside answers render as the **literal text** `support@unveiled.berlin` (no mailto link in answers; the clickable support link lives in the help-card description above the accordion).

### 3. Back button
**Decided (rewrite):** no Back / Zurück button on the FAQ page — guests leave via header, footer, or other in-page links.

### Reuse note
`HelpSection` also renders in a `compact` mode (smaller padding/type scale). **Decided: keep the compact variant** in the rewrite — it's a natural fit as an embedded help widget on pages like checkout/booking confirmation (contextual "need help?" without leaving the page), not just the standalone FAQ page, so the reusability is worth preserving rather than collapsing to a single full-page-only component.

---

## Cross-page observations for the rewrite

- **Default page/section header:** shared `PageSectionHeader` (on-yellow eyebrow + headline + rule) for Discover, FAQ, auth (`AuthPageLayout`), member browse, book/confirm, waitlist, Saved, My Tickets, member account/profile surfaces (`/profile*`), and admin `AdminPageShell` titles. **Optional bordered card hero:** `PageHero` for long-form marketing/legal intros (e.g. How it works). Membership `/membership` uses a **single** bordered marketing card: headline/CTA plus a **vertical icon-bullet** perk list inside the same surface (not a second benefits card; not a horizontal three-up strip). Checkout/guest views omit the muted subtitle/guarantee marketing lines. Account pages use Account/`Konto` eyebrow + page headline (no muted subtitle under the title); profile tablist sits **above** that header and shares the admin-width `max-w-7xl` shell with the header rule and panel card; `/profile` home is a membership manage card (not a credit-wallet tab). Admin shells use Admin/`Verwaltung` eyebrow; optional admin subtitle sits below the header rule. Do not invent one-off FAQ/auth/book/admin heroes.
- Auth pages (`/login`, `/signup`, …) use `PageSectionHeader` via `AuthPageLayout` with locale eyebrows such as "Willkommen zurück" / "Welcome back" (login) and "Loslegen" / "Get started" (signup). Auth form cards fill the same column width as the header (no post-hydrate shrink from better-auth-ui `max-w-sm`).
- Every headline/eyebrow/CTA is manually translated inline via `language === 'DE' ? ... : ...` ternaries rather than pulled from the `translations.ts` catalog — when porting to whatever i18n system the new app uses, all of this copy needs to move into locale files (see `../extras/content-i18n-inventory.md` for the "not yet captured" note on this).
- Two small pieces of copy are **not translated at all** today (identical in DE/EN): the landing page's three trust badges ("Member-owned", "Verified Events", "Berlin Focused") and the "How Unveiled works" eyebrow. **Decided: intentional, keep as brand-English terms** in both locales — short badge-style English phrases are a common, deliberate stylistic choice in German consumer marketing (reads as confident/international rather than untranslated), and these three are consistent with that pattern rather than an oversight. Don't translate them during the rewrite.
- **FAQ is localized:** DE uses "Häufig gestellte Fragen" (nav, page H1, help card); EN keeps "FAQ". Do not leave the English acronym as the DE nav/page label.
