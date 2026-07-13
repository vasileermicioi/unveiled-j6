## Context

Admin-ops steps 01–04 shipped Membership HQ (`/admin/users`, `/admin/users/:id`), SSR mutation pages (adjust-credits, freeze, refund, comp-ticket), admin waitlist list/promote, and booking cancel. List/detail Ladle stories already exist (`AdminUsersListPage.stories.tsx`, `AdminUserDetailPage.stories.tsx`). Mutation/waitlist confirm pages lack stories. Coverage matrix still marks `admin-users.feature` as `unshipped`, and Phase 7 specs hard-skip admin scenarios with “Phase 8 — … UI” reasons even though those UIs now exist.

Sources: `.dev-plan/current-iteration/admin-ops-05-ladle-e2e.md`, parent guide, `docs/product/features/{admin-users,waitlist,booking,credits-subscription}.feature`, `docs/product/testing/bdd-and-e2e.md`, existing `e2e/specs/admin-{events,partners}.spec.ts` patterns, seed fixtures from capacity-ops (sold-out + confirmed booking + waiting entry).

## Goals / Non-Goals

**Goals:**

- Ladle stories for Membership HQ mutation confirms + waitlist list/promote (and booking cancel) using existing form/page component props.
- Playwright: `admin-users.spec.ts` with verbatim Gherkin titles; implement admin waitlist/cancel/credit/freeze/comp scenarios in existing specs (prefer implement over defer).
- Coverage matrix + `e2e/README.md` reflect pass / env-skip / named deferral (owner = `seo-launch-polish-03` only when blocked by env/harness — never “UI not built”).
- Operator note: `freezeMember` only from `ACTIVE`; `unfreezeMember` → `ACTIVE` without Stripe; next webhook may re-set `PAST_DUE` — document in `DEPLOYMENT.md`.
- Mark step 05 and parent **admin-ops** done after verification.

**Non-Goals:**

- GDPR export/delete e2e (`gdpr-rights-03`).
- Full MVP audit / cutover (`seo-launch-polish-03`).
- Partner portal / check-in specs.
- New product routes, domain writers, or schema changes.
- Claiming analytics fields that Membership HQ leaves empty when sparse.

## Decisions

### 1. Stories co-located under `apps/web/app/components/admin/`

| Component | Story states (minimum) |
|---|---|
| `AdminUsersListPage` / `AdminUserDetailPage` | Keep existing Default/Empty/Sparse; add only if a gap appears while wiring e2e |
| `AdminAdjustCreditsForm` | default form; with error |
| `AdminFreezeForm` | freeze; unfreeze; unavailable |
| `AdminRefundForm` | default; with error |
| `AdminCompTicketForm` | default (with event options); with error |
| `AdminWaitlistListPage` | with entries; empty |
| `AdminWaitlistPromotePage` | confirm |
| `AdminCancelBookingPage` | confirm |

Follow existing admin Ladle patterns (`AdminUsersListPage.stories.tsx`, `AdminPartnersListPage.stories.tsx`): `@ladle/react` `Story`, `storyLocale` / mocks from `apps/web/app/components/stories/fixtures`. Prefer page/form stories over new `@unveiled/ui` primitives.

**Rationale:** App-owned admin pages; DS policy already colocates stories with components. List/detail stories from step 03 stay; this step fills mutation/confirm gaps.

### 2. Playwright file → feature mapping

| Feature | Spec file | Action |
|---|---|---|
| `admin-users.feature` | `e2e/specs/admin-users.spec.ts` (**new**) | Implement all 7 scenarios via list/detail + mutation pages |
| `waitlist.feature` (admin rows) | `e2e/specs/waitlist.spec.ts` | Un-skip / implement Admin visibility + manual promote |
| `booking.feature` (admin cancel) | `e2e/specs/booking.spec.ts` | Un-skip Admin cancels… + Cannot cancel… |
| `credits-subscription.feature` (admin) | `e2e/specs/credits-subscription.spec.ts` | Un-skip adjust/zero/refund/freeze/unfreeze/comp |

Rules from `bdd-and-e2e.md`:

- `test("Scenario: <exact Gherkin title>", …)`
- Proximity selectors only (`getByRole` / `getByLabel` / `getByText` / filter / nth) — no `data-testid`, no CSS class hunting.
- ADMIN via `loginAsAdmin` + `settleAdminSession` (same as `admin-partners.spec.ts`).
- Seed via existing billing/catalog/waitlist fixtures + `DATABASE_URL` when needed.

**Mapping note for Gherkin “detail panel” wording:** Membership HQ is dedicated detail + mutation **pages**, not an expand-in-list panel. Assert the same outcomes (preferences/history/behavior on detail; adjust/freeze/comp via linked SSR forms) without requiring a client expand interaction.

### 3. In-scope vs deferral matrix

