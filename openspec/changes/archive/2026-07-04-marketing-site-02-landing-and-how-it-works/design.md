## Context

Phase 1 step 01 (`marketing-site-01-i18n-seo-primitives`) archived with:
- Content modules at `apps/web/app/lib/content/` including `landing.ts` and `how-it-works.ts` with verbatim DE/EN copy
- Marketing primitives: `PageHero`, `SectionCard` under `apps/web/app/components/marketing/`
- SEO helper `buildPageMeta()` in `apps/web/app/lib/seo.ts` wired through `_renderer.tsx`
- Placeholder home at `[locale]/index.tsx` — Logo + single discover CTA with smoke-test meta props

This step replaces the placeholder with the full landing page and adds the how-it-works route. Content sources:
- `docs/migration/ui/static-pages-content.md` — Landing §2 Hero + §3 Auth card (CTA labels only); How It Works §1–3
- `docs/migration/extras/seo-and-metadata.md` §2–4 — per-page metadata and Organization JSON-LD
- `docs/migration/features/static-pages.feature` — Landing page and How it works scenarios

Constraints from `AGENTS.md`:
- SSR-only routes; no client islands
- Copy from content modules only — no inline string literals in route files
- HeroUI components with neo-brutalist tokens (`.unveiled-shadow`, thick borders, yellow page background)
- Auth card becomes link CTAs to `/signup` and `/login` — no inline auth form; drop Guest Explorer and Admin Access

## Goals / Non-Goals

**Goals:**

- Full landing page at `/:locale` with hero, CTAs, trust microcopy, conversion card, and English trust badges
- How-it-works page at `/:locale/how-it-works` with hero, 3-step grid, and dark value panel
- Per-page SEO metadata on both routes via existing `buildPageMeta()` / `c.render()` props
- Organization JSON-LD on landing page in initial SSR HTML
- Navbar active highlighting verified for how-it-works (and home behavior documented)
- `bun run typecheck` and `bun run lint` pass

**Non-Goals:**

- FAQ, discover, membership, legal pages (steps 03–04)
- Auth routes or forms (Phase 2)
- Cookie banner, robots.txt, sitemap (step 05)
- Venue check-in banner (Phase 6+)
- FAQPage or Event JSON-LD (later steps)

## Decisions

### 1. Landing page structure — inline route component vs extracted subcomponents

Build the landing page directly in `[locale]/index.tsx` using HeroUI `Button`, `Card`, `Link` and existing marketing primitives. Extract subcomponents (e.g. `LandingConversionCard`, `TrustBadges`) only if the route file exceeds ~120 lines.

**Rationale:** Keeps step 02 focused; extraction can happen in step 03 if patterns repeat.

### 2. Landing hero — no `PageHero` eyebrow

The landing headline is the plain wordmark "Unveiled Berlin" without an eyebrow (per `static-pages-content.md` §2). Render a centered hero block directly rather than forcing `PageHero` (which always renders an `<h1>` in a bordered card). Use a display-style `<h1>` with uppercase tracking tokens; subheadline as muted paragraph below.

**Alternative considered:** Reuse `PageHero` with empty eyebrow. Acceptable but the landing hero is intentionally not a bordered card panel — the conversion card below is the bordered card.

### 3. Conversion card — dual CTA links, not auth form

Extend `LandingContent` type and `landing.ts` with conversion-card keys:

```ts
conversionCard: {
  title: string           // optional heading inside card
  loginCta: string        // "Anmelden" / "Login"
  signupCta: string       // "Registrieren" / "Register"
}
```

Render a bordered white card (`.unveiled-shadow`) with two HeroUI `Button`/`Link` elements:
- Login → `localizedPath(locale, "login")`
- Signup → `localizedPath(locale, "signup")`

Links may 404 until Phase 2 — acceptable per iteration scope. Trust badges render below CTAs inside the card footer, identical English text in both locales.

**Alternative considered:** Tab toggle mimicking old app. Rejected — sitemap mandates separate `/login` and `/signup` routes.

### 4. How-it-works page — reuse `PageHero` + `SectionCard`

Route at `apps/web/app/routes/[locale]/how-it-works/index.tsx`:

1. **Hero:** `PageHero` with eyebrow, headline, subheadline from `getPageContent(locale, "how-it-works").hero`
2. **Steps:** 3-column responsive grid of `SectionCard` tiles (one per step) with step title + body
3. **Why panel:** `SectionCard inverted={true}` with eyebrow as title or separate label, three value-point tiles in a row

All copy from `howItWorksContent` module — already populated verbatim.

### 5. Per-page SEO metadata

Pass `c.render()` second-arg props on both routes:

| Route | `title` (page portion) | `description` |
|---|---|---|
| `/:locale` | `Unveiled Berlin` | Localized subheadline from landing content (~150 chars) |
| `/:locale/how-it-works` | `So funktioniert's` / `How it works` | Localized hero subheadline from how-it-works content |

Use request pathname as `canonicalPath`. Existing renderer emits full head tags.

### 6. Organization JSON-LD — helper + inline script in landing route

Add `buildOrganizationJsonLd()` in `apps/web/app/lib/seo.ts` (or `organization-jsonld.ts` co-located):

```ts
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Unveiled Berlin",
  "url": absoluteUrl(`/${locale}`),
  "email": "support@unveiled.berlin",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Berlin",
    "addressCountry": "DE"
  }
}
```

Emit in landing page JSX:

```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

Address fields are placeholders until Impressum step 04 fills legal copy — aligned with `seo-and-metadata.md` §4.

**Alternative considered:** Extend root renderer with a `jsonLd` prop. Deferred — only landing needs it in step 02; keep script in route for simplicity.

### 7. Navbar active states

Existing `isActiveNavPath()` exact-match logic should highlight "So funktioniert's" / "How it works" when pathname is `/{locale}/how-it-works`. Verify in implementation; no code change expected unless trailing-slash normalization fails.

Home (`/{locale}`) correctly shows no primary nav item as active. Logo link remains the home affordance. `showCta` already hides membership CTA on locale root — preserve this behavior.

### 8. Layout spacing

Wrap both pages in `mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8` container matching other marketing pages. Landing: centered column `max-w-3xl` for hero; conversion card `max-w-lg mx-auto`. How-it-works: full-width sections with `gap-8`/`gap-12` vertical rhythm.

## Risks / Trade-offs

- **[Signup/login 404 until Phase 2]** → Expected; CTAs are visual conversion elements. No redirect stubs needed.
- **[Organization address placeholder]** → Minimal PostalAddress until Impressum step; JSON-LD still valid for name/email/url.
- **[Landing SEO title redundancy]** → Document title "Unveiled Berlin — Unveiled Berlin" is acceptable for homepage; matches smoke-test pattern from step 01.
- **[Conversion card copy not in landing.ts yet]** → Extend content module in this step; keeps route files free of literals.

## Migration Plan

1. Extend `LandingContent` type and `landing.ts` with conversion-card keys.
2. Replace `[locale]/index.tsx` with full landing page + JSON-LD script.
3. Add `[locale]/how-it-works/index.tsx`.
4. Verify navbar active states manually.
5. Run `bun run typecheck`, `bun run lint`, curl verification per iteration doc.
6. No database or env changes beyond existing `SITE_URL`.

## Open Questions

- None blocking — iteration doc and spec deltas resolve scope. Exact conversion-card heading copy can mirror auth tab labels ("Anmelden" / "Login" as section context) or omit a title if design reads cleaner without one.
