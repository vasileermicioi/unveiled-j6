## 1. Reproduce and inspect

- [x] 1.1 Manually or via Playwright reproduce series preview → confirm and note missing POST fields (`partner_id`, image, redemption)
- [x] 1.2 Confirm how `parseEventFormBody` reads Select-backed and multi-value fields so hidden sync matches the parser

## 2. Form durability

- [x] 2.1 Make series confirm submit durable Select values (hidden inputs on confirm tree and/or hidden sync inside `AdminFormSelect`)
- [x] 2.2 Ensure confirm still requires a valid image upload; add clear DE/EN hint if the file must be re-selected after remount
- [x] 2.3 Verify double-submit / name collision does not break `parseEventFormBody` (omit Select `name` when hidden sync is active if needed)

## 3. E2E and docs

- [x] 3.1 Tighten `e2e/specs/admin-events.spec.ts` series scenarios to assert redirect to `/admin/events` and created titles after confirm
- [x] 3.2 Note image re-attach on confirm in `e2e/README.md` if still required

## 4. Validation

- [x] 4.1 Manual: manual-slot and date-range series → preview → confirm → events on `/de/admin/events`
- [x] 4.2 `bun run test:e2e -- e2e/specs/admin-events.spec.ts -g "series"` passes including confirm
- [x] 4.3 `bun run lint` and `bun run typecheck` on touched packages
