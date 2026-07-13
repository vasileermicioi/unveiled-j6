## Context

Phase 8 `seo-launch-polish-03` closes the MVP. Steps 01–02 shipped sitemap/SEO and branded 403/500 + optional Sentry. `admin-ops` and `gdpr-rights` parents are done (Membership HQ, waitlist/cancel, GDPR export/delete, Ladle + Playwright). Remaining Phase 8 done-when items are process/docs plus last-mile e2e:

- Every top-level `docs/product/features/*.feature` (11 files; exclude `post-mvp/`) mapped in `coverage-matrix.md` to `pass` or explicit `skip`/`deferred` with reason — no silent MVP skips.
- Staging guest→member→book→admin walkthrough recorded.
- Production cutover checklist written and linked from `DEPLOYMENT.md`.
- Parent `seo-launch-polish` + Phase 8 overview marked complete.

Current skip inventory lives in `e2e/README.md` and `docs/product/testing/coverage-matrix.md`. Known named items already include Google OAuth (deferred), Stripe Checkout opt-in, Resend inbox, integration-covered booking/waitlist cases, post-MVP partner portal, and conditional GDPR Neon Auth credential reject. Ladle stories for admin HQ, GDPR confirms, and Forbidden/ServerError already exist under `apps/web/app/components/`.

Canonical product SoT remains `docs/product/`; this change’s OpenSpec deltas document release gates for archive/history only — update product docs (`coverage-matrix`, `DEPLOYMENT`, e2e README) as the operator-facing SoT.

## Goals / Non-Goals

**Goals:**

- Complete feature→Playwright audit for all MVP feature files; fix failing/missing scenarios or convert to named deferrals (scenario + reason + owner).
- Refresh coverage matrix + `e2e/README.md` skip inventory so Phase 8 release criteria are provable.
- Confirm Ladle coverage for admin users HQ, GDPR confirms, error pages (add only if missing).
- Deploy/verify staging; walk Journey 1 + admin support (Journey snippets from `user-journeys.md`); document in `DEPLOYMENT.md`.
- Draft production cutover checklist; mark seo-launch-polish + Phase 8 complete.

**Non-Goals:**

- Partner portal, check-in, partner-codes cron.
- Reopening CHARTER locks or inventing new domains.
- Mandatory Sentry DSN on staging (optional; document either way).
- Replacing proximity-selector rules or HeroUI/theme conventions.
- Clearing every historical `skip` that is already a legitimate named deferral (OAuth, inbox, integration-covered, post-MVP).

## Decisions

### 1. Audit method: matrix-first, then fix-or-name

1. Walk each of the 11 MVP feature files; for every `Scenario:` confirm a matching Playwright `test()` title (or matrix `skip`/`deferred` row).
2. Diff against live specs: failing tests → fix if last-mile (locator/title/fixture); cannot fix in-session → **named deferral** with reason + owner (prefer `post-MVP` or `ops/manual` over silent `test.skip(true)` without notes).
3. Reconcile `e2e/README.md` Skip inventory with the matrix (single narrative).
4. Clear stale `unshipped` rows for shipped Phase 6–8 features if any remain.

**Rationale:** Product gate is “pass or named deferral,” not “100% green Playwright for third-party hosted flows.” Matrix is already the inventory SoT (`bdd-and-e2e.md`).

**Alternatives:** Re-write all skipped scenarios into e2e — rejected (Stripe hosted, Google OAuth, Resend inbox lack harnesses). Ignore matrix and only run `test:e2e` — rejected (silent skips hide gaps).

### 2. Deferral taxonomy for Phase 8 close

| Status | When to use |
|---|---|
| `pass` | Executable Playwright test expected green with documented env |
| `skip` | Explicit hard skip with reason (post-MVP, integration SoT, opt-in env) |
| `deferred` | MVP-desired but blocked (OAuth provider, Neon Auth plugin incomplete) — must name owner |

Env skips (`R2 vars not configured`, missing `E2E_ADMIN_*`, missing `DATABASE_URL`) remain OK and stay documented — they are not silent product skips.

Residual GDPR “credential still works after anonymize” stays a **conditional** named skip owned by ops/Neon Auth config (already noted → this step confirms and either closes via staging Auth plugins or keeps as named deferral in cutover checklist).

### 3. Ladle: verify, don’t rebuild

Confirm stories exist (already present):

