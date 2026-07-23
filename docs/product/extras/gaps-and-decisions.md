# Decisions Log (old app → rewrite)

Every gap, inconsistency, or unimplemented feature found in the old app has been resolved into a real, explicit decision baked directly into the relevant feature file, schema doc, or UI doc — **none of these are open questions anymore.** This file is now a single consolidated changelog of *what changed and why*, so anyone reviewing the rewrite can see at a glance where it deliberately diverges from the old app's actual (as opposed to intended) behavior. For the full mechanics of any decision, follow the "Refs" pointer, not this summary.

If you disagree with a decision below, that's a legitimate design conversation to have — but treat it as *reopening* a made decision, not as discovering a gap that was never addressed.

## MVP rewrite 2026-07

Product specs live under `docs/product/`. Binding scope lock: [`docs/product/CHARTER.md`](../CHARTER.md). Do **not** reopen unrelated decisions in this log; charter corrections for MVP are:

| Decision | Refs |
|---|---|
| MVP personas = guest / member (`USER`) / admin; **partner portal & check-in = post-MVP** | `CHARTER.md`, `product/vision-and-domains.md`, sitemap appendix |
| `/events/:id` is **public** and indexable when bookable; member `/events` is gated + `noindex` | `sitemap/sitemap.md`, `extras/seo-and-metadata.md` |
| Guest marketing home = locale home `/:locale` (guests only; signed-in redirect to role home); Discover = `/:locale/discover`; guest path = preview → public detail + auth CTA → `/events` | `sitemap/sitemap.md`, `ui/static-pages-content.md`, `ui/app-shell.md` |
| `@unveiled/ui` is the design system + Ladle home; Theme Overview story required | `ui/design-system.md`, `CHARTER.md` |
| Complete MVP schema includes bookings/credits/waitlist/saved_events; portal columns labeled post-MVP | `database/schema-overview.md` |

Delivery plan: [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](../../.dev-plan/IMPLEMENTATION-PLAN.mvp.md).

## Payments & billing

| Decision | Refs |
|---|---|
| Real Stripe Billing integration (Checkout + Customer Portal + webhooks) replaces the old app's fully-mocked checkout | `features/credits-subscription.feature`, `extras/integrations-and-config.md` |
| Real "Cancel Subscription" handler (`CANCELLED_PENDING` → access until period end → `INACTIVE`) replaces the old app's non-functional button | `features/credits-subscription.feature`, `features/profile.feature` |
| Credits do **not** roll over (contradicting old marketing copy) — unused credits are forfeited each period boundary, recorded via a real `EXPIRY` ledger entry | `features/credits-subscription.feature`, `extras/content-i18n-inventory.md` (copy needs correcting) |
| `PAUSED` subscription status cut (never reached by any real flow); `CANCELLED_PENDING` kept (now genuinely used by real cancellation) | `database/schema-overview.md` |
| Ledger types `PURCHASE` and `REFERRAL_BONUS` cut (no à la carte credit purchases or referral program planned — see non-goals); `EXPIRY` and `REFUND` are now real, produced types | `database/schema-overview.md`, `product/vision-and-domains.md` |
| Admin manual credit refund is a distinct, explicit action, decoupled from booking cancellation (which never auto-refunds) | `features/credits-subscription.feature`, `features/booking.feature` |

## Waitlist

| Decision | Refs |
|---|---|
| Real automatic promotion built: when capacity frees up, the earliest eligible `WAITING` entry is booked automatically through the same transaction as a normal booking | `features/waitlist.feature` |
| Duplicate-waitlist-join prevention added (one active `WAITING` entry per user per event) | `features/waitlist.feature` |
| User-initiated waitlist cancellation added (previously admin-only) | `features/waitlist.feature` |
| Admin can manually trigger promotion for a specific entry (support use case) | `features/waitlist.feature` |
| Booking cancellation (previously nonexistent in any form) added specifically because it's the mechanism that frees capacity for promotion to have something to promote into | `features/booking.feature` |

