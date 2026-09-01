# SEO & Metadata (MVP)

SSR metadata for the production MVP. Aligns with [`sitemap/sitemap.md`](../sitemap/sitemap.md) and [`CHARTER.md`](../CHARTER.md): Discover + public bookable event detail are the indexable catalog surfaces; member `/events` is **not** indexable.

## 1. Indexability

| Route group | Indexable? | Why |
|---|---|---|
| `/:locale` (Discover home), `/how-it-works`, `/faq`, `/membership`, `/regular`, `/impressum`, `/privacy`, `/terms` | ✅ Yes | Public marketing / legal |
| `/discover` | — | **301** to `/:locale` — do not list separately in sitemap.xml |
| `/login`, `/signup`, `/forgot-password`, `/reset-link-sent`, `/reset-password` | ❌ `noindex` | Utility / token URLs |
| `/events` | ❌ `noindex` | **Member-gated** feed — not a public catalog list |
| `/events/map`, `/saved` | ❌ `noindex` | Member-only |
| `/events/:id` | ✅ Yes, **when bookable and published** | Public detail; long-tail SEO. Bookable = `published = true` + future `date_time` + `remaining_capacity > 0` |
| `/events/:id` unpublished | ❌ not served | Same HTTP **404** as a missing id (`getPublicEventById` returns null). Not indexable. Not in `sitemap.xml`. Do **not** treat as sold-out `noindex` 200. |
| `/events/:id` sold-out or past | ❌ `noindex, follow` | Still HTTP 200 with clear state — do not hard-404. Only applies to **published** events. |
| `/events/:id/book`, `/book/confirm`, `/waitlist` | ❌ `noindex` | Auth + transactional |
| `/onboarding/*`, `/bookings`, `/profile/*` | ❌ `noindex` | Private member area |
| `/admin/*` | ❌ `noindex` | Internal |
| `/partner/*`, `/checkin*` | ❌ `noindex` | **Post-MVP** if present |

**Sold-out / past:** keep rendering (200); set robots `noindex, follow`. Optional later: 410 for very old events (not day-one).

## 2. Per-page metadata

Every indexable page needs SSR (initial HTML):

- `<title>` — unique. Pattern: `{Page} — Unveiled Berlin`; events: `{resolved title} at {Partner name} — Unveiled Berlin` where resolved title is the locale copy for that URL (`title_en` on `/en/events/:id`, `title_de` on `/de/events/:id`, then the other locale, then canonical)
- `<meta name="description">` — unique ~150–160 chars; events from the **locale-resolved** Markdown description (plain-text extract, truncated)
- `<link rel="canonical">` — self URL including locale
- Open Graph + Twitter Card (`twitter:card` = `summary_large_image`)
  - Pages without a page-specific image use the site-wide fallback `/og-default-v2.png` (PNG 1200×630, brand yellow `#FAFF86`). The Unveiled wordmark fits entirely inside the **center 630×630** so a 1:1 crop (Telegram and similar) stays legible. Change the filename when the artwork changes so crawlers refetch.
  - SSR tags: `og:image`, `og:image:width` (`1200`), `og:image:height` (`630`), `og:image:type` (`image/png` for the fallback; `image/webp` when an event `og-1200x630` override is present), `og:image:alt`, matching `twitter:image`
  - Event `og:image` / `twitter:image` = **`og-1200x630`** variant when present
- `<meta name="robots">` per table above (dynamic for event bookability)

## 3. Locale, canonical, hreflang

- Each locale version is canonical for itself (`/de/...` and `/en/...`). Event title, meta description, and JSON-LD follow that page locale.
- Reciprocal `hreflang` de / en / `x-default` → `de`
- Never list bare `/` as canonical or in sitemap.xml (302 only)

## 4. Structured data (JSON-LD)

- **Event detail:** `schema.org/Event` — `name` and `description` from locale-resolved copy for that URL, startDate, location, image (`hero-1920`), organizer. Do not fabricate EUR `offers.price` from credits. Each locale URL’s body, document title, meta description, and JSON-LD MUST match that locale (`hreflang` points at the other URL; it is not an excuse to serve the same copy on both).
- **Organization** on Discover home (optional but recommended).
- **FAQPage** on `/faq`.

## 5. `sitemap.xml` and `robots.txt`

- **robots.txt** — allow indexable routes; disallow `/*/admin/`, `/*/partner/`, `/*/profile/`, `/*/bookings`, `/*/saved`, `/*/onboarding/`, `/*/checkin`, `/*/events/*/book*`, `/*/events/*/waitlist`, auth paths. `Sitemap:` → `/sitemap.xml`.
- **sitemap.xml** — both locales of marketing/legal pages + both locales of **currently bookable published** event detail URLs (`lastmod` from `updated_at`). Do **not** include member `/events` or unpublished `/events/:id`.

## 6. Performance notes

SSR HTML must include meta tags without client hydration. Prefer hero srcset for on-page images; keep OG crop for social only.