**Admin-users — implement:**

- List all members
- Search members
- View a member's collapsed summary (list row columns)
- Expand a member's detail / "intel" panel → open `/admin/users/:id` and assert preferences, history counts, available behavior
- Adjust / Freeze or unfreeze / Issue complimentary ticket — via mutation pages linked from detail

**Credits-subscription admin — implement (prefer in `credits-subscription.spec.ts` to keep verbatim titles there; may navigate Membership HQ URLs):**

- Admin manually adjusts… / rejects zero / manual refund / freeze / unfreeze / complimentary ticket

**Booking admin — implement:**

- Admin cancels a confirmed booking (capacity + no credit refund; waitlist trigger as observable as harness allows)
- Cannot cancel a booking that is not confirmed

**Waitlist admin — implement:**

- Admin visibility (`/admin/waitlist` list across events)
- Admin can manually trigger promotion for a specific entry (promote confirm → booking path)

**Named deferrals only if blocked:**

- Missing `DATABASE_URL` / `E2E_ADMIN_*` → `test.skip` with env reason (CI prerequisite, not product deferral).
- Multi-step Stripe webhook re-`PAST_DUE` after unfreeze → document operator note; do not invent e2e for webhook race unless harness already supports it.
- Any leftover → `deferred` → `seo-launch-polish-03` with explicit reason (never “UI not built”).

**Out of scope / other owners:**

- GDPR admin delete / member export → `gdpr-rights-03`
- Partner portal → post-MVP

### 4. Fixtures and navigation helpers

Reuse:

- `e2e/fixtures/auth.ts` — `loginAsAdmin`
- `e2e/fixtures/admin.ts` — `settleAdminSession`, `navigateAdminTab` (extend for Users / Waitlist tabs if labels exist)
- `e2e/fixtures/billing.ts` — seed ACTIVE / UNPAID / credits for freeze/adjust
- `e2e/fixtures/waitlist.ts` — sold-out seed + waiting entry patterns
- Catalog helpers for bookable / sold-out events

Add thin helpers only if repeated:

- Resolve demo member by email/search from seeded or freshly onboarded USER
- Open member detail by searching email then following the row link
- Navigate mutation paths: `/${locale}/admin/users/${id}/adjust-credits` etc.

Prefer UI navigation over direct DB writes when the admin UI can set up state; use DB seed for prerequisites that members cannot self-serve (e.g. CONFIRMED booking for cancel, WAITING entry with capacity for promote).

### 5. Coverage matrix + README + DEPLOYMENT

- Flip all `admin-users.feature` rows from `unshipped` → `pass` (or `skip` with env note).
- Flip waitlist admin / booking admin cancel / credits admin rows from `deferred` Phase 8 UI → `pass` / env `skip` / `deferred` → `seo-launch-polish-03` only if truly blocked.
- `e2e/README.md`: add `admin-users.spec.ts` to inventory; remove “Phase 8 — admin … UI” skip inventory rows that are now implemented.
- `DEPLOYMENT.md`: short Phase 8 admin-ops note — Membership HQ demo path + freeze vs `PAST_DUE` operator caveat; do not start `seo-launch-polish` demo claims beyond admin-ops close.

### 6. Branch and verification

Branch: `admin-ops-05-ladle-e2e`.

```bash
bun run lint
bun run typecheck
bun run stories   # or @unveiled/web Ladle — admin mutation stories load
bun run test:e2e -- e2e/specs/admin-users.spec.ts
# also re-run affected:
#   e2e/specs/waitlist.spec.ts
#   e2e/specs/booking.spec.ts
#   e2e/specs/credits-subscription.spec.ts
```

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Gherkin says “expand row / detail panel”; UI is separate detail page | Assert outcomes on `/admin/users/:id`; document mapping in e2e README if titles confuse |
| Duplicate coverage between `admin-users.spec.ts` and credits-subscription admin tests | Keep credits scenarios in credits spec (verbatim titles); admin-users covers HQ list/detail + adjust/freeze/comp as feature scenarios; share helpers to avoid brittle duplication |
| Freeze only from ACTIVE; unfreeze ignores Stripe past_due | Seed ACTIVE for freeze; document webhook caveat in DEPLOYMENT; skip deep Stripe race |
| Waitlist promote needs capacity + WAITING entry | Reuse capacity-ops seed shape / waitlist fixtures; skip only if DATABASE_URL or admin creds missing |
| Comp ticket needs capacity on selected event | Use bookable seed event; assert confirmed booking without credit charge |
| Accidental GDPR / SEO scope | Tasks explicitly forbid delete-account and audit work |

## Migration Plan

N/A — no schema or API migrations. Stories, e2e, coverage docs, parent-guide status only (+ bugfixes found while testing).

## Open Questions

_(none blocking — product routes and deferral owners already named in step plan / parent guide)_