## Partner self-service

| Decision | Refs |
|---|---|
| Real partner-facing event self-service (create/edit/delete, scoped to own `partnerId`) built — the old app's rules already technically permitted this but no UI existed | `features/partner-portal.feature`, `features/admin-events.feature`, `extras/authorization-matrix.md` |
| Admin retains unrestricted, cross-partner override on top of partner self-service | same as above |

## Identity, auth & compliance

| Decision | Refs |
|---|---|
| Google OAuth added via Neon Auth (Apple explicitly not added — no strong case for it on a Berlin-only web product) | `features/auth.feature`, `extras/integrations-and-config.md` |
| Auth provider decided: **Neon Auth** (Better Auth backend hosted by Neon in the same Postgres database). HonoX `/api/auth/*` forwards to `AUTH_URL`; UI uses **`@better-auth-ui/heroui`**. Drizzle models `public` only — not `neon_auth` | `database/schema-overview.md`, `extras/integrations-and-config.md` |
| Self-service account deletion (GDPR right to erasure) added — anonymize PII, retain anonymized transactional records for legal/accounting retention | `features/auth.feature`, `database/schema-overview.md` |
| Self-service data export (GDPR right to access) added, generated on-demand | `features/auth.feature` |
| Admin can process deletion on a member's behalf (support-assisted) — no general-purpose admin "delete any user" beyond this | `features/admin-users.feature`, `extras/authorization-matrix.md` |
| No admin-initiated member account creation (unchanged from earlier project guidance) — signup remains exclusively self-service | `features/admin-users.feature`, `sitemap/sitemap.md` |
| `AuthView.tsx` dead code and the old app's non-distinct `SIGNUP` app-view are moot — every auth screen is a real, distinct SSR route in the rewrite | `features/auth.feature`, `sitemap/sitemap.md` |

## Discovery & personalization

