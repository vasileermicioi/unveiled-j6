## 1. Pre-flight

- [x] 1.1 Confirm step 03 theme is applied (`globals.css`, HeroUI, yellow background on dev server)
- [x] 1.2 Read `proposal.md`, `design.md`, and `specs/platform-foundation/spec.md`
- [x] 1.3 Read `docs/migration/sitemap/sitemap.md` locale section and `docs/migration/ui/app-shell.md` end-to-end
- [x] 1.4 Read `docs/migration/ui/assets-inventory.md` Logo component contract

## 2. Locale helpers and copy

- [x] 2.1 Create `apps/web/app/lib/locale.ts` with `Locale` type, `LOCALES`, `DEFAULT_LOCALE`, `parseAcceptLanguage`, `switchLocalePath`, `localizedPath`, `isActiveNavPath`
- [x] 2.2 Create `apps/web/app/lib/copy.ts` with DE/EN strings for nav labels, footer columns, home CTA, and 404 message

## 3. Shell components

- [x] 3.1 Create `apps/web/app/components/Logo.tsx` with `tone?: 'black' | 'white' | 'yellow'` prop and text fallback when SVG absent
- [x] 3.2 Create `apps/web/app/components/GuestFooter.tsx` with verbatim DE/EN copy, four-column desktop layout (brand + navigation + legal + contact), mobile stack
- [x] 3.3 Create `apps/web/app/islands/GuestNavbarMenu.tsx` client island with HeroUI Navbar menu toggle and mobile drawer links
- [x] 3.4 Create `apps/web/app/components/GuestNavbar.tsx` — sticky header, logo + tagline (lg+), desktop nav links with active yellow highlight, SSR language toggle links, guest CTA (hidden on locale root), embed mobile island
- [x] 3.5 Create `apps/web/app/components/AppShell.tsx` wrapping Navbar, main content offset, and Footer

## 4. Routes and middleware

- [x] 4.1 Replace `apps/web/app/routes/index.tsx` with `GET /` → 302 redirect using `parseAcceptLanguage` (fallback `de`)
- [x] 4.2 Create `apps/web/app/routes/[locale]/_middleware.ts` validating `locale ∈ {de, en}`; invalid → `notFound()`
- [x] 4.3 Create `apps/web/app/routes/[locale]/_renderer.tsx` nested renderer wrapping children in `AppShell` with locale and pathname props
- [x] 4.4 Create `apps/web/app/routes/[locale]/index.tsx` placeholder home — Logo + "Entdecken"/"Discover" CTA to `/:locale/discover`
- [x] 4.5 Create `apps/web/app/routes/_404.tsx` with `noindex` meta, localized message, shell when locale prefix is valid
- [x] 4.6 Update `apps/web/app/routes/_renderer.tsx` — dynamic `<html lang>`, optional robots meta prop, enable `<Script src="/app/client.ts" />` for navbar island

## 5. Validation

- [x] 5.1 `curl -I http://localhost:<port>/` — 302 to `/de` (no Accept-Language) or matching locale header
- [x] 5.2 `curl -s http://localhost:<port>/de` — SSR HTML with navbar, footer, yellow background, DE copy
- [x] 5.3 `curl -s http://localhost:<port>/en` — EN copy in shell
- [x] 5.4 Language toggle on `/de` navigates to `/en` (same path suffix); reverse works
- [x] 5.5 `curl -s http://localhost:<port>/de/nonexistent` — 404 page with `noindex` meta
- [x] 5.6 `curl -s http://localhost:<port>/fr` — 404 page
- [x] 5.7 Mobile viewport: hamburger opens drawer with nav links (browser devtools check)
- [x] 5.8 No client-side console errors on `/de` and `/en`
- [x] 5.9 Run `bun run build`, `bun run typecheck`, `bun run lint` — all pass

## 6. Wrap-up

- [ ] 6.1 Commit on branch `phase-0-foundation-04` (or parent `phase-0-foundation`)
- [ ] 6.2 Mark step 04 done in parent iteration guide when merged
