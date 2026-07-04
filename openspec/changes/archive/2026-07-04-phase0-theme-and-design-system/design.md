## Context

Phase 0 step 02 delivered `@unveiled/web` — a HonoX + React 19 SSR app with a minimal `_renderer.tsx` and unstyled scaffold route at `/`. Root `bun run dev`/`build`/`typecheck` work, but there is no Tailwind, no HeroUI, no brand tokens, and no typography. Step 03 applies the Unveiled design system globally so step 04's locale routing and app shell inherit correct styling from the start.

Constraints from `AGENTS.md`, `design-tokens.md`, and `assets-inventory.md`:
- HeroUI v3 (`@heroui/react`, `@heroui/styles`) + Tailwind CSS v4 — not v2 patterns, not shadcn.
- Re-skin HeroUI's built-in **Uber** preset; override color-bearing CSS variables only.
- Yellow (`#FAFF86`) is the **page** background on every route — not grey.
- Work Sans variable (100–900) only — no EK Notice Sans.
- Light mode only; no dark mode toggle.
- Do **not** install `@better-auth-ui/heroui` until Phase 2.
- Neo-brutalist: zero radius globally, hard offset shadows as utility classes.

Current scaffold files to extend:
- `apps/web/vite.config.ts` — honox + node build, no Tailwind yet
- `apps/web/app/routes/_renderer.tsx` — bare HTML shell
- `apps/web/app/routes/index.tsx` — plain `<h1>` scaffold

## Goals / Non-Goals

**Goals:**

- Install and configure HeroUI v3 + Tailwind CSS v4 in `apps/web`.
- Global stylesheet with brand `@theme` tokens, Uber preset color overrides, Work Sans, and neo-brutalist utilities.
- App-wide yellow page background visible on scaffold route.
- Scaffold route demonstrates HeroUI Button + Card with correct tokens (sharp corners, dark borders, Work Sans headings).
- `bun run dev`, `bun run build`, `bun run typecheck`, and `bun run lint` pass with new deps.

**Non-Goals:**

- Navbar, footer, Logo component (step 04).
- Locale routing `/:locale/*` (step 04).
- Favicon, logos, static assets (step 05).
- `@better-auth-ui/heroui` or auth pages (Phase 2).
- Marketing page layouts (Phase 1).
- Client islands or hydration entry (Phase 5+).
- Full headline size utilities (`.headline-xl` etc.) — add when marketing pages land in Phase 1.

## Decisions

### 1. HeroUI v3 — no Provider wrapper

HeroUI v3 does **not** require `<HeroUIProvider>`. Theme is applied via CSS imports and `@theme` overrides in the global stylesheet. The iteration doc mentions a Provider wrapper; that reflects v2 patterns — **do not add a Provider**.

Integration pattern:

```tsx
// _renderer.tsx
import '../styles/globals.css'
// No Provider wrapper — children render directly in <body>
```

```css
/* globals.css — import order matters */
@import "tailwindcss";
@import "@heroui/styles";
```

**Alternative considered:** v2 `HeroUIProvider`. Rejected — wrong API for v3; adds unnecessary SSR complexity.

### 2. Tailwind v4 via `@tailwindcss/vite`

Use the Vite plugin (`@tailwindcss/vite`) rather than PostCSS-only setup — simpler for HonoX's Vite-based build and matches HeroUI v3 docs.

```ts
// vite.config.ts additions
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    honox({ devServer: { adapter } }),
    build(),
  ],
})
```

No separate `tailwind.config.js` — all theme config lives in CSS `@theme` block per Tailwind v4 convention (same as old app).

**Alternative considered:** `@tailwindcss/postcss` + `postcss.config.mjs`. Acceptable but adds config file; Vite plugin is cleaner for this stack.

### 3. Dependencies to add

```json
{
  "dependencies": {
    "@heroui/react": "latest",
    "@heroui/styles": "latest",
    "tailwind-variants": "latest"
  },
  "devDependencies": {
    "tailwindcss": "^4",
    "@tailwindcss/vite": "^4"
  }
}
```

Pin exact versions at `bun add` time. Use `catalog:` only if root catalog gains these entries later.

### 4. Global stylesheet structure

File: `apps/web/app/styles/globals.css`

**Layer 1 — imports (order critical):**

```css
@import "tailwindcss";
@import "@heroui/styles";
```

**Layer 2 — Work Sans (Google Fonts):**

```css
@import url("https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap");
```

Self-hosting `.woff2` is acceptable for SSR performance but deferred — Google Fonts is fine for Phase 0; document swap path in comments.

**Layer 3 — brand tokens in `@theme`:**

```css
@theme {
  --color-brand-yellow: #FAFF86;
  --color-brand-cream: #FEFFE2;
  --color-brand-grey: #F5F5F5;
  --color-brand-dark: #202621;

  --font-sans: "Work Sans", ui-sans-serif, system-ui, sans-serif;

  /* Radius toward zero — override Uber preset defaults */
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --radius-xl: 0;
}
```

**Layer 4 — HeroUI Uber preset color overrides:**