- Admin HQ: `AdminUsersListPage`, `AdminUserDetailPage`, mutation forms, waitlist/cancel
- GDPR: `DataExportPage`, `DeleteAccountPage`, `AdminDeleteAccountForm`
- Errors: `ForbiddenPage`, `ServerErrorPage` (+ existing `NotFoundPage`)

Only add a story if audit finds a shipped UI state without a story. Do not expand DS surface.

### 4. Staging walkthrough script (record in DEPLOYMENT)

Minimum path aligned to Journey 1 + admin support:

1. Guest: Discover → public `/events/:id` → signup → onboarding → membership CTA
2. Member: Stripe test Checkout (or document seeded ACTIVE if Checkout unavailable) → `/events` → book → My Tickets / redemption code
3. Admin: Membership HQ search → adjust/freeze smoke as needed → waitlist or cancel if fixtures allow → optional GDPR on disposable user
4. SEO/errors smoke: sitemap contains bookable event URL; optional Sentry DSN note; member `/admin` redirects (not 403 leak)

Record pass/fail + date + staging URL in `DEPLOYMENT.md` Phase 8 section. Prefer real Checkout on staging when secrets exist; otherwise note seeded path + Checkout as cutover smoke item.

### 5. Production cutover checklist location

Add a **Production cutover** subsection under Phase 8 in `apps/web/DEPLOYMENT.md` (primary). Optionally mirror a short checklist file under `.dev-plan/` only if the DEPLOYMENT section grows unwieldy — prefer single SoT in DEPLOYMENT with link from parent guide.

Checklist MUST cover:

- Env / Worker secrets: `DATABASE_URL`, `AUTH_URL`, `SITE_URL`, Stripe keys + price id + webhook secret, R2 six vars + `IMAGE_PUBLIC_BASE_URL`, `RESEND_*`, optional `SENTRY_DSN`
- Neon Auth trusted domains for production origin
- Stripe: live mode keys, webhook endpoint to production `/api/webhooks/stripe`, Customer Portal settings
- DNS / Cloudflare custom domain + Workers route
- Admin provisioning (no self-service ADMIN; out-of-band promote — never leave `ADMIN_PROMOTE_EMAILS` on production)
- Seed: whether production gets empty catalog vs curated seed; demo accounts policy
- Resend domain/from verification
- Post-deploy smoke: guest→signup, Checkout, book, admin HQ login

### 6. Docs / planning close-out

- Mark step 03 + parent **seo-launch-polish** done.
- Mark Phase 8 complete in `phase-8-overview.md` when all three parents done (admin-ops + gdpr-rights already done).
- Stop — do not start post-MVP partner work.

## Risks / Trade-offs

- **[Neon Auth / Google OAuth / Stripe / Resend flakes block “green” e2e]** → Mitigation: keep named deferrals; require staging manual smoke for those paths in cutover checklist; do not convert to silent skips.
- **[Audit finds real product bugs]** → Mitigation: fix only last-mile within Phase 8 polish; larger bugs get named deferral with owner rather than expanding into new domains.
- **[Staging deploy unavailable in session]** → Mitigation: document blocker; still complete matrix audit + cutover draft; record walkthrough as blocked with exact missing secrets/URL.
- **[Over-clearing legitimate skips]** → Mitigation: post-MVP and integration-covered skips stay `skip` with notes — Phase 8 gate is “named,” not “zero skips.”
- **[Cutover checklist drifts from env reality]** → Mitigation: derive checklist from current `DEPLOYMENT.md` + `.env.example` + `integrations-and-config.md`; verify against wrangler/secrets scripts.

## Migration Plan

1. Confirm prerequisites (seo-02 merged; admin-ops + gdpr parents done).
2. Inventory current matrix + README skips; run focused e2e or full `bun run test:e2e`.
3. Fix last-mile gaps or write named deferrals; update matrix + README.
4. Verify Ladle story list; add only if missing.
5. Staging deploy + walkthrough; write results into `DEPLOYMENT.md`.
6. Write production cutover checklist; Phase 8 demo + stop note (MVP complete; partner post-MVP).
7. Mark parent + phase overview done; lint/typecheck/e2e verification.

Rollback: docs-only revert of matrix/DEPLOYMENT/parent marks; any e2e fixes remain independently revertible.

## Open Questions

- None blocking. At apply time: confirm staging `SITE_URL` and whether Stripe Checkout + Sentry DSN are available for the walkthrough (document absences as checklist items, not blockers for the audit docs).
