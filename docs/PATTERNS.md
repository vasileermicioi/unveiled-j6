# UI Patterns

Common patterns for building pages in Unveiled Berlin. Grounded in shipped Phase 0–1 code; future patterns noted.

---

## 1. Standard marketing page

**Reference:** `how-it-works.tsx`, `FaqPage.tsx`

```tsx
// Route: apps/web/app/routes/[locale]/my-page.tsx
import { createRoute } from "honox/factory";
import { MyPage } from "../../components/marketing/MyPage";
import { getPageContent } from "../../lib/content";
import { getCopy } from "../../lib/copy";
import { isValidLocale, type Locale } from "../../lib/locale";
import { myPageMeta } from "../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const content = getPageContent(locale, "my-page-key");
  const pathname = new URL(c.req.url).pathname;
  const meta = myPageMeta(content);

  return c.render(<MyPage content={content} locale={locale} />, {
    locale,
    title: meta.title,
    description: meta.description,
    canonicalPath: pathname,
  });
});
```

**Page component:**

```tsx
<Surface className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8" variant="transparent">
  <PageHero {...content.hero} />
  {/* sections */}
</Surface>
```

Use **flat route files** (`faq.tsx`) — not nested `faq/index.tsx` (HonoX routing).

---

## 2. Discover home with JSON-LD

**Reference:** `[locale]/index.tsx`

Discover is the locale home (`/:locale`). Legacy `/:locale/discover` redirects here.

```tsx
return c.render(
  <>
    <DiscoverPage content={content} events={events} locale={locale} partners={partners} stats={stats} />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd(locale)) }}
    />
  </>,
  { locale, title: meta.title, description: meta.description, canonicalPath: pathname },
);
```

---

## 3. FAQ with JSON-LD

**Reference:** `[locale]/faq.tsx`

Same as landing pattern with `buildFaqPageJsonLd(content.section.items)`.

---

## 4. SEO metadata pattern

**Helpers in** `lib/seo.ts`:

```tsx
export function myPageMeta(content: MyContent, pageTitle?: string) {
  return {
    title: pageTitle ?? content.hero.headline,
    description: content.hero.subheadline,
  };
}
```

**Route passes to renderer:**

```tsx
c.render(<Page />, {
  locale,
  title: meta.title,           // becomes "Title — Unveiled Berlin"
  description: meta.description,
  canonicalPath: pathname,     // buildPageMeta adds hreflang alternates
});
```

Public pages: unique title + description per `docs/product/extras/seo-and-metadata.md`.

---

## 5. Content module pattern

**Add page copy:**

1. Define type in `lib/content/types.ts` → extend `PageContentMap`
2. Create `lib/content/my-page.ts` with `de` / `en` objects
3. Register in `lib/content/index.ts` `contentByKey`
4. Use `getPageContent(locale, "my-page-key")` in route

Never duplicate copy in components.

---

## 6. Shell copy vs page copy

| Need | Source |
|---|---|
| Nav label "FAQ" | `getCopy(locale).nav.faq` |
| FAQ question text | `getPageContent(locale, "faq").section.items` |
| Footer legal link | `getCopy(locale).footer.legal.impressum` |
| Impressum body | `getPageContent(locale, "impressum")` |

---

## 7. Navigation & active states

```tsx
const href = localizedPath(locale, NAV_SEGMENTS.faq);
const isActive = isActiveNavPath(pathname, href);
```

`AppNavbar` maps slim `NAV_ITEMS` (Discover + FAQ) → links with active highlighting.

Language switch: `switchLocalePath(pathname, "en")` preserves path.

---

## 8. Inverted content panel

**Reference:** `HowItWorksPage.tsx`

```tsx
<SectionCard inverted title={content.whyItWorks.eyebrow}>
  <Surface className="grid gap-4 md:grid-cols-3" variant="transparent">
    {content.whyItWorks.points.map((point) => (
      <Surface className="value-tile" key={point} variant="transparent">
        <Paragraph className="font-semibold uppercase leading-snug" size="sm">
          {point}
        </Paragraph>
      </Surface>
    ))}
  </Surface>
</SectionCard>
```

---

## 9. Accordion block (FAQ style)

**Reference:** `HelpSection` + `FaqAccordion` + `.help-section` theme

Collapsed items: white bordered box, uppercase question.  
Expanded item: dark header + cream text, answer panel below with normal body copy.

Island required for interactivity. SSR fallback must match visual structure.

---

## 10. Disabled CTA placeholder (pre-Stripe)

**Reference:** `MembershipInfoPage.tsx`

```tsx
<Button
  className="button button--primary button--md button--full-width"
  isDisabled
  type="button"
>
  {content.button}
</Button>
```

Info-only pages render correct label but no payment action until Phase 6.

---

## 11. Island hydration pattern

**Reference:** `FaqAccordion.tsx`, `AppNavbarMenu.tsx`

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) return <StaticFallback {...props} />;
return <InteractiveHeroUIComponent {...props} />;
```

Static fallback uses same theme classes as interactive version.

---

## 12. Form GET filters (future — event feed)

**Spec:** `docs/product/extras/pagination-and-search.md`

List pages use query params + SSR — not client filter state:

```text
/events?category=theatre&from=2026-07-01&page=2
```

Filters submit via `<form method="get">` — page re-renders server-side.

---

## 13. Form POST mutation (future — all CRUD)

**Spec:** `docs/product/sitemap/sitemap.md`

Every mutation = dedicated page + POST handler:

```text
GET  /admin/events/new     → form page
POST /admin/events/new     → validate, insert, redirect
GET  /admin/events/:id     → success or list
```

No modals. No client-only `fetch` mutations for create/update/delete.

See [`examples/event-form.md`](examples/event-form.md).

---

## 14. Multi-step wizard (future — onboarding)

One route per step, form POST advances:

```text
/onboarding/age → POST → /onboarding/interests → … → /membership
```

Progress indicator in theme. See [`examples/wizard.md`](examples/wizard.md).

---

## 15. List / dashboard (future — admin, partner)

SSR table or card grid + pagination query params. Search as GET form.

See [`examples/dashboard.md`](examples/dashboard.md).

---

## 16. Role-based route layout (future)

Same `AppShell` evolves or swaps navbar by session role:

- Guest: slim `AppNavbar` (Discover + FAQ + Log in)
- Member: same marketing nav + credits badge, saved/bookings links
- Partner: `/partner/*` nav (post-MVP)
- Admin: `/admin/*` nav

Single app — conditional chrome, not separate deployables.

---

## Anti-patterns

| Don't | Do instead |
|---|---|
| Modal for create/edit | Dedicated SSR page + POST |
| Inline copy strings | Content module |
| `text-red-500` in TSX | Theme token in globals.css |
| Client-only booking flow | `/events/:id/book` page |
| Nested route `index.tsx` | Flat `my-page.tsx` |
| Hydrate accordion without fallback | Static SSR markup until mounted |

---

## Related docs

- [`COMPONENTS.md`](COMPONENTS.md) — building blocks
- [`UX_RULES.md`](UX_RULES.md) — interaction detail
- [`DESIGN.md`](DESIGN.md) — file layout
