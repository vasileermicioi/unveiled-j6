## Context

Steps 01–03 locked JPEG filenames, replaced sharp with `@standardagents/sip`, and bundled sip WASM so admin multipart uploads succeed on Cloudflare Workers. Runtime behavior largely matches the parent release criteria; remaining drift is operator-facing:

- `AGENTS.md` still says sharp is temporary and Option B blocks Workers uploads.
- `e2e/README.md` still requires local Node + sharp and forbids Workers preview for image specs.
- `DEPLOYMENT.md` / `packages/images/README.md` already describe sip on Workers (step 03 touch) but need re-seed/re-upload and WASM caveats completed.
- Demo seed already goes through `createPartner` / `createEvent` → `@unveiled/images`; verify `.jpg` keys and document that path.
- Parent guide step 04 and release criteria are still open.

This step is docs, seed verification, tests, and feature close-out — not a new processing architecture.

## Goals / Non-Goals

**Goals:**

- Agent, deploy, package, e2e, and plan docs describe Workers + sip + six `.jpg` variants as the supported path.
- Stale Option B / sharp / “Workers cannot upload” strings removed from the verification `rg` set.
- Operators know to re-seed or re-upload after the WebP → JPEG migration (manual; no migration job).
- `bun run seed:demo` produces viewable `.jpg` public URLs via `@unveiled/images`.
- Unit / catalog / Playwright image coverage asserts JPEG/sip assumptions; e2e no longer skips solely because “Workers can’t upload”.
- Parent guide marks steps 01–04 done and lists residual gaps (EXIF orientation, JPEG size).

**Non-Goals:**

- Cloudflare Images / Image Resizing product.
- Automatic cleanup of orphaned `.webp` R2 objects.
- Reopening WebP vs JPEG output.
- New admin image-management UI.
- Changing the six-slot ladder, validation caps, or sip API.

## Decisions

### 1. Doc sweep over new runtime code

- **Choice:** Prefer editing `AGENTS.md`, `DEPLOYMENT.md`, `e2e/README.md`, `packages/images/README.md`, and soft-updating `.dev-plan/IMPLEMENTATION-PLAN.md` hosting/sharp lines. Touch application code only if seed helpers or tests still assert `.webp` / Option B skips.
- **Rationale:** Processing and Workers bundling already shipped; leftover wrong docs are the release blocker.
- **Alternatives:** Large historical rewrite of every sharp mention in archived plans — reject; soft-update only lines that would mislead Phase 4+ work.

### 2. Manual re-seed / re-upload for legacy WebP

- **Choice:** Document that existing R2 `.webp` keys and DB rows need `bun run seed:demo` (empty/force reset) or admin re-upload; do not build a migration script.
- **Rationale:** Parent non-goal; staging data volume is small; dual WebP/JPEG forever is worse than a one-time ops step.
- **Alternatives:** Batch rewrite job — out of scope per iteration plan.

### 3. Seed path stays catalog create APIs

- **Choice:** Keep `runDemoSeed` → `createPartner` / `createEvent` (already sip/JPEG). Add or adjust tests/assertions that seeded public URLs end in `.jpg`; fix any seed helper that still hardcodes WebP filenames.
- **Rationale:** Avoid a parallel seed uploader; one pipeline for admin and demo.
- **Alternatives:** Seed writing raw R2 keys without `@unveiled/images` — rejected (diverges from contract).

### 4. E2E: R2 skip only; Workers optional

- **Choice:** Image specs continue to `test.skip` when R2 env vars are missing. Remove “must use bun run dev + sharp / Workers preview cannot upload” as a hard rule. Default local target remains `bun run dev`; document that Workers preview/staging can run the same specs when base URL + secrets are set.
- **Rationale:** Matches shipped runtime; keeps CI runnable without Workers credentials.
- **Alternatives:** Mandate Workers-only e2e in CI — too heavy for this hardening step.

### 5. Residual gaps recorded, not fixed here

- **Choice:** Document EXIF orientation (sip default decode) and possible larger JPEG payloads in parent guide and/or `gaps-and-decisions.md`; do not reintroduce sharp for orientation.
- **Rationale:** Parent already accepted these as known risks; step 04 closes the feature with honesty, not scope creep.
- **Alternatives:** Orientation pre-pass — defer unless product asks later.

### 6. Verification gate before marking parent complete

- **Choice:** Require lint, typecheck, `packages/images` tests, relevant e2e image specs (with R2), stale-string `rg`, and a manual Workers staging upload smoke before checking off parent release criteria.
- **Rationale:** Docs-only merges can still leave broken seed/tests; the parent guide is the feature exit ticket.
- **Alternatives:** Doc-only merge without smoke — rejected by iteration verification list.

## Risks / Trade-offs

- **[Stale docs outside the rg set]** Historical notes in unrelated files still mention sharp → Soft-update IMPLEMENTATION-PLAN + gaps log; do not boil the ocean; verification `rg` covers the operator-facing set.
- **[Staging broken thumbnails until re-seed]** Operators miss the migration note → Put re-seed/re-upload prominently in DEPLOYMENT.md image section.
- **[E2E against Workers flaky / slow]** Optional Workers target may fail on cold start → Keep default local; Workers smoke remains manual checklist + existing smoke script if present.
- **[JPEG size on staging]** Larger objects than old WebP → Record as residual gap; only tweak quality numbers if staging feels heavy (optional, ladder widths fixed).
- **[False confidence from green unit tests]** Docs wrong while code green → Explicit `rg` verification step in tasks.

## Migration Plan

1. Inventory stale Option B / sharp / local-only strings in the doc set.
2. Update docs + e2e README/specs; confirm seed writes `.jpg`.
3. Run verification commands; fix any failing tests.
4. Manual Workers staging partner/event upload smoke (or confirm step 03 smoke still green).
5. Mark step 04 + parent release criteria in `workers-sip-images-parent-guide.md`.
6. Rollback: revert doc/test commits only; no schema change. R2 `.jpg` objects remain valid.

## Open Questions

- None blocking apply. Staging URL in DEPLOYMENT.md may still be TBD — do not block hardening on DNS; document re-seed against whatever Workers URL operators use today.
