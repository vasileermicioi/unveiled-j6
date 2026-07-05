## Context

Phase 1 steps 01–03 archived with:
- Content modules at `apps/web/app/lib/content/` including `discover.ts` and `legal.ts` with verbatim DE/EN copy (all five discover sections, legal placeholder sections)
- Marketing primitives: `PageHero`, `SectionCard` under `apps/web/app/components/marketing/`
- SEO helper `buildPageMeta()` and per-page meta helpers in `apps/web/app/lib/seo.ts`
- Flat HonoX route files for landing, how-it-works, FAQ, membership
- `GuestFooter` already links to `impressum`, `privacy`, `terms`, and `discover` via `localizedPath()`
- `GuestNavbar` `NAV_ITEMS` already includes `discover` segment

This step adds `/discover` and three legal routes. Content sources:
- `docs/migration/ui/static-pages-content.md` — Discover / AccessPage §1–5
- `docs/migration/ui/ui-component-map.md` — EventCard guest-state CTA precedence (guest checked before sold-out)
- `docs/migration/features/static-pages.feature` — Discover preview and legal page scenarios
- `docs/migration/extras/seo-and-metadata.md` §1 — all four routes are indexable

Constraints from `AGENTS.md`:
- Copy from content modules only — no inline string literals in route files
- HeroUI components with neo-brutalist tokens; layout-only Tailwind
- Mock data in `apps/web/app/lib/mock/` — clearly labeled Phase 1 placeholders, no `@unveiled/db`
- `EventCardPreview` stays in `apps/web` — do NOT create `@unveiled/ui` package yet (Phase 4)
- SSR-only — no client islands needed for discover or legal pages

## Goals / Non-Goals

**Goals:**

- Discover page at `/:locale/discover` with hero (stat tiles), value props, mock event grid, categories 01–06, partner grid, missing-venue callout
- `EventCardPreview` with guest-only CTA ("See details" / "Mehr sehen") regardless of mock capacity
- Legal pages at `/:locale/impressum`, `/:locale/privacy`, `/:locale/terms` with structured placeholder sections from `legalContent`
- Per-page SEO metadata on all four routes
- Navbar active highlighting for `/discover`
- Footer legal links resolve to 200 responses (no 404)
- `bun run typecheck` and `bun run lint` pass

**Non-Goals:**

- Real event catalog, image pipeline, R2 variants (Phase 4)
- Functional event detail or booking links — CTA links to `#` or `/:locale/discover#events` anchor stub (Phase 4–6)
- Cookie banner, robots.txt, sitemap (step 05)
- `@unveiled/ui` shared EventCard package (Phase 4)
- Final legal copy — placeholders marked for counsel review remain acceptable

## Decisions

### 1. Route file layout — flat HonoX files (not nested `index.tsx`)

Create flat route files matching step 02–03 pattern:
- `apps/web/app/routes/[locale]/discover.tsx`
- `apps/web/app/routes/[locale]/impressum.tsx`
- `apps/web/app/routes/[locale]/privacy.tsx`
- `apps/web/app/routes/[locale]/terms.tsx`

**Alternative considered:** Nested `[locale]/discover/index.tsx` per iteration doc. Rejected — step 02 documented that HonoX file-based routing in this repo does not register nested `index.tsx` reliably.

### 2. Mock data module — `discover-data.ts`

`apps/web/app/lib/mock/discover-data.ts`:
- Export typed arrays: `MOCK_DISCOVER_EVENTS` (4–6 items), `MOCK_DISCOVER_PARTNERS` (up to 8)
- Event fields: `id`, `title`, `partnerName`, `date` (ISO string or formatted), `creditPrice`, `remainingCapacity`, `imagePlaceholder` (solid color CSS class or placeholder URL)
- Partner fields: `id`, `name`, `address`, optional `initial` for letter fallback
- Export `MOCK_DISCOVER_STATS`: `{ eventCount: number; partnerCount: number }` for hero tiles — hardcoded, not derived from array length (allows marketing-friendly round numbers)
- Include at least one mock event with `remainingCapacity: 0` to verify guest CTA precedence in QA
- File header comment: "Phase 1 placeholder — replaced by DB queries in Phase 4"

Locale-neutral mock data (proper nouns, dates) — bilingual labels come from content modules and CTA copy in component.

### 3. `EventCardPreview` — guest-state CTA only

