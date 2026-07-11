## Why

Phase 5.5 steps 01–04 are done (Theme Overview, DS ownership, BDD locators, Discover CTA + coverage matrix). The parent release gate still needs workstream **C**: confirm Discover = `/:locale`, legacy `/discover` 301, public `/events/:id`, gated member `/events`, and guest CTA journeys match `docs/product/sitemap/sitemap.md` — then staging deploy + `DEPLOYMENT.md` so Phase 6 (Stripe/booking) can start only with named deferrals remaining.

## What Changes

- Spot-check (manual + existing e2e) Discover home, `/:locale/discover` (and bare `/discover` if applicable) **301** → locale home, public event detail without auth, gated `/events`, and Discover preview/auth CTAs
- Fix any sitemap/CTA/redirect/auth-gate drift with **minimal** diffs; if already aligned, document that in the PR and a short Phase 5.5 `DEPLOYMENT.md` note
- Update `apps/web/DEPLOYMENT.md` with Phase 5.5 notes, demo script (Theme Overview in Ladle; guest opens public event from Discover; e2e titles match Gherkin), and staging deploy evidence
- Finalize parent guide release criteria checkboxes; consolidate named deferrals (scenario/debt id + reason + target phase) from coverage matrix + parent Risks
- Hard stop: **do not** create `packages/billing`, booking routes, Stripe, or Resend as part of this change
- Prefer documenting alignment over drive-by refactors; update `docs/product/` only if sitemap/behavior docs were wrong (prefer code → docs)

## Capabilities

### New Capabilities

- _(none)_ — journey rules already live under marketing + discovery; this step verifies and releases them

### Modified Capabilities

- `static-marketing-pages`: Confirm Discover is locale home; legacy discover paths 301 to `/:locale`; guest preview CTAs → public detail and auth CTAs → signup/login → member `/events` (no public full feed) as release-checked behavior
- `event-discovery`: Confirm `/events/:id` remains public without auth and `/events` stays gated for guests as release-checked behavior
- `platform-foundation`: Phase 5.5 release gate — Phase 6 SHALL NOT start until release criteria are met or only named deferrals remain; staging + `DEPLOYMENT.md` updated; no billing/booking started in this feature

## Impact

- **App (conditional):** discover redirect route(s), Discover CTA hrefs, auth middleware on `/events`, public `[locale]/events/[id]` — only if spot-check finds drift
- **Docs:** `apps/web/DEPLOYMENT.md` Phase 5.5 section; `.dev-plan/current-iteration/spec-alignment-parent-guide.md` release criteria + deferral list; `docs/product/` only if sitemap/docs were wrong
- **Ops:** staging Workers deploy (`bun run deploy:workers`); smoke Discover + public detail
- **Verification:** `bun run lint`, `typecheck`, `stories` (Theme Overview), `test:e2e` (in-scope; respect named skips/deferrals); confirm no Phase 6 packages/routes introduced
- **Out of scope:** `sitemap.xml` SEO polish (Phase 8); partner portal; Stripe/booking/waitlist; new product features; Phase 6 proposals
