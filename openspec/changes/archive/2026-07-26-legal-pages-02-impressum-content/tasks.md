## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/legal-pages-02-impressum-content.md` and parent guide release criteria / non-goals / Risks
- [x] 1.2 Confirm prerequisites from step 01: `LegalSection.body`, multi-paragraph `LegalPage`, `legalContent.impressum` in `legal.ts`
- [x] 1.3 Re-check https://unveiled-berlin.de/impressum for operator updates before writing final strings

## 2. Impressum content

- [x] 2.1 Rewrite DE `impressumSections` in `apps/web/app/lib/content/legal.ts` with sections `provider`, `contact`, `responsible`, `liability`, `copyright`, `privacy-note` from reference + `support@unveiled.berlin`; omit `register` unless real register/VAT values are supplied
- [x] 2.2 Rewrite EN impressum sections with the same facts and natural English (titles per step-plan table; keep stable ids)
- [x] 2.3 Keep eyebrow/title chrome stable; adjust `intro` only if contradictory; ensure no Platzhalter / Placeholder / pending-legal-review substrings remain in impressum locale objects

## 3. Verification and handoff

- [x] 3.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 3.2 Run `rg -n "Platzhalter|pending legal review" apps/web/app/lib/content/legal.ts` and confirm no matches inside impressum sections (privacy/terms may still be temporary)
- [x] 3.3 Manual smoke: `/de/impressum` and `/en/impressum` show representatives, Berlin address, phone, and `support@unveiled.berlin`
- [x] 3.4 Mark step 02 done in `legal-pages-parent-guide.md`; flag missing register/VAT in parent Risks if still unknown; defer full product-doc sync to step 05
