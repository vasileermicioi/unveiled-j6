## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-03-membership-card-merge.md`, parent guide non-goals, and this change’s `design.md` / specs
- [x] 1.2 Compare `MembershipInfoPage.tsx` + `.membership-*` CSS to `.dev-plan/manual-test-membership-page.png`
- [x] 1.3 Confirm touch points: `MembershipInfoPage.tsx`, `MembershipInfoPage.stories.tsx`, `membership.ts` / `types.ts`, `globals.css`, `seo.ts` (keep `subtitle` for meta)

## 2. Single-card layout

- [x] 2.1 Merge hero + benefits into one `Card` in `MembershipInfoPage.tsx` (headline/CTA + perk list in one surface)
- [x] 2.2 Stop rendering muted `subtitle` and `guarantee` on guest/checkout/error; keep active/frozen status copy, guest prompt, secure line, and CTAs
- [x] 2.3 For error view, prefer `errorSubtitle` / `errorMessage` over marketing filler
- [x] 2.4 Set perk rows to `items-center`; keep fixed icon box with centered Lucide icons

## 3. Theme and content cleanup

- [x] 3.1 Retarget `.membership-benefits*` theme rules under the single card; remove obsolete second-card padding selectors; drop icon `margin-top` if centering makes it unnecessary
- [x] 3.2 Grep for `guarantee` / dual-card assumptions; leave unused content strings unless truly unreferenced and safe to remove (`subtitle` must stay for `membershipPageMeta`)
- [x] 3.3 Spot-check `MembershipInfoPage.stories.tsx` still renders all views against the one-card structure

## 4. Validation and handoff

- [x] 4.1 Run `bun run lint` (exit 0)
- [x] 4.2 Run `bun run typecheck` (exit 0)
- [x] 4.3 Manual: `/en/membership` checkout shows one card; no “Full Access…” / “No hidden fees…” gray lines; perk icons centered with text; spot-check active/frozen/guest
- [x] 4.4 Update `docs/product/` only if membership marketing UI copy is specified and now diverges
- [x] 4.5 Mark `manual-test-ux-03-membership-card-merge` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
