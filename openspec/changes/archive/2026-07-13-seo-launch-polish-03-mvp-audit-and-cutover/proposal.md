## Why

Phase 8 SEO launch polish step 03 is the MVP close-out: sitemap/SEO and branded errors/Sentry are done, but Phase 8 “done when” still requires every top-level MVP Gherkin feature mapped to Playwright pass or a **named** deferral, a staging guest→member→book→admin walkthrough, and a written production cutover checklist. Without this audit, silent skips and undocumented operator cutover steps can block ship-ready member/admin MVP.

## What Changes

- Audit every top-level `docs/product/features/*.feature` (exclude `features/post-mvp/`) against Playwright specs and the coverage matrix; fix last-mile e2e gaps or record named deferrals (reason + owner) — no silent skips for MVP-required scenarios
- Confirm Ladle stories exist for admin Membership HQ, GDPR confirm states, and 403/500 error pages (verify; fill only if missing)
- Run staging walkthrough per `docs/product/product/user-journeys.md` (guest → member → book → admin support); record demo script outcome in `DEPLOYMENT.md`
- Draft production cutover checklist (env vars, Neon Auth trusted domains, Stripe, R2, Resend, optional Sentry, DNS, seed/admin provisioning) in `DEPLOYMENT.md` or a linked `.dev-plan/` doc referenced from `DEPLOYMENT.md`
- Update coverage matrix / `e2e/README.md` skip inventory to match pass vs named deferral; mark step 03 + parent **seo-launch-polish** done and Phase 8 complete in overview guides

**Out of scope:** Partner portal / check-in / partner-codes cron; reopening CHARTER locks; new major product domains; inventing features beyond audit fixes.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `bdd-and-e2e`: Add Phase 8 MVP feature coverage audit — every top-level MVP feature file mapped to pass or explicitly named-deferred; no silent skips at Phase 8 close
- `platform-foundation`: Add production cutover checklist requirement referenced from `apps/web/DEPLOYMENT.md` (env, Auth, Stripe, R2, Resend, optional Sentry, admin provisioning)

## Impact

- **Docs:** `docs/product/testing/coverage-matrix.md`, `e2e/README.md`, `apps/web/DEPLOYMENT.md` (Phase 8 demo + cutover), `.dev-plan/current-iteration/seo-launch-polish-parent-guide.md`, `phase-8-overview.md`
- **E2E:** Last-mile fixes in `e2e/specs/*.ts` only where audit finds MVP gaps that are not legitimately deferred
- **Ladle:** Confirm existing admin HQ / GDPR / Forbidden / ServerError stories; add only if audit finds holes
- **Product docs:** Prefer matrix + DEPLOYMENT updates; touch `docs/product/testing/bdd-and-e2e.md` only if Known gaps need a Phase 8 close note
- **Downstream:** Closes `seo-launch-polish` and Phase 8 MVP; does not start post-MVP partner work
- **Verification:** `bun run lint`, `typecheck`, `test:e2e` green for MVP scope or only named deferrals; staging walkthrough recorded
