## 1. Pre-flight

- [x] 1.1 Read `proposal.md`, `design.md`, and `specs/static-marketing-pages/spec.md` end-to-end
- [x] 1.2 Confirm step 02 artifacts are merged: landing, how-it-works, content modules, SEO helpers
- [x] 1.3 Confirm `faq.ts` and `membership.ts` content keys match `static-pages-content.md` and corrected non-rollover perks
- [x] 1.4 Read `docs/migration/features/static-pages.feature` FAQ scenario and `ui-component-map.md` accordion notes

## 2. SEO and structured data helpers

- [x] 2.1 Add `buildFaqPageJsonLd(items)` to `apps/web/app/lib/seo.ts` returning FAQPage schema with three Q&A pairs
- [x] 2.2 Add `faqPageMeta(content)` helper — title "FAQ", description from hero subheadline
- [x] 2.3 Add `membershipPageMeta(content, pageTitle)` helper — nav title, description from subtitle

## 3. FAQ accordion island and HelpSection

- [x] 3.1 Create `apps/web/app/islands/FaqAccordion.tsx` — HeroUI Accordion, `selectionMode="single"`, first item open by default
- [x] 3.2 Create `apps/web/app/components/marketing/HelpSection.tsx` — bordered card with eyebrow, headline, mailto support email, embedded `FaqAccordion`
- [x] 3.3 Add optional `compact?: boolean` prop with `help-section--compact` theme hook (minimal styling OK for step 03)

## 4. FAQ page route

- [x] 4.1 Create `apps/web/app/routes/[locale]/faq.tsx` (flat HonoX route file)
- [x] 4.2 Render `PageHero` with faq hero content (Support eyebrow, FAQ headline, subheadline)
- [x] 4.3 Render `HelpSection` with three Q&As from content module
- [x] 4.4 Render centered back `Link` to `localizedPath(locale, "")` with backButton copy
- [x] 4.5 Emit FAQPage JSON-LD `<script type="application/ld+json">` in SSR output
- [x] 4.6 Pass `c.render()` SEO props: title, description, canonicalPath

## 5. Membership info page route

- [x] 5.1 Create `apps/web/app/routes/[locale]/membership.tsx` (flat HonoX route file)
- [x] 5.2 Render plan title, subtitle, perks list, guarantee, and secure-payment line from `membershipContent`
- [x] 5.3 Verify perks show "17 Credits jeden Monat" / "17 fresh credits every month" — no rollover language
- [x] 5.4 Render primary CTA button with checkout label but disabled/non-functional (no Stripe, no auth)
- [x] 5.5 Do not render promo code, success/error, or already-active checkout states
- [x] 5.6 Pass `c.render()` SEO props with localized page title and description

## 6. Navbar and navigation

- [x] 6.1 Verify `GuestNavbar` highlights FAQ nav item when pathname is `/{locale}/faq`; fix `isActiveNavPath` if needed
- [x] 6.2 Verify `GuestNavbar` highlights Membership nav item when pathname is `/{locale}/membership`

## 7. Validation

- [x] 7.1 Run `bun run typecheck` — exits 0
- [x] 7.2 Run `bun run lint` — exits 0 (pre-existing SVG a11y warning in logo asset only)
- [x] 7.3 Visit `/de/faq` — three German Q&As, `support@unveiled.berlin` mailto, first item expanded; expanding another collapses the first
- [x] 7.4 Visit `/en/membership` — English plan copy, corrected perks, CTA does not redirect to Stripe
- [x] 7.5 View Source on `/de/faq` — FAQPage JSON-LD and unique meta tags in initial HTML
- [x] 7.6 Manual: DE/EN language toggle on `/de/faq` navigates to `/en/faq` preserving path

## 8. Wrap-up

- [x] 8.1 Mark step 03 done in `marketing-site-README.md` when change is archived
