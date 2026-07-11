# SEO & Metadata (MVP)

SSR metadata for the production MVP. Aligns with [`sitemap/sitemap.md`](../sitemap/sitemap.md) and [`CHARTER.md`](../CHARTER.md): Discover + public bookable event detail are the indexable catalog surfaces; member `/events` is **not** indexable.

## 1. Indexability

| Route group | Indexable? | Why |
|---|---|---|
| `/:locale` (Discover home), `/how-it-works`, `/faq`, `/membership`, `/impressum`, `/privacy`, `/terms` | ✅ Yes | Public marketing / legal |
| `/discover` | — | **301** to `/:locale` — do not list separately in sitemap.xml |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | ❌ `noindex` | Utility / token URLs |
| `/events` | ❌ `noindex` | **Member-gated** feed — not a public catalog list |
| `/events/map`, `/saved` | ❌ `noindex` | Member-only |
| `/events/:id` | ✅ Yes, **when bookable** | Public detail; long-tail SEO. Bookable = future `date_time` + `remaining_capacity > 0` |
| `/events/:id` sold-out or past | ❌ `noindex, follow` | Still HTTP 200 with clear state — do not hard-404 |
| `/events/:id/book`, `/book/confirm`, `/waitlist` | ❌ `noindex` | Auth + transactional |
| `/onboarding/*`, `/bookings`, `/profile/*` | ❌ `noindex` | Private member area |
| `/admin/*` | ❌ `noindex` | Internal |
| `/partner/*`, `/checkin*` | ❌ `noindex` | **Post-MVP** if present |

**Sold-out / past:** keep rendering (200); set robots `noindex, follow`. Optional later: 410 for very old events (not day-one).

## 2. Per-page metadata

Every indexable page needs SSR (initial HTML):

- `<title>` — unique. Pattern: `{Page} — Unveiled Berlin`; events: `{Event title} at {Partner name} — Unveiled Berlin`
- `<meta name="description">` — unique ~150–160 chars; events from event description (truncated)
- `<link rel="canonical">` — self URL including locale
- Open Graph + Twitter Card; event `og:image` / `twitter:image` = **`og-1200x630`** variant
- `<meta name="robots">` per table above (dynamic for event bookability)

## 3. Locale, canonical, hreflang

- Each locale version is canonical for itself (`/de/...` and `/en/...`)
- Reciprocal `hreflang` de / en / `x-default` → `de`
- Never list bare `/` as canonical or in sitemap.xml (302 only)

## 4. Structured data (JSON-LD)

- **Event detail:** `schema.org/Event` — name, startDate, location, image (`hero-1920`), description, organizer. Do not fabricate EUR `offers.price` from credits.
- **Organization** on Discover home (optional but recommended).
- **FAQPage** on `/faq`.

## 5. `sitemap.xml` and `robots.txt`

- **robots.txt** — allow indexable routes; disallow `/*/admin/`, `/*/partner/`, `/*/profile/`, `/*/bookings`, `/*/saved`, `/*/onboarding/`, `/*/checkin`, `/*/events/*/book*`, `/*/events/*/waitlist`, auth paths. `Sitemap:` → `/sitemap.xml`.
- **sitemap.xml** — both locales of marketing/legal pages + both locales of **currently bookable** event detail URLs (`lastmod` from `updated_at`). Do **not** include member `/events`.

## 6. Performance notes

SSR HTML must include meta tags without client hydration. Prefer hero srcset for on-page images; keep OG crop for social only.