| Decision | Refs |
|---|---|
| Preference-based feed ranking is a decided non-goal for v1 — onboarding preferences are still captured (used by admin's member-support "intel" view and as a foundation for future ranking) but the feed stays explicitly filter-driven, not algorithmic | `features/event-discovery.feature`, `features/onboarding.feature`, `product/vision-and-domains.md` |
| "Today only" default feed scope kept as-is (intentional, matches actual usage pattern) | `features/event-discovery.feature` |
| Newsletter (opt-in/confirm/unsubscribe) cut entirely — schema-only in the old app with zero corresponding product | `product/vision-and-domains.md`, `database/schema-overview.md` |
| **Featured Discover:** Discover shows admin-curated `featured_events` (including past-dated featured rows — no upcoming-only filter on Discover), not an automatic catalog slice. Member `/events` + map default to upcoming; a `from`/`to` period filter replaces that default (past days allowed when in range). Guests + non-booking-eligible `USER` (`INACTIVE`, `PAST_DUE`, missing sub) see Discover; booking-eligible (`ACTIVE` \| `CANCELLED_PENDING`) get Browse events → `/events` and are redirected away from `/discover`. Non-active `/events` / map → Discover. Demo seed features a small subset. | `features/event-discovery.feature`, `features/admin-events.feature`, `ui/app-shell.md`, `sitemap/sitemap.md` |
| **Featured partners:** Discover Partner venues shows admin-curated `featured_partners` (up to 8 by `sort_order`), not the first N partners from the full catalog. Empty curated list hides the section. Admin tab **Featured partners** / **Empfohlene Partner** at `/admin/featured-partners*`; the former bare **Featured** / **Empfohlen** tab for events is labeled **Featured events** / **Empfohlene Events** (`/admin/featured*` URLs unchanged). Demo seed features a small partner subset (leave ≥1 non-featured when catalog size allows). Admin may hold more than 8 curated rows; Discover still caps display at 8. | `features/event-discovery.feature`, `features/admin-partners.feature`, `database/schema-overview.md`, `sitemap/sitemap.md` |
| **Event gallery display scope:** Gallery storage is per-event (`event_gallery_images`). Public `/:locale/events/:id` shows the end-of-page gallery whenever the gallery is non-empty — **not** gated on Discover `featured_events` membership. Featured remains a Discover curation surface only. Demo seed attaches ≥2 gallery images to at least one upcoming featured event for staging demos. | `features/event-discovery.feature`, `features/admin-events.feature`, `database/schema-overview.md`, `extras/image-uploads.md` |
| **Deferred — footer Browse events parity:** Footer Navigation keeps Discover → `/discover` for guest/member (top nav/drawer swap only); admin footer omits the Navigation column. | `ui/app-shell.md` |
| **Deferred — `PAST_DUE` Browse access:** Treated as non-active (Discover) for MVP; product may later grant Browse while past-due. | `features/event-discovery.feature`, parent Featured Discover guide |

## App shell & content

| Decision | Refs |
|---|---|
| Real mobile menu (hamburger + drawer via HeroUI's `Navbar`) replaces the old app's "hide nav items progressively" approach | `ui/app-shell.md` |
| Footer nav gains a "How it works" link (previously missing despite being a real page) | `ui/app-shell.md` |
| Guest header drops the separate "Mitglied werden"/"Become a member" CTA — Sign up + Membership nav cover the same intent | `ui/app-shell.md` |
| FAQ page drops the Back / Zurück button — leave via header/footer instead | `ui/static-pages-content.md` |
| Membership marketing page uses the wide `max-w-7xl` shell with Discover-style perk cards (not a narrow centered stub) | `ui/static-pages-content.md`, OpenSpec `rework-membership-marketing-shell` |
| Legal pages (Impressum, Privacy Policy, Terms of Service) added — required for a real German consumer product, absent entirely from the old app | `features/static-pages.feature`, `sitemap/sitemap.md`, `ui/app-shell.md` |
| Cookie/tracking consent banner added, gating the event map island (MapLibre GL JS + OpenStreetMap tiles); Sentry is configured PII-free and treated as strictly necessary (not gated) | `features/static-pages.feature` |
| Event map: **MapLibre GL JS** + **OpenStreetMap** tiles instead of Google Maps — no API key, no `@react-google-maps/api`; OSM attribution required | `ui/ui-component-map.md`, `extras/integrations-and-config.md` |
| Public event detail: guests and non–booking-eligible viewers omit ticket qty, credits, and date chrome; booking-eligible members use `min(floor(credits ÷ creditPrice), remainingCapacity)` for qty (no universal hard max of 3). Detail still never POSTs bookings/ledger — charge stays on `/events/:id/book` | `features/booking.feature`, `features/event-discovery.feature`, `ui/ui-component-map.md` |
| Favicon, web manifest, and Open Graph image added (previously entirely missing) | `ui/assets-inventory.md` |
| Display font: `EK Notice Sans` dropped (commercial licensing risk, never confirmed); the rewrite uses **Work Sans only**, at weight 900 for headings | `ui/assets-inventory.md`, `ui/design-tokens.md` |
| Generic-Tailwind-color drift in a few old components (`PartnerPortal.tsx`, `Onboarding.tsx`, `CheckoutView.tsx`) is not carried forward — the brand palette is used consistently everywhere in the rewrite | `ui/design-tokens.md`, `ui/ui-component-map.md` |
| Footer's absence from the checked-out source (it exists in the live product but not in this repo snapshot) was a stale-source issue, not a product gap — resolved by reconstructing it from reference screenshots | `ui/app-shell.md` |

## Data model cleanup

| Decision | Refs |
|---|---|
| `Event.voucherTemplate` and `Event.secretCodeRules` cut — unused by any current or planned scenario | `database/schema-overview.md` |
| `GEMINI_API_KEY` / Google Maps API key | **Decided:** do not carry forward — event map uses **MapLibre GL JS** + **OpenStreetMap** tiles; no map env var | `extras/integrations-and-config.md`, `ui/ui-component-map.md` |

## Extraction-accuracy correction (this pass)

A second review pass against the actual old-app source (`App.tsx`, `index.css`) found one previous extraction error worth flagging explicitly, since it affects the single most visible brand decision in the whole rewrite:

| Correction | What was wrong | What's actually true | Refs |
|---|---|---|---|
| Page background is yellow app-wide, not grey | An earlier draft of `ui/design-tokens.md` mapped HeroUI's `--background` slot to `brand-grey` and described the yellow full-screen treatment as scoped to the old booking modal only | `index.css`'s `body` background is grey, but `App.tsx`'s root wrapper — around `<Navbar/>` + `<main>`, for literally every route including the signed-in feed, profile, admin, and partner portal — is `bg-brand-yellow`. That yellow `min-h-screen` div is what actually paints as the page background everywhere; grey is a secondary surface (form fields, filter panels), not the backdrop. Corrected the color table and the HeroUI `--background`/`--accent` mapping accordingly | `ui/design-tokens.md` |
| No drop shadows in the rewrite | An earlier draft of `ui/design-tokens.md` and Phase 0 theme work carried forward the old app's hard offset box-shadows (`.unveiled-shadow`, `6px 6px 0 0`) as a brand flourish | **Decided:** flat bordered surfaces only — HeroUI shadow tokens set to `none` in `globals.css`. UI styling policy: HeroUI components + theme token changes only; Tailwind for layout/spacing only | `ui/design-tokens.md`, `AGENTS.md` |
| HeroUI-only markup (no raw HTML in UI) | Early Phase 0/1 routes used raw `<section>`, `<p>`, `<a>`, `<h1>` with Tailwind styling; later hard rules preferred HeroUI Select over radios/checkboxes | **Decided:** route/component chrome uses `@heroui/react` primitives or page components built from them; theme owns colors/borders/typography/hover; Tailwind is layout-only on HeroUI nodes. **Native-first form controls:** allowlist `select` / `option` / `optgroup` / `input` / `textarea` for choice/number/date/file (Discover, onboarding, booking qty, admin `AdminFormSelect` / `AdminFormNumberField`). Admin Playwright helpers target native `selectOption` / labeled number inputs. **Keep non-native:** image/Pica UI, map/geo pickers, `@better-auth-ui/*`. Theme via `globals.css` (`.admin-native-select` / `.admin-native-number`) | `AGENTS.md`, `design-tokens.md`, `ui/design-system.md` |
| Phase 5.5 step 02 DS ownership | Most Ladle stories lived under `apps/web`; Logo was dual-owned | **Done:** `Logo` (+ stories) moved to `@unveiled/ui`; page/app-shell story groups explicitly allowed in `apps/web` via `design-system.md`; island raw `<button>`s replaced with HeroUI `Button` | `ui/design-system.md`, `ui/ui-component-map.md` |
| Phase 5.5 step 02 typography utilities | Marketing/detail/onboarding pages use `font-semibold` / `uppercase` / `tracking-*` Tailwind on `Paragraph` | **Deferred** to Phase 8 polish (named in `spec-alignment-parent-guide.md` Risks) — not a second visual language, just incomplete theme class migration | parent guide Risks |
| Primary accent control hover | — | Yellow bg + dark text by default; hover/press inverts to dark bg + white text via `--accent-control-*` tokens on `.button--primary` and active `.nav-link` in `globals.css` | `ui/design-tokens.md` |
| Secondary surface control hover | — | White bg + dark text by default; hover/press inverts to dark bg + white text via `--surface-control-*` tokens (aliases `--accent-control-*` hover) on `.button--secondary`, inactive `.nav-link`, and inactive `.lang-toggle__option` | `ui/design-tokens.md` |

## Pagination, search, and SEO (this pass — new scope, not addressed in the old app or in the first draft of these docs)

| Decision | Refs |
|---|---|
| The old app never paginates (loads full collections client-side); no list route in the first draft of `sitemap/sitemap.md` specified pagination at all. **Decided:** every list route gets `page`/`q`/`sort` query params per a single shared convention (GET-request, server-rendered, works without JS) | `extras/pagination-and-search.md`, `sitemap/sitemap.md` |
| `/admin/events` and `/admin/partners` gain a `q` search param (not specified as searchable in the original feature files, unlike `/admin/users` and the partner guest list) | `extras/pagination-and-search.md` |
| The old app has zero SEO surface at all (SPA, one static title for every route, no sitemap/robots/structured data) — this is new scope end-to-end, added specifically because SSR was adopted for SEO reasons in the first place: per-page meta/OG tags, canonical + hreflang for the `/de`/`/en` locale split, `schema.org/Event` + `FAQPage` + `Organization` JSON-LD, a generated `sitemap.xml`, and `robots.txt` | `extras/seo-and-metadata.md`, `sitemap/sitemap.md` |
| A missing admin list page was found while writing the pagination doc: `features/waitlist.feature`'s "admin can see all waitlist entries" scenario had no corresponding route in the sitemap (only the single-entry `.../promote` action existed) — added `/admin/waitlist` | `sitemap/sitemap.md` |
| 404/500/403 error pages added to the sitemap — an SPA has no server-renderable equivalent, but a real SSR app needs them | `sitemap/sitemap.md` |
| Booking confirmation email added — the old app never emailed booking confirmations at all (redemption info was in-app only), which was inconsistent with waitlist promotion already committing to an email notification. Comp tickets and waitlist promotions get the same email as a normal booking | `features/booking.feature`, `extras/integrations-and-config.md` |
| Accessibility baseline (contrast, focus states, form labeling, `aria-label`s on icon-only buttons, `prefers-reduced-motion`, per-request `lang` attribute) specified — entirely unaddressed in the old app | `ui/design-tokens.md` |
| `EventCard` fix: two bugs found while documenting its exact fields — (1) the CTA-label logic checks sold-out before signed-in-ness, so a guest sees "Waitlist" on a sold-out event despite not being able to join one without an account; reordered to check guest-state first. (2) a computed `saveLabel` string is never applied to the bookmark button's `aria-label` — wired up now | `ui/ui-component-map.md` |
| Timezone handling made explicit (`timestamptz` everywhere, all Berlin-local business logic — "today," check-in windows, series generation — computed against `Europe/Berlin` with real DST-aware conversion, not a hardcoded UTC offset) | `database/schema-overview.md` |
| `admin-partners.feature`'s "Create a partner" scenario was missing the logo field entirely — `partners.logo_url` exists in the schema and is shown throughout the UI, but the create-partner behavioral spec only listed name/contactEmail/address. Added as an optional field (matches the nullable column and the old app's non-required form field) | `features/admin-partners.feature` |
| Extraction-accuracy correction: `ui/assets-inventory.md` and `extras/integrations-and-config.md` previously claimed the old app had no image-upload UI at all ("Firebase Storage configured but never used"). Checked `AdminPanel.tsx` directly — there **is** a file-picker on both the event and partner forms ("SELECT JPEG"/"SELECT LOGO"), it just bypasses Storage: `FileReader.readAsDataURL()` converts the file to base64 client-side and writes it straight into the `imageUrl`/`logoUrl` text column. Corrected both docs to describe this accurately | `ui/assets-inventory.md`, `extras/integrations-and-config.md` |
| **Superseded by the decision directly below:** the correction above initially concluded v1 should stay plain-URL-only with real object storage deferred. That call was revisited the same pass — see "Real image upload pipeline" below | — |

## Image uploads

| Decision | Refs |
|---|---|
| Real image upload pipeline built: S3-compatible object storage (recommended: Cloudflare R2) + six fixed JPEG variants (`original`, `hero-1920`, `large-1280`, `medium-640`, `small-320`, `og-1200x630`) per image, for both event images and partner logos. File-picker and paste-a-URL paths are kept; both converge on one pipeline instead of URL-only no-op / base64-in-DB | `extras/image-uploads.md`, `database/schema-overview.md` (new `images` table), `extras/integrations-and-config.md` |
| **Done:** six variants are **JPEG** (`*.jpg`, Content-Type `image/jpeg`). Generation runs in the **browser with Pica**; the server validates and stores prebuilt variants only. Remote URLs use an authenticated admin bytes proxy then the same client generator. `@standardagents/sip` removed from the stack (historical Workers WASM path) | `extras/image-uploads.md`, `@unveiled/images`, `apps/web/DEPLOYMENT.md` |
| **Residual (accepted):** admin image supply requires JavaScript; EXIF orientation follows the browser decode path; JPEG payloads may be larger than the former WebP variants at similar quality | `extras/image-uploads.md`, `@unveiled/images` |
| New `images` table added, replacing `events.image_url` (text) with `events.image_id` (FK, required) and `partners.logo_url` (text) with `partners.logo_image_id` (FK, nullable) | `database/schema-overview.md` |
| `admin-partners.feature`'s "Create a partner" scenario was missing the logo field entirely — added as optional, matching the nullable column | `features/admin-partners.feature` |
| Per-event `og-1200x630` variant now used for `og:image`/`twitter:image`, and `hero-1920` for `schema.org/Event` JSON-LD `image` — previously specified only generically as "the event's `image_url`" | `extras/seo-and-metadata.md` |
| Admin **event** create/edit forms are upload-only (file required on create; optional replace on edit). Partner logo forms retain upload + URL paste per `extras/image-uploads.md` §3 | `extras/image-uploads.md`, admin event routes |
| Optional **event gallery** (max 12 photos via `event_gallery_images`) uses the same six-JPEG pipeline; primary `events.image_id` stays singular for cards/OG. Admin manage + public detail slider shipped; OG/JSON-LD still use the primary hero only | `extras/image-uploads.md` §8a, `database/schema-overview.md`, `features/admin-events.feature`, `features/event-discovery.feature` |
| A missing UI component-map entry was found while documenting where the new image variants are used: the old app never had a standalone event detail page at all (event detail was shown via `BookingModal`, opened directly from `EventCard`) — no equivalent existed to map from. Added an explicit "Event Detail Page (new)" entry | `ui/ui-component-map.md` |

## Summary table

| Kept as-is | Built for real (was a gap) | Cut entirely |
|---|---|---|
| Auth core (email/password), onboarding capture, event discovery/filtering, booking + idempotency, check-in (partner + QR), admin CRUD for events/partners, credits/ledger core mechanics, all-upcoming feed default (soonest first), admin-only account creation policy, **app-wide yellow page background** (corrected extraction, not a new decision) | Real Stripe payments, real cancel-subscription, credit expiry (no rollover), waitlist promotion + self-cancel + duplicate prevention, booking cancellation, partner self-service events, Google OAuth, GDPR account deletion + data export, mobile nav drawer, legal pages, cookie consent, **SEO (per-page metadata, structured data, sitemap.xml/robots.txt, locale hreflang)**, **pagination + search on every list route**, **booking confirmation emails**, **accessibility baseline**, **explicit timezone handling**, **real image upload pipeline (S3-compatible storage + 6 generated JPEG variants, replacing both the URL-only field and the old app's base64-into-DB anti-pattern)**, **standalone event detail page (`/events/:id`, didn't exist as a page in the old app)** | Newsletter, `PAUSED` status, `PURCHASE`/`REFERRAL_BONUS` ledger types, `AuthView.tsx`, `Event.voucherTemplate`/`secretCodeRules`, `EK Notice Sans`, preference-based feed ranking (deferred, not cut — data still captured) |
