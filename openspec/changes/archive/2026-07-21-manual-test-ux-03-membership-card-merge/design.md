## Context

`MembershipInfoPage` currently renders two bordered `Card`s: `.membership-hero` (title, muted marketing lines, CTAs) and `.membership-benefits` (vertical perk list from a prior UX step). QA annotated `.dev-plan/manual-test-membership-page.png` to remove the gray subtitle/guarantee lines and merge into one card with vertically centered perk icon/text rows. Source brief: `.dev-plan/current-iteration/manual-test-ux-03-membership-card-merge.md`. Independent of steps 01–02; parent feature is `manual-test-ux`.

## Goals / Non-Goals

**Goals:**

- One membership card containing headline/CTA block and the three perk rows.
- Guest/checkout (and error) views no longer show muted `subtitle` / `guarantee` marketing filler.
- Perk rows use `items-center`; icons stay in a fixed centered box; theme CSS cleaned for the merged block.
- Active/frozen status copy (`successSubtitle`, `activeStatus`, `paymentStoppedBody`) and `secure` / CTA remain.
- Ladle stories still cover guest/checkout/active/frozen/error against the one-card layout.

**Non-Goals:**

- Pricing, perk wording, or Stripe checkout behavior changes.
- Profile header / account tabs (steps 04–05).
- Wide content-module refactor; removing `subtitle` from the type if SEO still needs it.
- Changing the yellow page backdrop or inventing new HeroUI primitives.

## Decisions

1. **Single Card; nest perks inside the former hero surface**
   - **Choice:** Collapse to one `<Card className="membership-hero">` (or rename to `membership-card` if CSS rename is cleaner). Put title/CTA grid and the perk list in the same `Card.Content` (stacked with `gap-*`). Remove the second `Card`.
   - **Rationale:** Matches QA “one card”; reuses existing hero border/padding tokens; minimal class churn if we keep `membership-hero` and nest `.membership-benefits__*` list classes without a second `.card`.
   - **Alternatives:** Keep two cards with visually merged borders (rejected — still two surfaces); move everything into a new BEM root only (optional if rename helps cleanup).

2. **Stop rendering gray filler; keep SEO `subtitle`**
   - **Choice:** On `guest` / `checkout` / `error`, do not render `content.subtitle` or `content.guarantee`. Keep `subtitle` in `membership.ts` / types because `membershipPageMeta` in `seo.ts` uses it as meta description. Leave `guarantee` in the module unless grep shows zero other consumers — prefer unused string over type churn.
   - **Rationale:** Step says stop rendering crossed-out lines, not delete SEO copy; brief allows leaving unused strings.
   - **Alternatives:** Delete fields and point meta at first perk or title (rejected — wider SEO/content change).

3. **Preserve state-specific muted copy**
   - **Choice:** `active` still shows `successSubtitle` + `activeStatus`; `frozen` still shows `paymentStoppedBody`; `error` may show `errorSubtitle` and/or `errorMessage` (not the marketing subtitle/guarantee). Guest keeps `guestPrompt` above signup/login CTAs.
   - **Rationale:** Spec explicitly protects status messaging that is not the gray filler.
   - **Alternatives:** Strip all muted paragraphs in every view (rejected — breaks active/frozen UX).

4. **Perk alignment via layout + theme**
   - **Choice:** Change perk row from `items-start` to `items-center`; drop `.membership-benefits__icon` top margin used to optically nudge against start-aligned text; keep fixed 2rem icon box with flex center. If the benefits list is no longer inside `.membership-benefits` Card, retarget padding rules to `.membership-hero .membership-benefits__list` (or equivalent) so list padding is not lost.
   - **Rationale:** QA asked for centered icons aligned with labels; theme owns visual, Tailwind owns flex alignment.
   - **Alternatives:** Absolute-position icons (rejected — fragile); larger icon redesign (out of scope).

5. **Stories: visual structure only**
   - **Choice:** Existing `MembershipInfoPage.stories.tsx` views stay; no assertion of two-card DOM. Spot-check stories render after merge.
   - **Rationale:** Stories are smoke/visual, not structural unit tests.

## Risks / Trade-offs

- **[Risk] Meta description still uses removed-on-page subtitle** → Mitigation: intentional; document in tasks; do not delete `subtitle` without updating `seo.ts`.
- **[Risk] Error view feels empty without muted marketing lines** → Mitigation: keep `errorMessage` / `errorSubtitle` path for real failure copy.
- **[Risk] CSS selectors break when second Card is removed** → Mitigation: grep `.membership-benefits` in `globals.css` and retarget under the single card.
- **[Trade-off] Unused `guarantee` string remains in content module** → Acceptable per brief; optional delete only if unused after grep.
- **[Trade-off] openspec/specs are historical** → Delta lives in this change; update `docs/product/` only if marketing membership UI copy is specified and now diverges.

## Migration Plan

1. Merge JSX into one Card; adjust perk `items-center`.
2. Gate muted paragraphs so guest/checkout/error skip subtitle/guarantee.
3. Retarget/clean `.membership-*` theme rules; remove obsolete second-card padding selector.
4. Spot-check Ladle stories; run lint/typecheck; manual `/en/membership` checkout view.
5. Mark step 03 done in parent guide on merge. No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Optional: rename CSS root from `membership-hero` to `membership-card` during apply if it clarifies the merged surface — implementer’s call, not a product decision.
