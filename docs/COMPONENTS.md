# Components

Reusable UI components in the codebase. **Reuse these before creating new ones.**

Implementation: `apps/web/app/components/`  
Theme classes: `apps/web/app/styles/globals.css`

---

## App shell

### `AppShell`

**Path:** `components/AppShell.tsx`  
**Used by:** `[locale]/_renderer.tsx` (every locale page)

Wraps all pages: `AppNavbar` + main (`pt-16 md:pt-20`) + `GuestFooter`.

```tsx
<AppShell locale={locale} pathname={pathname}>
  {children}
</AppShell>
```

---

### `AppNavbar`

**Path:** `components/AppNavbar.tsx`

Sticky header: logo, Discover (primary) + FAQ, DE/EN toggle, Log in (guest) or role tools (member/admin), mobile drawer island.

- Marketing nav from `NAV_ITEMS` (`discover`, `faq`) + `getCopy(locale).nav`
- Active state via `isActiveNavPath(pathname, href)` / `aria-current`
- Guest header: Log in only — no Sign up, How it works, Membership, or logo tagline
- How it works / Membership remain in `GuestFooter` and page CTAs
- Theme: `.site-header`, `.nav-link`, `.lang-toggle`, `button--primary` (Discover)

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

### `LandingPage` (unused route)

**Path:** `components/marketing/LandingPage.tsx`  
**Note:** Locale home is Discover (`/:locale`). This component remains for Ladle/reference only.  
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

**Note:** `.membership-hero` shares Discover hero card padding in `globals.css`.

---

## Auth pages (Phase 2)

Built with `@better-auth-ui/heroui` + `@better-auth-ui/react`. Routes: `[locale]/login`, `signup`, `forgot-password`, `reset-password`. See `design-tokens.md` § Auth page structure.

### `AuthPageLayout`

**Path:** `components/AuthPageLayout.tsx`

SSR shell: localized page title + description on yellow, slot for hydrated auth form. Does not duplicate library footer links.

Props: `{ locale, page: "login" | "signup" | "forgotPassword" | "resetPassword", children }`

### `AppAuthProvider`

**Path:** `components/AppAuthProvider.tsx`

Wraps `@better-auth-ui/heroui` `AuthProvider` with locale-aware paths, Google OAuth, signup name fields, and DE form copy. Used inside auth islands only — not global.

Props: `{ locale, children }`

### Auth islands

| Island | Library view | Route |
|---|---|---|
| `AuthSignIn` | `SignIn` | `[locale]/login.tsx` |
| `AuthSignUp` | `SignUp` | `[locale]/signup.tsx` |
| `AuthForgotPassword` | `ForgotPassword` | `[locale]/forgot-password.tsx` |
| `AuthResetPassword` | `ResetPassword` | `[locale]/reset-password.tsx` |

All pass `className="auth-form"` and `variant="default"`. Theme: `.auth-form` block in `globals.css`.

Supporting modules: `lib/auth-client.ts`, `lib/auth-ui-config.ts`, `lib/auth-content.ts`, `lib/auth-localization.ts`.

---

## Client islands

Islands live in `apps/web/app/islands/`. Import from components; HonoX hydrates automatically. Auth islands are documented under **Auth pages (Phase 2)** above.

### `FaqAccordion`

**Path:** `islands/FaqAccordion.tsx`

HeroUI Accordion, single-open, first item expanded. SSR static fallback with matching `.faq-accordion--static` classes.

```tsx
<FaqAccordion items={section.items} />
```

---

### `AppNavbarMenu`

**Path:** `islands/AppNavbarMenu.tsx`

Mobile drawer nav (slim IA matches desktop). SSR fallback: disabled Menu button until mounted.

---

## Future components (not built — do not invent locally)

From `docs/product/ui/ui-component-map.md` — will land in later phases:

| Component | Phase | Package / location |
|---|---|---|
| `EventCard` | 4 | `@unveiled/ui` |
| `EventMap` | 5 | MapLibre GL JS + OSM tiles — client island in `apps/web/app/islands/` |
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
