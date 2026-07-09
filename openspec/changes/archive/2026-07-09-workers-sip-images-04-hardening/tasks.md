## 1. Setup

- [x] 1.1 Confirm step 03 Workers staging smoke still green (partner/event upload → six `.jpg` in R2)
- [x] 1.2 Inventory stale Option B / sharp / “local Node only” / “Workers cannot upload” strings in `AGENTS.md`, `apps/web/DEPLOYMENT.md`, `e2e/README.md`, `packages/images/README.md`, and `.dev-plan/IMPLEMENTATION-PLAN.md`

## 2. Operator and agent docs

- [x] 2.1 Update `AGENTS.md` Images stack row and Hosting bullet: Workers + `@standardagents/sip`, six JPEG variants; remove “admin uploads on Workers URL unavailable (Option B)” / temporary-sharp wording
- [x] 2.2 Finish `apps/web/DEPLOYMENT.md` image section: sip-on-Workers happy path, WASM bundling caveat if any, prominent **re-seed or re-upload** note for legacy `.webp` objects/DB rows, demo notes aligned with JPEG
- [x] 2.3 Align `packages/images/README.md` with Workers+sip + JPEG contract (no sharp happy path); keep EXIF orientation known-gap note
- [x] 2.4 Soft-update `.dev-plan/IMPLEMENTATION-PLAN.md` hosting/sharp lines that would mislead Phase 4+ work (do not rewrite archived history)
- [x] 2.5 Confirm `docs/migration/extras/gaps-and-decisions.md` step-01 JPEG row is complete; add residual risks (EXIF orientation, JPEG size) if missing

## 3. Seed and e2e

- [x] 3.1 Verify `bun run seed:demo` / `runDemoSeed` persists images via `@unveiled/images` with `.jpg` keys; fix any WebP filename or sharp-only side path
- [x] 3.2 Update `e2e/README.md`: uploads work against `bun run dev` and may target Workers when configured; remove “Workers preview cannot upload” / sharp-required hard rules
- [x] 3.3 Fix Playwright admin image specs that skip solely because “Workers can’t upload”; keep `R2 vars not configured` skips; assert `.jpg` variant URLs where practical

## 4. Tests and verification

- [x] 4.1 Add/adjust `packages/images` (and catalog if needed) tests for JPEG filenames and absence of Workers-unfriendly Option B paths; mock sip only if required for unit isolation
- [x] 4.2 Run `bun run lint` && `bun run typecheck`
- [x] 4.3 Run `cd packages/images && bun test`
- [x] 4.4 Run relevant e2e admin image specs locally with R2 configured
- [x] 4.5 Run stale-guidance check: `rg -n "Option B|local Node only|sharp.*Workers|uploads on the Workers URL are not" AGENTS.md apps/web/DEPLOYMENT.md e2e/README.md packages/images/README.md` — no matches that revive Option B as the happy path
- [x] 4.6 Manual: confirm public event detail `og:image` / hero URLs use `.jpg` variants; Workers staging partner/event upload still works after doc/test changes

## 5. Feature close-out

- [x] 5.1 Mark step 04 done and check parent release criteria in `.dev-plan/current-iteration/workers-sip-images-parent-guide.md`; list residual known gaps
- [x] 5.2 Mark `.dev-plan/current-iteration/workers-sip-images-04-hardening.md` tasks complete when implementation lands
