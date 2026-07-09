## Why

Admin event-series create often fails on the confirm step after preview: `EventSeriesForm` remounts the field tree, and uncontrolled HeroUI Selects (especially `partner_id`) plus the file image input do not reliably resubmit. Playwright series coverage from `testing-04-04` had to soft-assert preview only. Fix the form so confirm is durable, then assert full E2E create.

## What Changes

- Fix series preview → confirm so POST includes partner, redemption fields, and image after remount (hidden inputs and/or keep base fields mounted — not a theme/restyle change).
- Optionally harden `AdminFormSelect` to sync a hidden `name` input from the current selection when used in multipart SSR forms.
- Update `e2e/specs/admin-events.spec.ts` series scenarios to require successful confirm (redirect + titles on `/admin/events`).
- Document in `e2e/README.md` if the browser still requires re-attaching the image file on the confirm step.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Add requirement that admin event-series confirm survives the preview remount and that E2E asserts full create, not preview alone.

## Impact

- **Touched:** `EventSeriesForm.tsx`, possibly `AdminFormSelect.tsx` / series route helpers, `e2e/specs/admin-events.spec.ts`, `e2e/README.md`.
- **Not touched:** Uber theme tokens, portal/QR UI, remote URL image field, CI step 05.
- **Risk:** Low — form submit durability only; no schema or auth changes.
