## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/manual-test-account-ui-04-docs-and-hardening.md` and parent guide release criteria / status for steps `01`–`03`
- [x] 1.2 Confirm prerequisites: membership home, tabs-above-header, and admin `PageSectionHeader` are shipped; skim current `profile.feature`, sitemap `/profile` row, coverage-matrix wallet rows, and `e2e/specs/profile.spec.ts` membership tests
- [x] 1.3 Diff product docs against shipped UI (ProfileLayout / ProfilePage / AdminPageShell) so updates match reality

## 2. Product docs

- [x] 2.1 Rewrite `docs/product/features/profile.feature`: remove “View credit wallet” / “Refill credits”; add membership home + inactive checkout scenarios (titles aligned with e2e); update IA comments (tabs above header; Membership not wallet)
- [x] 2.2 Update `docs/product/sitemap/sitemap.md` `/profile` blurb to membership manage home (not credit wallet tab)
- [x] 2.3 Update `docs/product/ui/ui-component-map.md`: Profile row (membership home card, tabs above `PageSectionHeader`, shared column width); PageSectionHeader / Admin notes for `AdminPageShell`
- [x] 2.4 Update `docs/product/ui/static-pages-content.md` account + admin header conventions as needed
- [x] 2.5 Inventory any new Membership / portal / Admin eyebrow strings in `docs/product/extras/content-i18n-inventory.md` if missing

## 3. Coverage matrix and e2e

- [x] 3.1 Replace coverage-matrix wallet/refill profile rows with membership-home scenario rows pointing at matching Playwright titles (or explicit skip reason)
- [x] 3.2 Harden `e2e/specs/profile.spec.ts`: membership home + portal/inactive CTAs; assert tablist precedes account heading; keep portal deep-flow reuse of billing fixtures (no new Stripe Portal browser automation)
- [x] 3.3 Optional: one non-flaky admin Playwright or Ladle assertion that partners/overview exposes PageSectionHeader eyebrow/rule — skip with reason if brittle

## 4. Validation and release close-out

- [x] 4.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 4.2 Run relevant Playwright profile specs when `DATABASE_URL` is available; otherwise document skip reason consistent with coverage-matrix
- [x] 4.3 Grep sanity: no remaining “credit wallet” account-home claims in `profile.feature` / sitemap profile row
- [x] 4.4 Mark step `04` done in `.dev-plan/current-iteration/manual-test-account-ui-parent-guide.md`; list intentional deferrals; confirm parent release criteria; no further child steps
