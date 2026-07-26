## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/legal-pages-03-privacy-content.md` and parent guide release criteria / non-goals / Risks
- [x] 1.2 Confirm prerequisites: step 02 Impressum identity in `legal.ts`; `LegalSection.body` + multi-paragraph `LegalPage`; cookie/Sentry scenarios in `static-pages.feature`
- [x] 1.3 Skim `docs/product/extras/integrations-and-config.md` (Legal / compliance + processor list) and account-deletion / GoBD notes in `database/schema-overview.md`

## 2. Privacy content

- [x] 2.1 Rewrite DE `privacySections` in `apps/web/app/lib/content/legal.ts` with sections `overview`, `controller`, `data-categories`, `purposes`, `processors`, `cookies`, `retention`, `rights`, `contact` — controller from Impressum; processors limited to shipped stack; cookies/map/Sentry match product behavior; rights include supervisory authority complaint
- [x] 2.2 Rewrite EN privacy sections with the same structure and facts (natural English; titles per step-plan table; keep stable ids)
- [x] 2.3 Keep eyebrow/title chrome stable; adjust `intro` only if contradictory; ensure impressum `privacy-note` and privacy page do not contradict; remove all Platzhalter / Placeholder / pending-legal-review substrings from privacy locale objects; do not claim credits rollover or newsletter

## 3. Verification and handoff

- [x] 3.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 3.2 Run `rg -n "Platzhalter|pending legal review" apps/web/app/lib/content/legal.ts` and confirm no matches inside privacy sections (terms may still be temporary)
- [x] 3.3 Manual smoke: `/de/privacy` and `/en/privacy` mention controller, Stripe, cookies/map consent, and data-subject rights; locale matches URL
- [x] 3.4 Mark step 03 done in `legal-pages-parent-guide.md`; note counsel review recommended before production; defer canonical product-doc sync to step 05
