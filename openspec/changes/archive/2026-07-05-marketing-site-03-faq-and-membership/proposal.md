## Why

Phase 1 steps 01–02 delivered content modules, SEO primitives, the landing page, and how-it-works — but `/faq` and `/membership` still 404. This step completes the core marketing funnel (understand → FAQ → membership) in both locales, adds FAQPage JSON-LD for search rich results, and ships an info-only membership page with corrected non-rollover credit copy before Stripe integration in Phase 6.

## What Changes

- Add `/:locale/faq` route with support header, `HelpSection` component (support mailto, exactly 3 Q&As), and back button linking to `/:locale` for guests.
- Add `FaqAccordion` client island (HeroUI Accordion, `selectionMode="single"`, first item open by default) — the only client interactivity in this step.
- Add `/:locale/membership` info-only plan page using `checkout` copy from `membershipContent` module: title, subtitle, perks list, guarantee, secure-payment line.
- **Correct** perk copy: "17 Credits jeden Monat" / "17 fresh credits every month" — no rollover claim.
- Primary membership CTA renders per spec but is non-functional in Phase 1 (no Stripe SDK, no auth gate, no checkout session).
- Add `buildFaqPageJsonLd()` helper and emit FAQPage JSON-LD on the FAQ route.
- Per-page SEO metadata on both routes via existing `buildPageMeta()` / `c.render()` props.
- Navbar active highlighting for `/faq` and `/membership` paths.
- Export `HelpSection` with optional `compact` prop for future checkout embed (Phase 6).
- **Out of scope:** Stripe Checkout, subscription status, frozen-payment alerts (Phase 6–7); discover and legal pages; cookie banner and sitemap (step 05); signed-in back-button redirect to `/events` (Phase 2+).

## Capabilities

### New Capabilities

- _(none — FAQ and membership requirements extend the existing `static-marketing-pages` capability)_

### Modified Capabilities

- `static-marketing-pages`: Add requirements for FAQ page (HelpSection accordion, support email, back button, FAQPage JSON-LD) and membership info page (plan details, corrected perks, no payment processing in Phase 1).

## Impact

- **New files:** `apps/web/app/routes/[locale]/faq.tsx`, `apps/web/app/routes/[locale]/membership.tsx`, `apps/web/app/components/marketing/HelpSection.tsx`, `apps/web/app/components/marketing/MembershipInfoPage.tsx` (optional page component), `apps/web/app/islands/FaqAccordion.tsx`.
- **Modified files:** `apps/web/app/lib/seo.ts` (FAQPage JSON-LD + page meta helpers), `apps/web/app/lib/locale.ts` or `GuestNavbar` only if active-state fix needed.
- **Dependencies:** no new npm packages — uses existing HeroUI Accordion, content modules, and SEO helper from steps 01–02.
- **Downstream:** `marketing-site-04-discover-and-legal` builds on the same patterns; Phase 6 replaces membership CTA stub with real Stripe checkout.
- **Branch:** `phase-1-marketing-03` or parent Phase 1 branch per iteration convention.
