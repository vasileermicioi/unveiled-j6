## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/legal-pages-04-terms-content.md` and parent guide release criteria / non-goals / Risks
- [x] 1.2 Confirm prerequisites: step 03 Privacy done; `LegalSection.body` + multi-paragraph `LegalPage`; terms still use temporary 3-section stubs with Platzhalter
- [x] 1.3 Skim `docs/product/features/credits-subscription.feature` and `docs/product/product/vision-and-domains.md` for no-rollover + membership facts; skim booking.feature at high level

## 2. Terms content

- [x] 2.1 Rewrite DE `termsSections` in `apps/web/app/lib/content/legal.ts` with sections `scope`, `membership`, `credits`, `booking`, `cancellation`, `liability`, `changes`, `governing-law`, `contact` — membership/credits/booking/cancellation per product SoT; Credits MUST state unused credits do not roll over; German law / Berlin venue; contact `support@unveiled.berlin`; no partner portal / multi-city / à la carte / chat promises
- [x] 2.2 Rewrite EN terms sections with the same structure and product rules (natural English; titles per step-plan table; keep stable ids)
- [x] 2.3 Keep eyebrow/title chrome stable (`AGB` / `Terms of Service`); optional short counsel disclaimer in `intro` only; optional Privacy/Impressum cross-link; remove all Platzhalter / Placeholder / pending-legal-review substrings from `legal.ts`

## 3. Verification and handoff

- [x] 3.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 3.2 Run `rg -n "Platzhalter|pending legal review" apps/web/app/lib/content/legal.ts` — no matches anywhere in the file
- [x] 3.3 Run `rg -n "roll over|rollen mit|übertragen|rollover" apps/web/app/lib/content/legal.ts` — only negative/no-rollover phrasing
- [x] 3.4 Manual smoke: `/de/terms` and `/en/terms` show membership, credits, booking, cancellation sections; Credits states no rollover; locale matches URL
- [x] 3.5 Mark step 04 done in `legal-pages-parent-guide.md`; note counsel review recommended before production; defer canonical product-doc sync to step 05
