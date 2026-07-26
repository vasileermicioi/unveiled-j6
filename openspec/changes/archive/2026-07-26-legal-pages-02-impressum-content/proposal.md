## Why

Footer LEGAL → Imprint still shows placeholder Impressum cards after the content-model upgrade. Visitors need complete bilingual operator identity (provider, contact, responsible person, disclaimer, copyright, privacy pointer) grounded in the live [unveiled-berlin.de/impressum](https://unveiled-berlin.de/impressum) reference plus the app support email — before Privacy/Terms can correctly refer to that identity.

## What Changes

- Replace `legalContent.impressum` DE/EN sections in `apps/web/app/lib/content/legal.ts` with real multi-paragraph `body` copy — no “Platzhalter” / “Placeholder —” strings on Impressum.
- Align section ids/titles to the operator imprint structure: `provider`, `contact`, `responsible`, `liability`, `copyright`, `privacy-note` (remove unused `register` unless real Handelsregister / USt-IdNr are supplied).
- Use reference facts: unveiled berlin; represented by Pia Sonnekalb and Sarah Michot; Luisenstraße 53, 10117 Berlin, Deutschland; phone (+49) 157 878 16 930; content responsibility § 55 Abs. 2 RStV; standard Haftungsausschluss / Urheberrecht adapted from the reference with natural EN equivalents.
- Contact email: `support@unveiled.berlin` (app SoT), not inventing alternate marketing addresses as primary legal contact.
- Keep page chrome stable (`eyebrow` / `pageTitle`); tweak `intro` only if needed so it is not contradictory.
- OpenSpec delta on `static-marketing-pages`: Impressum SHALL show real operator identity without placeholder copy.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `static-marketing-pages`: Impressum/Imprint publishes bilingual operator identity, contact, content-responsibility, liability, copyright, and a short privacy pointer — without placeholder copy.

## Impact

- **Content only:** `apps/web/app/lib/content/legal.ts` — `impressum` DE/EN sections (and intro if needed). Types/UI already support `body: readonly string[]` from step 01.
- **Unchanged this step:** Privacy / Terms final wording (03–04); product docs / e2e hardening (05); routes; footer labels; SEO meta shape; inventing register/VAT numbers.
- **Source brief:** `.dev-plan/current-iteration/legal-pages-02-impressum-content.md`
- **Parent:** `.dev-plan/current-iteration/legal-pages-parent-guide.md`
- **Depends on:** `legal-pages-01-content-model-and-ui` (done)
- **Consumed by:** `legal-pages-03-privacy-content` (controller identity), `legal-pages-05-hardening-and-docs`
- **Verification:** `bun run lint`; `bun run typecheck`; no Platzhalter/pending-legal-review matches inside impressum sections; manual `/de/impressum` and `/en/impressum` show names, address, phone, email
