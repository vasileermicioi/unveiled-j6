# Proposal: faq-refresh-01-content-module

## Why

The FAQ page ships only 3 booking-only Q&As hardcoded in `apps/web/app/lib/content/faq.ts`, while product approved a richer 11-question FAQ (membership, Credits usage/pricing, rollover, cancellations, rescheduling, account sharing, partner-organised experiences) in `.dev-plan/FAQs.md`. Step 01 of the `faq-refresh` parent feature replaces the content module so both locales render the approved copy with **zero UI/UX change** — same types, components, accordion behavior, and SEO wiring (JSON-LD is derived from the same `section.items` array in `apps/web/app/routes/[locale]/faq.tsx:18`).

## What Changes

- Replace `faqContent.de.section.items` and `faqContent.en.section.items` in `apps/web/app/lib/content/faq.ts` with the 11 approved Q&As per locale (EN verbatim from `.dev-plan/FAQs.md` per AGENTS.md hard rule 5; the "cancel too late or don't show up" bold sub-question becomes its own item #6; markdown mailto links flattened to plain text `support@unveiled.berlin` because `FaqItem.answer` is a plain string).
- Update `hero.subheadline` in both locales to match the new topic mix (booking/check-in no longer the focus):
  - DE: `Alles Wichtige zu Mitgliedschaft, Credits, Buchung und Storno an einem Ort.`
  - EN: `Everything important about membership, credits, booking, and cancellation in one place.`
- Item 4 (2-month Credit rollover) ships **verbatim** — a deliberate, owner-approved forward promise (parent-guide decision 2026-08-30); the credit-engine rollover lands in a later iteration.
- Keep `hero.eyebrow`, `hero.headline`, `section.eyebrow`, `section.headline`, `section.supportEmail`, locale keys, `types.ts`, and `index.ts` unchanged.
- No new files, no new exports, no styling changes (hard rules 9). Out of scope: `FaqPage.tsx`, `HelpSection.tsx`, `FaqAccordion.tsx`, the `faq.tsx` route, `seo.ts`, `copy.ts`, e2e specs, and docs (owned by `faq-refresh-02`/`03`).

## Capabilities

### New Capabilities

(None — behavior belongs to an existing capability.)

### Modified Capabilities

- `static-marketing-pages`: adds the normative "FAQ page content" requirement covering the refreshed 11-item bilingual FAQ, hero subheadline, unchanged layout/accordion behavior, and JSON-LD mirroring the visible accordion. (The delta is written as `## ADDED Requirements` because the canonical `openspec/specs/static-marketing-pages/spec.md` has no FAQ content requirement yet; the parent step plan labels the same delta "MODIFIED" relative to the shipped 3-item content.)

## Impact

- **Code:** `apps/web/app/lib/content/faq.ts` only (copy swap + 2 subheadline strings).
- **Rendering:** `/de/faq` and `/en/faq` accordions grow from 3 to 11 items; FAQ JSON-LD (`buildFaqPageJsonLd`) and `faqPageMeta` pick the change up automatically from the same source array.
- **Tests:** unit/type/lint suites unaffected (`seo.test.ts`, `sitemap.test.ts` do not assert FAQ item copy). E2E FAQ selectors in `e2e/specs/static-pages.spec.ts` are coupled to the old question copy and will go red — **intentionally deferred to `faq-refresh-02`** (steps 01 and 02 merge back-to-back per parent guide).
- **Docs:** `docs/product/ui/static-pages-content.md` §FAQ becomes stale until step 03 updates it (do not edit in this step).
- **Dependencies/runtime:** none.
