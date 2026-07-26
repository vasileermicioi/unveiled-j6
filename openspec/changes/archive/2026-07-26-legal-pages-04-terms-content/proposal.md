## Why

Privacy and Impressum (steps 02–03) now ship real bilingual copy, but `/de/terms` and `/en/terms` still show Platzhalter / “pending legal review” cards. Visitors and members need general Terms of Service / AGB that explain membership, credits (no rollover), booking/admission, cancellation, liability, and governing law — aligned with `docs/product/` rather than the old marketing-site FAQ that incorrectly claimed credits roll over.

## What Changes

- Replace `legalContent.terms` DE/EN sections in `apps/web/app/lib/content/legal.ts` with real multi-paragraph `body` copy — zero Platzhalter / “Placeholder —” / “pending legal review” strings anywhere in `legal.ts` after this step.
- Expand section structure to the recommended set: `scope`, `membership`, `credits`, `booking`, `cancellation`, `liability`, `changes`, `governing-law`, `contact` (replace the temporary 3-section stub).
- Encode product facts: monthly subscription for curated Berlin partner-venue events; monthly credit allotment; **unused credits do not roll over**; bookings spend credits and redeem via secret codes; capacity/waitlist at a high level; cancellation via Stripe Customer Portal / in-app billing with access until period end; operator may change lineup / event cancellations may refund credits; German law / Berlin venue; contact `support@unveiled.berlin`.
- Keep page chrome stable (`eyebrow` Rechtliches/Legal, `pageTitle` AGB / Terms of Service); optional short counsel-disclaimer in `intro` only; optional one-line cross-links to Privacy / Impressum.
- OpenSpec delta on `static-marketing-pages`: Terms SHALL describe membership, credits (no rollover), booking, and cancellation without placeholder copy.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `static-marketing-pages`: Terms of Service / AGB publishes bilingual membership, credits (explicit no rollover), booking/admission, cancellation, liability, and governing-law copy — without placeholder strings.

## Impact

- **Content only:** `apps/web/app/lib/content/legal.ts` — `terms` DE/EN sections (and intro if needed). Types/UI already support `body: readonly string[]` from step 01.
- **Unchanged this step:** Stripe Checkout / webhook code; formal Widerrufsbelehrung PDF flow; product docs / e2e hardening (05); routes/footer/SEO shape.
- **Source brief:** `.dev-plan/current-iteration/legal-pages-04-terms-content.md`
- **Parent:** `.dev-plan/current-iteration/legal-pages-parent-guide.md`
- **Depends on:** `legal-pages-03-privacy-content` (done)
- **Consumed by:** `legal-pages-05-hardening-and-docs`
- **Verification:** `bun run lint`; `bun run typecheck`; no Platzhalter/pending-legal-review matches in `legal.ts`; no-rollover phrasing only (never claim credits roll over); manual `/de/terms` and `/en/terms` show membership, credits, booking, cancellation sections
