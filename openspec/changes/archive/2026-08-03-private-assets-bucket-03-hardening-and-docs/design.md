## Context

Steps 01–02 are done: `@unveiled/images` exposes `uploadPrivateObject` / `getPrivateObject`, and voucher create/read paths (admin staging, seed, e2e inventory helper, member `voucher.pdf`) use them. New voucher bytes land only in `S3_PRIVATE_BUCKET`.

Remaining gaps for release:

- Operator/agent SoT still describes voucher PDFs as living in the public R2 bucket (`DEPLOYMENT.md` “same R2 bucket”, `AGENTS.md` Phase 4+ env table without private vars, empty `docs/product/extras` mentions of `S3_PRIVATE_*`).
- E2E PDF scenarios gate on `r2Configured()` (six **public** image vars only); skip copy does not name `S3_PRIVATE_BUCKET`.
- Staging may still have historical `vouchers/...` keys in the public catalog bucket that private-only `getPrivateObject` cannot read — downloads 404 until copied.

Parent guide non-goals still apply: no signed URLs, no dual-read forever, no schema change, public image pipeline unchanged.

## Goals / Non-Goals

**Goals:**

- Document private-bucket env + BE-only delivery across `.env.example`, `AGENTS.md`, `DEPLOYMENT.md`, `integrations-and-config.md`, image/voucher product notes, and `e2e/README.md`.
- Add DEPLOYMENT smoke checklist proving member download works and `IMAGE_PUBLIC_BASE_URL` + key does not.
- Provide an idempotent backfill (script preferred) copying `vouchers/` from public → private; document staging run order.
- Align e2e skip helpers so voucher PDF upload/download scenarios require private bucket (+ shared/override creds); keep public `r2Configured()` for image/logo tests.
- Record the decision in `gaps-and-decisions.md`; mark parent step 03 done.

**Non-Goals:**

- Permanent dual-read fallback in download route.
- Signed/expiring browser URLs; encrypting the public images bucket.
- Redesigning voucher inventory UI or changing `event_voucher_pdfs` schema.
- Deleting public-bucket voucher keys automatically (optional operator cleanup after verified backfill — document, do not force in script).
- Partner portal private file types.

## Decisions

1. **Prefer a Bun backfill script over CLI-only runbook**  
   Mirror `scripts/migrate-r2-jpeg-to-webp.ts`: load repo-root `.env`, `--dry-run`, list `vouchers/` in public bucket, CopyObject (or Get+Put) to private bucket, skip when destination already exists (HeadObject). Document Cloudflare R2 CLI equivalent in DEPLOYMENT for operators who prefer the dashboard/CLI.  
   _Alternative:_ docs-only aws s3 sync — rejected as sole deliverable; script is repeatable and matches repo convention.

2. **No dual-read in application code**  
   After backfill, downloads stay private-only. If an object is missing from private, member still gets 404. Operators must run backfill (or re-upload inventory) before expecting historical PDFs to work.  
   _Alternative:_ temporary public fallback — rejected by parent risk note.

3. **E2E: separate private-bucket gate for voucher PDF specs**  
   Add `privateR2Configured()` (or extend helper) that requires `S3_PRIVATE_BUCKET` plus enough credentials to resolve private env (shared public `S3_*` keys/endpoint/region, or private overrides). PDF download/upload scenarios use that helper with a skip reason that names the private bucket. Image/logo specs keep `r2Configured()` unchanged.  
   _Alternative:_ fold private into `r2Configured()` — rejected; would skip all image tests when only private bucket is missing, and blur public vs private contracts.

4. **Docs are the primary product surface for this slice**  
   Update every SoT listed in the step plan so agents and operators cannot miss private vars. Fix stale DEPLOYMENT text that says voucher staging “reuses `S3_*` / `IMAGE_PUBLIC_BASE_URL`”. `.env.example` already lists private keys from step 01 — verify comments match “no public domain binding”.

5. **Gaps row + parent guide close the feature**  
   One decision row in `gaps-and-decisions.md`; mark child 03 done and release criteria satisfied in the parent guide.

## Risks / Trade-offs

- **[Risk] Backfill missed keys leave silent 404s for old bookings** → Mitigation: dry-run listing + summary counts (copied / skipped / failed); smoke checklist; document re-upload path for inventory.
- **[Risk] Operators bind a public custom domain to the private bucket** → Mitigation: docs MUST state the bucket must not be CDN-bound; smoke checks `IMAGE_PUBLIC_BASE_URL` + key returns 404/denied.
- **[Risk] Copy across buckets with different credentials fails** → Mitigation: script uses public client for source and private client for dest (supports shared keys or overrides); fail clearly per key.
- **[Trade-off] Script does not delete source objects** → Safer for rollback; operators may delete public `vouchers/` later once verified.
- **[Risk] Incomplete doc grep leaves stale “public R2 for vouchers” prose** → Mitigation: verification checklist requires every listed SoT file to mention `S3_PRIVATE_BUCKET` and BE-only access.

## Migration Plan

1. Merge docs + e2e helper updates (safe; no runtime change beyond clearer skips).
2. Provision private R2 bucket on staging (if not already); set Workers secrets `S3_PRIVATE_BUCKET` (+ overrides if any).
3. Run backfill with `--dry-run`, then for real; confirm counts.
4. Smoke: admin upload → book → download PDF → public URL denied.
5. Production: same order after staging sign-off.
6. Rollback: docs/e2e revert is trivial; backfill copies are additive (private objects remain). Do not reintroduce dual-read.

## Open Questions

- None blocking. Whether to delete public `vouchers/` after backfill is an operator choice documented as optional cleanup, not an automated step.