`apps/web/app/components/marketing/EventCardPreview.tsx`:
- Props: `event` (mock event type), `locale`, optional `ctaHref` defaulting to `#`
- HeroUI `Card` with image area (placeholder color block or `<img>` inside Card), title, partner name, date, credit price
- Footer CTA: HeroUI `Link` with `button button--secondary` — label from locale (`Mehr sehen` / `See details`)
- **Never** branch on `remainingCapacity` for guests — sold-out mock events still show "See details"
- No bookmark toggle, no "Book Now", no "Waitlist", no "Unlock event"
- Matches ui-component-map precedence: guest-state checked first

**Rationale:** Same card semantics as future `@unveiled/ui` EventCard guest path without pulling Phase 4 package scope forward.

### 4. `DiscoverPage` component — five sections

`apps/web/app/components/marketing/DiscoverPage.tsx`:
- Props: `content: DiscoverContent`, `locale: Locale`, mock events/partners/stats from discover-data module
- **§1 Hero:** Two-column `Card` — left: eyebrow, headline, subheadline, two CTAs (`Link` to `membership` and `#events` anchor); right: three stat tiles (yellow/white/grey via theme BEM classes)
- **§2 Value props:** 3-column grid of `SectionCard`
- **§3 Live preview:** Section header + responsive grid of `EventCardPreview` (max 6, soonest-first order in mock data); empty state: dashed-border box with `livePreview.emptyState` copy when array empty
- **§4 Categories:** Section header + numbered tiles `01`–`06` from `content.categories.items`; callout box below with mailto to `support@unveiled.berlin`
- **§5 Partners:** Eyebrow header + grid of partner tiles (initial letter fallback when no logo)

Hero CTAs:
- "View membership" → `localizedPath(locale, "membership")`
- "Browse live events" → `#events` anchor on same page (Phase 1 stub; real `/events` feed is Phase 5 gated)

### 5. Legal pages — shared `LegalPage` component

`apps/web/app/components/marketing/LegalPage.tsx`:
- Props: `content: LegalContent`
- `PageHero` with `pageTitle` as headline and `intro` as description
- Stack of `SectionCard` panels — one per `content.sections[]` entry rendering `title` + `placeholder` body
- Placeholder text uses existing `[PLACEHOLDER — legal review required]` markers from `legal.ts`

Three thin route files each call `getPageContent(locale, "impressum" | "privacy" | "terms")` and render `<LegalPage content={...} />`.

### 6. Per-page SEO metadata

Add helpers to `seo.ts`:

| Route | `title` | `description` |
|---|---|---|
| `/:locale/discover` | Nav label (`Entdecken` / `Discover`) | Hero subheadline from discover content |
| `/:locale/impressum` | `pageTitle` from legal content | `intro` from legal content |
| `/:locale/privacy` | `pageTitle` | `intro` |
| `/:locale/terms` | `pageTitle` | `intro` |

Pass `c.render()` second-arg props with `canonicalPath` from request pathname. No JSON-LD on discover or legal pages in this step.

### 7. Navbar active state

Existing `isActiveNavPath()` exact-match logic should highlight Discover nav item when pathname is `/{locale}/discover`. Verify in implementation; fix only if trailing-slash normalization fails.

## Risks / Trade-offs

- **[Mock data diverges from future catalog]** → Clearly labeled Phase 1 placeholders; Phase 4 replaces module with DB queries and real EventCard from `@unveiled/ui`.
- **[Non-functional event CTAs]** → Links to `#` or page anchor; acceptable for marketing preview. Phase 4 adds real `/events/:id` detail pages.
- **[Legal placeholders not production-ready]** → Structure and DE/EN headings ship now; final copy inserted by counsel without route changes.
- **[Hero stat numbers are static]** → Intentional for marketing polish; live counts deferred to Phase 4+ when catalog exists.
- **[EventCardPreview duplicates Phase 4 EventCard]** → Acceptable short-term; `@unveiled/ui` extraction is explicit Phase 4 scope.

## Migration Plan

1. Add `discoverPageMeta()` and `legalPageMeta()` to `seo.ts`.
2. Create `discover-data.ts` mock module.
3. Create `EventCardPreview`, `DiscoverPage`, and `LegalPage` components.
4. Create four flat route files.
5. Verify navbar active state for `/discover` and footer links for all legal routes.
6. Run `bun run typecheck`, `bun run lint`, manual verification per iteration doc.
7. No database or new env vars beyond existing `SITE_URL`.

## Open Questions

- None blocking — iteration doc and spec deltas resolve scope. Exact mock event titles/partner names can be representative Berlin cultural venues; no product decision required.