Export the Uber preset from [HeroUI Theme Builder](https://heroui.com/themes), copy the generated `:root` OKLCH variables as baseline, then override color-bearing slots per `design-tokens.md` §2 mapping:

| Slot | Brand token | Hex |
|---|---|---|
| `--background` | brand-yellow | `#FAFF86` |
| `--surface` | white / brand-cream | `#FFFFFF` / `#FEFFE2` |
| `--foreground` | brand-dark | `#202621` |
| `--accent` | brand-yellow | `#FAFF86` |
| `--accent-foreground` | brand-dark | `#202621` |
| `--border` | brand-dark | `#202621` |
| `--field` / `--field-hover` | brand-grey / white | `#F5F5F5` / `#FFFFFF` |
| `--muted` | brand-dark @ ~50% opacity | — |
| `--danger`, `--warning`, `--success` | keep Uber defaults | — |

Convert hex brand colors to OKLCH at implementation time (use Theme Builder export or a converter) — do not hardcode stale OKLCH values in the design doc.

**Layer 5 — base styles:**

```css
body {
  @apply bg-brand-yellow text-brand-dark font-sans antialiased;
}

h1, h2, h3, .display-font {
  @apply font-black uppercase tracking-[-0.05em] leading-[0.9];
}
```

**Layer 6 — neo-brutalist utilities:**

```css
.unveiled-shadow {
  box-shadow: 6px 6px 0 0 #202621;
}
@media (min-width: 768px) {
  .unveiled-shadow {
    box-shadow: 12px 12px 0 0 #202621;
  }
}

.unveiled-card-hover {
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.unveiled-card-hover:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 0 #202621;
}
@media (min-width: 768px) {
  .unveiled-card-hover:hover {
    transform: translate(-4px, -4px);
    box-shadow: 16px 16px 0 0 #202621;
  }
}

::selection {
  @apply bg-brand-dark text-brand-yellow;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .unveiled-card-hover:hover {
    transform: none;
  }
}
```

### 5. Renderer and scaffold route updates

**`_renderer.tsx`:**

- Import `../styles/globals.css`.
- Add `className="min-h-screen bg-brand-yellow"` on `<body>` (belt-and-suspenders with CSS `body` rule).
- Keep minimal HTML shell — no client script tag yet.

**`index.tsx`:**

Update scaffold to demonstrate theme:

```tsx
import { Button, Card } from '@heroui/react'

export default createRoute((c) => {
  return c.render(
    <main className="p-8">
      <h1>Unveiled Berlin — scaffold</h1>
      <Card className="unveiled-shadow mt-6 max-w-md p-6">
        <Card.Header>
          <Card.Title>Theme check</Card.Title>
          <Card.Description>HeroUI + brand tokens</Card.Description>
        </Card.Header>
        <Card.Content>
          <Button variant="primary" className="border-2 border-brand-dark">
            Primary CTA
          </Button>
        </Card.Content>
      </Card>
    </main>,
    { title: 'Unveiled Berlin — scaffold' },
  )
})
```

Use HeroUI v3 compound component API (`Card.Header`, `Card.Title`, etc.) — not v2 flat props.

Accent buttons on yellow backdrop **must** have `border-brand-dark` per design-tokens.md practical implication.

### 6. SSR externalization

Add HeroUI packages to Vite SSR externals if build fails on server bundle:

```ts
ssr: {
  external: ['react', 'react-dom', '@heroui/react'],
},
```

CSS imports are handled by Vite/Tailwind — no SSR issue expected. Adjust based on build output.

### 7. TypeScript

No tsconfig changes expected. HeroUI v3 ships types. Ensure `apps/web/tsconfig.json` includes `app/styles/` if any TS files added there (CSS-only — no change needed).

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| HeroUI v3 API differs from iteration doc (Provider mention) | Follow v3 skill/docs — CSS import only, no Provider |
| `--background` = `--accent` causes yellow-on-yellow UI | Require `border-brand-dark` on accent interactive elements |
| Google Fonts adds external request / SSR flash | Acceptable for Phase 0; self-host variable `.woff2` in step 05 if needed |
| Uber preset OKLCH values version-drift | Export live from Theme Builder at implementation; don't transcribe stale values |
| Tailwind v4 + HonoX SSR build edge cases | Test `bun run build` early; add SSR externals if needed |
| Work Sans Black less blocky than EK Notice Sans | Accepted trade-off per `assets-inventory.md`; treatment (uppercase, tracking) carries display feel |

## Migration Plan

1. Create branch `phase-0-foundation-03`.
2. Add dependencies via `bun add` in `apps/web`.
3. Create `globals.css`, update `vite.config.ts`, `_renderer.tsx`, `index.tsx`.
4. Export Uber preset from Theme Builder; paste and override color variables.
5. Run `bun run dev` — verify yellow background, Work Sans, HeroUI components.
6. Run `bun run build`, `bun run typecheck`, `bun run lint`.
7. No production impact; additive styling layer on existing scaffold.

## Open Questions

- None blocking step 03. Exact `@heroui/react`/`@heroui/styles` patch versions resolved at install time.
- Self-host Work Sans vs Google Fonts CDN — default to Google Fonts for step 03; revisit in step 05 (assets) if performance metrics warrant.
