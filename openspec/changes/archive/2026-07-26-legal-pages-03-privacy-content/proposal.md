## Why

Impressum (step 02) fixed the controller identity, but `/de/privacy` and `/en/privacy` still show Platzhalter / “pending legal review” cards. Visitors and members need a clear, bilingual GDPR-oriented Privacy / Datenschutz page that explains what the membership stack processes, why, who receives data, how cookies/consent work, retention, and their rights — with no placeholder strings.

## What Changes

- Replace `legalContent.privacy` DE/EN sections in `apps/web/app/lib/content/legal.ts` with real multi-paragraph `body` copy — zero Platzhalter / “Placeholder —” / “pending legal review” strings inside privacy locale objects.
- Expand section structure to the recommended set: `overview`, `controller`, `data-categories`, `purposes`, `processors`, `cookies`, `retention`, `rights`, `contact` (replace the temporary `processing` id with the richer set).
- Ground facts in step-02 Impressum identity (unveiled berlin; Luisenstraße 53, 10117 Berlin; `support@unveiled.berlin`; phone) plus shipped processors: Neon Auth, Neon Postgres, Stripe Billing, Resend, Cloudflare R2, Cloudflare Workers, Sentry (strictly necessary / not consent-gated), MapLibre + OSM tiles (non-essential, consent-gated).
- Align cookie section with shipped banner behavior; mention account deletion / anonymized booking-ledger retention at a high level; do not claim credits rollover or newsletter product.
- Keep page chrome stable (`eyebrow` Rechtliches/Legal, `pageTitle` Datenschutz / Privacy Policy); tweak `intro` only if needed.
- OpenSpec delta on `static-marketing-pages`: Privacy Policy SHALL describe membership data processing without placeholder copy.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `static-marketing-pages`: Privacy / Datenschutz publishes bilingual controller identity, data categories, purposes/legal bases, key processors, cookie/consent behavior, retention overview, and data-subject rights — without placeholder copy.

## Impact

- **Content only:** `apps/web/app/lib/content/legal.ts` — `privacy` DE/EN sections (and intro if needed). Types/UI already support `body: readonly string[]` from step 01.
- **Unchanged this step:** Terms final wording (04); product docs / e2e hardening (05); cookie banner UI; new GDPR APIs; formal DPA templates; routes/footer/SEO shape.
- **Source brief:** `.dev-plan/current-iteration/legal-pages-03-privacy-content.md`
- **Parent:** `.dev-plan/current-iteration/legal-pages-parent-guide.md`
- **Depends on:** `legal-pages-02-impressum-content` (done)
- **Consumed by:** `legal-pages-04-terms-content` (may cross-link privacy), `legal-pages-05-hardening-and-docs`
- **Verification:** `bun run lint`; `bun run typecheck`; no Platzhalter/pending-legal-review matches inside privacy sections; manual `/de/privacy` and `/en/privacy` mention controller, Stripe, cookies/map consent, and rights
