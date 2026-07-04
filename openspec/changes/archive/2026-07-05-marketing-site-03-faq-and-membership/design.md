## Context

Phase 1 steps 01–02 archived with:
- Content modules at `apps/web/app/lib/content/` including `faq.ts` and `membership.ts` with verbatim DE/EN copy (3 FAQ items, corrected non-rollover perks)
- Marketing primitives: `PageHero`, `SectionCard` under `apps/web/app/components/marketing/`
- SEO helper `buildPageMeta()` and `buildOrganizationJsonLd()` in `apps/web/app/lib/seo.ts`
- Landing and how-it-works routes at flat HonoX files (`[locale]/index.tsx`, `[locale]/how-it-works.tsx`)
- `GuestNavbar` with `NAV_ITEMS` already including `faq` and `membership` segments

This step adds `/faq` and `/membership`. Content sources:
- `docs/migration/ui/static-pages-content.md` — FAQ §1–3; membership checkout copy via `content-i18n-inventory.md`
- `docs/migration/extras/seo-and-metadata.md` §4 — FAQPage JSON-LD on `/faq`
- `docs/migration/features/static-pages.feature` — FAQ accordion scenario (one open at a time)
- `docs/migration/ui/ui-component-map.md` — Help/FAQ accordion (HeroUI Accordion inside Card)

Constraints from `AGENTS.md`:
- Client islands only where unavoidable — accordion interactivity requires `FaqAccordion` island
- Copy from content modules only — no inline string literals in route files
- HeroUI components with neo-brutalist tokens; `<script type="application/ld+json">` exception for structured data
- SSR-only mutations — membership CTA is a non-functional stub, not a client-side checkout modal

## Goals / Non-Goals

**Goals:**

- FAQ page at `/:locale/faq` with hero header, `HelpSection`, back button to `/:locale`, FAQPage JSON-LD
- Single-open accordion (first item expanded by default) via `FaqAccordion` island
- Membership info page at `/:locale/membership` with plan title, subtitle, perks, guarantee, secure line, non-functional primary CTA
- Per-page SEO metadata on both routes
- Navbar active highlighting for `/faq` and `/membership`
- `HelpSection` exported with optional `compact` prop for Phase 6 checkout embed
- `bun run typecheck` and `bun run lint` pass

**Non-Goals:**

- Stripe Checkout, subscription status, promo codes, success/error states (Phase 6)
- Auth gate or signed-in back-button redirect to `/events` (Phase 2+)
- Discover page, legal pages, cookie banner, sitemap (steps 04–05)
- Event or Organization JSON-LD (already on landing; Event is Phase 4+)

## Decisions

### 1. Route file layout — flat HonoX files (not nested `index.tsx`)

Create `apps/web/app/routes/[locale]/faq.tsx` and `apps/web/app/routes/[locale]/membership.tsx` as flat route files, matching step 02's `how-it-works.tsx` pattern. HonoX file-based routing in this repo does not register nested `[locale]/faq/index.tsx` reliably.

**Alternative considered:** Nested `index.tsx` per iteration doc path. Rejected based on step 02 learnings documented in archived tasks.

### 2. FAQ page structure — `PageHero` + `HelpSection` + back link

Route renders:
1. **Hero:** `PageHero` with eyebrow "Support", headline "FAQ", subheadline from `getPageContent(locale, "faq").hero`
2. **HelpSection:** bordered card with section eyebrow, headline, mailto support email, and embedded `FaqAccordion` island
3. **Back button:** centered HeroUI `Link` with `button button--secondary` to `localizedPath(locale, "")` — guest-only; signed-in redirect to `/events` deferred to Phase 2

All copy from `faqContent` module — already populated verbatim.

### 3. `HelpSection` component — SSR shell + island slot

`apps/web/app/components/marketing/HelpSection.tsx`:
- Props: `section` (from `FaqContent.section`), optional `compact?: boolean`
- Renders bordered `Card` with eyebrow, headline, mailto `Link` for `supportEmail`
- Embeds `<FaqAccordion items={section.items} />` island for interactive accordion
- `compact` variant: apply a `help-section--compact` BEM modifier (reduced padding / smaller type via theme `@layer components`) — stub the class hook even if visual delta is minimal in step 03

