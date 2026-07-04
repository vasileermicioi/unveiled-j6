## 1. Pre-flight

- [x] 1.1 Confirm step 02 artifacts exist (`apps/web` scaffold, `_renderer.tsx`, `index.tsx`, `vite.config.ts`)
- [x] 1.2 Read `proposal.md`, `design.md`, and `specs/platform-foundation/spec.md`
- [x] 1.3 Read `docs/migration/ui/design-tokens.md` §1–§3 and `assets-inventory.md` font decision end-to-end
- [x] 1.4 Export Uber preset from [HeroUI Theme Builder](https://heroui.com/themes) for baseline OKLCH variables

## 2. Dependencies and build config

- [x] 2.1 Add `@heroui/react`, `@heroui/styles`, and `tailwind-variants` to `apps/web` dependencies
- [x] 2.2 Add `tailwindcss` and `@tailwindcss/vite` to `apps/web` devDependencies
- [x] 2.3 Run `bun install` from repository root
- [x] 2.4 Add `@tailwindcss/vite` plugin to `apps/web/vite.config.ts` (before honox plugin)

## 3. Global stylesheet

- [x] 3.1 Create `apps/web/app/styles/globals.css` with Tailwind + HeroUI style imports (correct order)
- [x] 3.2 Add Work Sans Google Fonts import and `--font-sans` in `@theme` block
- [x] 3.3 Add brand color tokens (`brand-yellow`, `brand-cream`, `brand-grey`, `brand-dark`) in `@theme`
- [x] 3.4 Paste Uber preset baseline variables; override color-bearing slots per `design-tokens.md` mapping
- [x] 3.5 Set radius tokens toward zero in `@theme`
- [x] 3.6 Add `body` base styles (yellow background, dark text, Work Sans)
- [x] 3.7 Add display heading rules for `h1, h2, h3, .display-font` (900 weight, uppercase, tracking, line-height)
- [x] 3.8 Add `.unveiled-shadow` and `.unveiled-card-hover` utilities with responsive breakpoints
- [x] 3.9 Add selection colors and `prefers-reduced-motion` baseline

## 4. App integration

- [x] 4.1 Import `globals.css` in `apps/web/app/routes/_renderer.tsx`
- [x] 4.2 Add `min-h-screen bg-brand-yellow` on `<body>` in `_renderer.tsx`
- [x] 4.3 Update `apps/web/app/routes/index.tsx` with HeroUI Card + Button theme demo (compound API, `border-brand-dark` on accent button)
- [x] 4.4 Add `@heroui/react` to Vite SSR externals if build requires it

## 5. Validation

- [x] 5.1 Run `bun run dev` — page background is `#FAFF86`; body text uses Work Sans; no font 404s
- [x] 5.2 Visual check: HeroUI Card has sharp corners; Button has visible dark border on yellow backdrop
- [x] 5.3 View page source — CSS references brand-yellow background (not grey)
- [x] 5.4 Run `bun run build` — succeeds with Tailwind/HeroUI SSR
- [x] 5.5 Run `bun run typecheck` — passes
- [x] 5.6 Run `bun run lint` — Biome exits 0

## 6. Wrap-up

- [ ] 6.1 Commit on branch `phase-0-foundation-03` (or parent `phase-0-foundation`)
- [ ] 6.2 Mark step 03 done in parent iteration guide when merged
