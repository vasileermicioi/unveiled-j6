# Tasks: faq-refresh-01-content-module

## 1. Setup & source verification

- [x] 1.1 Read `.dev-plan/current-iteration/faq-refresh-01-content-module.md` end-to-end and skim `.dev-plan/current-iteration/faq-refresh-parent-guide.md` (rollover decision, non-goals, release criteria) — confirm no new constraints vs. this tasks list.
- [x] 1.2 Diff the 10 `###` questions + 1 split sub-question in `.dev-plan/FAQs.md` against the EN items 1–11 in the step plan and confirm they match verbatim (hard rule 5); note any drift before writing code.

## 2. Content module update (apps/web/app/lib/content/faq.ts — the only file to edit)

- [x] 2.1 Replace `de.section.items` with the 11 DE items from the step plan, in order (item 6 = "Was passiert, wenn ich zu spät storniere oder nicht erscheine?"), answers as single plain strings, no markup, preserving existing typographic style (em dashes, curly quotes).
- [x] 2.2 Replace `en.section.items` with the 11 EN items from the step plan, in order (item 6 = "What happens if I cancel too late or don't show up?"), copy verbatim from `.dev-plan/FAQs.md` with markdown mailto in item 5 flattened to plain text `support@unveiled.berlin`.
- [x] 2.3 Update `de.hero.subheadline` to "Alles Wichtige zu Mitgliedschaft, Credits, Buchung und Storno an einem Ort." and `en.hero.subheadline` to "Everything important about membership, credits, booking, and cancellation in one place."
- [x] 2.4 Verify `hero.eyebrow`, `hero.headline`, `section.eyebrow`, `section.headline`, `section.supportEmail`, both locale keys, imports, and the exported name are byte-identical to before; verify `git diff --stat` shows only `apps/web/app/lib/content/faq.ts` changed and `types.ts` / `content/index.ts` are untouched.

## 3. Validation

- [x] 3.1 Run `bun run typecheck` — repo exits 2 due to 6 PRE-EXISTING baseline errors (`app/client.ts` import.meta.glob ×4, `AdminFeaturedPartnersManager.tsx` missing `Link` ×2), all present at HEAD without this change; zero errors in `app/lib/content/`.
- [x] 3.2 Run `bun run lint` — `biome check apps/web/app/lib/content/faq.ts` clean; full-repo lint output byte-identical to baseline (pre-existing globals.css/images-test debt only).
- [x] 3.3 Run `bun test apps/web` — 290 pass / 4 fail; the 4 failures (auth-middleware, onboarding-middleware, public-event-gallery ×2) are identical to baseline; `seo.test.ts` and `sitemap.test.ts` pass.
- [x] 3.4 Ran dev server (port 3000) and fetched and load `/de/faq` and `/en/faq` — each rendered 11 accordion items, first expanded, single-expand behavior, hero/support card/layout unchanged; grep rendered HTML to confirm 11 accordion items per locale and that the `FAQPage` JSON-LD `mainEntity` contains exactly the same 11 Q&As.
- [x] 3.5 Confirm FAQ item 4 renders the 2-month rollover promise verbatim in both locales (no sanitization) and that item 5 shows `support@unveiled.berlin` as plain text.

## 4. Cleanup & handoff

- [x] 4.1 Prepare PR/handoff linking `faq-refresh-01-content-module` and `faq-refresh-parent-guide`; state in the PR body that `static-pages-content.md` §FAQ is stale until `faq-refresh-03` updates it and that `static-pages.spec.ts` FAQ selectors are red until `faq-refresh-02` (back-to-back merge).
- [ ] 4.2 (DEFERRED — post-merge) After the step is merged, mark step 01 done in `.dev-plan/current-iteration/faq-refresh-parent-guide.md` Status checklist.