**Rationale:** Keeps SSR shell and SEO-friendly static content in the component; only accordion expand/collapse hydrates client-side.

### 4. `FaqAccordion` island — HeroUI Accordion single selection

`apps/web/app/islands/FaqAccordion.tsx`:
- `"use client"` island registered via HonoX island convention
- HeroUI `Accordion` with `selectionMode="single"` (or equivalent single-expand API)
- Default expanded keys: first item (`"0"` or item id)
- Each item: question as trigger, answer as panel — copy passed as props from SSR parent (no fetch)

Follow existing island pattern from `GuestNavbarMenu.tsx`.

### 5. FAQPage JSON-LD — helper in `seo.ts`

Add `buildFaqPageJsonLd(items: FaqItem[])` returning:

```ts
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": items.map(({ question, answer }) => ({
    "@type": "Question",
    "name": question,
    "acceptedAnswer": { "@type": "Answer", "text": answer }
  }))
}
```

Emit in FAQ route JSX alongside page content (same pattern as Organization JSON-LD on landing).

### 6. Membership info page — centered plan card, stub CTA

`MembershipInfoPage` component (or inline in route if under ~80 lines):
- `PageHero` or display heading block with `title` + `subtitle` from `getPageContent(locale, "membership")`
- Perks as a list (HeroUI `List`/`ListBox` or styled rows inside `Card`)
- Guarantee paragraph + secure-payment line (muted)
- Primary CTA: HeroUI `Button` with `button button--primary`, label from `content.button`, rendered as `<Button isDisabled>` or `href="#"` with `onPress` prevented — **no Stripe redirect, no form**

Do **not** render promo code fields, success/error states, or `alreadyActive` banner — those are Phase 6 checkout flows.

Perks already corrected in `membership.ts`:
- DE: `"17 Credits jeden Monat"`
- EN: `"17 fresh credits every month"`

### 7. Per-page SEO metadata

Add helpers to `seo.ts`:

| Route | `title` | `description` |
|---|---|---|
| `/:locale/faq` | `FAQ` | Localized hero subheadline from faq content |
| `/:locale/membership` | Nav label (`Mitgliedschaft` / `Membership`) | Localized subtitle from membership content |

Pass `c.render()` second-arg props with `canonicalPath` from request pathname.

### 8. Navbar active states

Existing `isActiveNavPath()` exact-match logic should highlight FAQ and Membership nav items when pathname is `/{locale}/faq` or `/{locale}/membership`. Verify in implementation; fix only if trailing-slash normalization fails.

Membership CTA in navbar remains visible on these pages (`showCta = !isLocaleRoot`).

## Risks / Trade-offs

- **[Non-functional membership CTA may confuse testers]** → Button renders with correct label but does nothing; acceptable for Phase 1 info page. Phase 6 replaces with real checkout.
- **[Accordion requires client JS]** → FAQ content is still in SSR HTML inside accordion panels; crawlers get FAQPage JSON-LD separately. Progressive enhancement: first item open by default in island initial state.
- **[Compact HelpSection unused until Phase 6]** → Implement prop + CSS hook now to avoid refactor when checkout embeds help widget.
- **[Back button always goes home in Phase 1]** → Spec defers signed-in `/events` redirect until auth exists; document in component comment.

## Migration Plan

1. Add `buildFaqPageJsonLd()`, `faqPageMeta()`, `membershipPageMeta()` to `seo.ts`.
2. Create `FaqAccordion` island and `HelpSection` component.
3. Create `faq.tsx` and `membership.tsx` routes (+ optional `MembershipInfoPage` component).
4. Verify navbar active states for both paths.
5. Run `bun run typecheck`, `bun run lint`, browser/curl verification per iteration doc.
6. No database or env changes beyond existing `SITE_URL`.

## Open Questions

- None blocking — iteration doc and spec deltas resolve scope. Exact compact HelpSection visual delta can stay minimal until Phase 6 checkout page design is finalized.
