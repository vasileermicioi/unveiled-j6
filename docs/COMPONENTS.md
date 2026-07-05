# Components

Reusable UI components in the codebase. **Reuse these before creating new ones.**

Implementation: `apps/web/app/components/`  
Theme classes: `apps/web/app/styles/globals.css`

---

## App shell

### `AppShell`

**Path:** `components/AppShell.tsx`  
**Used by:** `[locale]/_renderer.tsx` (every locale page)

Wraps all pages: `GuestNavbar` + main (`pt-16 md:pt-20`) + `GuestFooter`.

```tsx
<AppShell locale={locale} pathname={pathname}>
  {children}
</AppShell>
```

---

### `GuestNavbar`

**Path:** `components/GuestNavbar.tsx`

Fixed header: logo, desktop nav, DE/EN toggle, membership CTA, mobile menu island.

- Nav items from `NAV_ITEMS` + `getCopy(locale).nav`
- Active state via `isActiveNavPath(pathname, href)`
- Membership CTA hidden on locale root (`isLocaleRoot`)
- Theme: `.site-header`, `.nav-link`, `.lang-toggle`

---

### `GuestFooter`

**Path:** `components/GuestFooter.tsx`

Three-column footer: brand, navigation links, legal links, contact email.

- Copy from `getCopy(locale).footer`
- Links via `localizedPath()`
- Theme: `.site-footer`, `.footer-link`

---

### `Logo`

**Path:** `components/Logo.tsx`

```tsx
<Logo tone="black" | "white" | "yellow" className="..." />
```

SVG via `<img>` — allowed exception. Tones map to `/logos/unveiled-logo-*.svg`.

---

### `NavLink`

**Path:** `components/NavLink.tsx`

Styled nav link with `nav-link` class and `aria-current="page"` when active.

```tsx
<NavLink href={href} isActive={isActive} label={label} />
```

---

### `NotFoundPage`

**Path:** `components/NotFoundPage.tsx`

Localized 404 with secondary back-to-home CTA.

---

## Marketing primitives

### `PageHero`

**Path:** `components/marketing/PageHero.tsx`  
**Theme:** `.page-hero`

Bordered card hero with optional eyebrow, H1 headline, description.

```tsx
<PageHero
  eyebrow="Support"
  headline="FAQ"
  description="Subheadline text"
/>
```

Use for **card-style** page intros (how-it-works). Not for FAQ (uses direct-on-yellow hero instead).

---

### `SectionCard`

**Path:** `components/marketing/SectionCard.tsx`

Generic content card with optional title, description, children.

```tsx
<SectionCard title="Step title" description="Body" />
<SectionCard inverted title="Why this works">
  {/* value tiles */}
</SectionCard>
```

- `inverted={true}` → dark panel (`card--secondary`)
- Pair with `.value-tile` for inner tiles

---

### `HelpSection`

**Path:** `components/marketing/HelpSection.tsx`  
**Theme:** `.help-section`, `.faq-accordion`

FAQ/support card: eyebrow, headline, mailto email, accordion island.

```tsx
<HelpSection section={content.section} />
<HelpSection section={content.section} compact />  {/* Phase 6 checkout embed */}
```

Embeds `FaqAccordion` island. Reuse on standalone FAQ and future checkout help widget.

---

## Marketing pages

### `LandingPage`

**Path:** `components/marketing/LandingPage.tsx`  
**Route:** `[locale]/index.tsx`

Logo hero, subheadline, discover/how-it-works CTAs, conversion card (signup/login links), trust badges.

Props: `{ locale, landing: LandingContent }`

---

### `HowItWorksPage`

**Path:** `components/marketing/HowItWorksPage.tsx`  
**Route:** `[locale]/how-it-works.tsx`

Composes `PageHero` + 3× `SectionCard` steps + inverted `SectionCard` with value tiles.

Props: `{ content: HowItWorksContent }`

---

### `FaqPage`

**Path:** `components/marketing/FaqPage.tsx`  
**Route:** `[locale]/faq.tsx`

Direct-on-yellow hero (`.faq-hero`) + `HelpSection` + back button.

Props: `{ locale, content: FaqContent }`

---

### `MembershipInfoPage`

**Path:** `components/marketing/MembershipInfoPage.tsx`  
**Route:** `[locale]/membership.tsx`

Plan card: title, subtitle, perks, guarantee, **disabled** checkout button, secure line.

Props: `{ content: MembershipCheckoutContent }`

**Note:** `.membership-info` theme block not yet in `globals.css` — add when styling membership page further.

---

## Client islands

Islands live in `apps/web/app/islands/`. Import from components; HonoX hydrates automatically.

### `FaqAccordion`

**Path:** `islands/FaqAccordion.tsx`

HeroUI Accordion, single-open, first item expanded. SSR static fallback with matching `.faq-accordion--static` classes.

```tsx
<FaqAccordion items={section.items} />
```

---

### `GuestNavbarMenu`

**Path:** `islands/GuestNavbarMenu.tsx`

Mobile drawer nav. SSR fallback: disabled Menu button until mounted.

---

## Future components (not built — do not invent locally)

From `docs/migration/ui/ui-component-map.md` — will land in later phases:

| Component | Phase | Package / location |
|---|---|---|
| `EventCard` | 4 | `@unveiled/ui` |
| `EventMap` | 5 | island in `apps/web` |
| Auth forms | 2 | `@better-auth-ui/heroui` |
| Admin tables | 4+ | `apps/web/app/components/admin/` |
| Booking confirmation | 6 | `apps/web/app/components/` |

See [`examples/`](examples/) for blueprints.

---

## HeroUI primitives (use directly)

When no wrapper exists, compose from `@heroui/react`:

| Primitive | Typical use |
|---|---|
| `Surface` | Layout wrappers (`variant="transparent"`) |
| `Card` / `Card.Header` / `Card.Content` | Bordered panels |
| `Heading` | Page and section titles |
| `Paragraph` | Body, eyebrows (`color="muted"`, `size="sm"`) |
| `Link` | Navigation + button-styled CTAs |
| `Button` | Form submits, disabled placeholders |
| `Chip` | Trust badges, category labels |
| `Drawer` | Mobile menus |
| `Accordion` | FAQ (via island only) |
| `Separator` | Card dividers |

Refer to `.agents/skills/heroui-react/SKILL.md` for HeroUI v3 compound API.

---

## Adding a new component

1. Check this list and `ui-component-map.md` — extend existing if possible
2. Place in `components/` or `components/marketing/` (or domain subfolder in later phases)
3. Accept typed content props — no inline copy
4. Add scoped theme block to `globals.css` if new visual pattern
5. Wire in a thin route file
6. Update this document
