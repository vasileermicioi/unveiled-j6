## Context

Admin series create is a two-step SSR flow on `/[locale]/admin/events/series/new`:

1. **Configure** — `EventAdminBaseFields` + slot mode (manual / builder) → POST `action=preview`.
2. **Confirm** — when `previewSlots` is set, `EventSeriesForm` returns a **different** React tree: slot ISO hiddens + a fresh `EventAdminBaseFields` + confirm button (`action=confirm`).

`AdminFormSelect` is uncontrolled (`defaultSelectedKey` / `defaultValue` only). After remount, the Partner (and other) Selects may display defaults from `defaults` but fail to include `partner_id` (and similar) in the multipart POST the way a native `<select>` would. The file `image` input also cannot survive remount — the browser clears it.

This is a **project form-architecture** issue (remount + uncontrolled Select + file input), not Uber theme restyling. Surfaced by `testing-04-04` Playwright series scenarios.

Source of truth: `.dev-plan/current-iteration/fix-admin-event-series-select.md`.

## Goals / Non-Goals

**Goals:**

- Confirm POST always includes `partner_id`, redemption fields, and a valid image upload when the admin completes preview → confirm.
- Manual and date-range series E2E tests assert redirect to `/admin/events` and created event titles.
- Minimal change surface; keep HeroUI markup and theme tokens unchanged.

**Non-Goals:**

- Rewriting all admin forms to controlled components.
- Adding remote URL image field to admin UI.
- Portal/QR admin UI.
- Theme / CSS restyle of selects.
- Fixing unrelated E2E auth flakes under long suites.

## Decisions

### 1. Prefer hidden inputs on the confirm tree (primary fix)

On the confirm branch of `EventSeriesForm`, emit explicit hidden fields for Select-backed values already known from `defaults` / preview parse:

- `partner_id`
- `ticket_type`, `secret_code_mode` (and related redemption fields already present as text inputs)
- Other Select-only fields that must round-trip (`timing_mode`, `barrier_free`, multi-selects as repeated names if the parser expects them)

Keep visible Selects for UX (admin can still change values) **or** show read-only summary + hiddens — prefer visible Selects with **synced hidden `name` mirrors** so submit is durable even if Select’s native form association flakes.

**Alternative A:** Single form tree (never unmount base fields; only toggle preview panel). Cleaner long-term but larger refactor of `EventSeriesForm` + route. Defer unless hidden-input approach proves insufficient.

**Alternative B:** Controlled `AdminFormSelect` with React state lifted to the form. Heavier; do only if hiddens are awkward for multi-selects.

### 2. Harden `AdminFormSelect` with optional hidden sync

Add a small, reusable pattern inside `AdminFormSelectSingle` / `Multiple`:

- Track selection in local state initialized from `defaultSelectedKey(s)`.
- Render `<input type="hidden" name={name} value={…} />` (or multiple hiddens for multi) so multipart POST always includes the name.
- Keep HeroUI `Select` `name` as-is or omit duplicate `name` on the Select if it would double-submit — verify against `parseEventFormBody` (first value wins via `asString`).

This also helps any future remounting admin forms, not only series.

### 3. Image on confirm

File inputs cannot be restored from `defaults`. On confirm:

- Keep `EventImageUpload` required.
- Add clear DE/EN hint on the confirm step: image must be selected again before confirming (if not already obvious).
- E2E continues to `setInputFiles` on confirm before clicking confirm.

**Alternative:** Server-side stash of uploaded image id between preview and confirm (session/temp row). Out of scope — more moving parts than needed for v1 fix.

### 4. E2E assertions

Tighten series tests in `admin-events.spec.ts`:

- After confirm click → `toHaveURL(/admin/events/)` and `getByText(title)`.
- Remove preview-only soft-pass branches.
- Re-select partner only if still needed as belt-and-suspenders; prefer product fix so tests don’t paper over missing `partner_id`.

## Risks / Trade-offs

- **[Double-submit of select names]** Hidden + Select both named `partner_id` → Mitigation: omit `name` on Select when hidden sync is active, or rely on parser taking first string.
- **[Multi-select languages / age groups]** Hidden sync must match how `parseEventFormBody` reads arrays → Verify against existing parser before shipping.
- **[UX: re-upload image]** Confirm requires second file pick → Mitigation: explicit hint copy; acceptable vs session stash.
- **[Larger remount refactor deferred]** Hidden fix may leave other latent remount bugs → Document Alternative A as follow-up if needed.

## Migration Plan

1. Implement hidden sync / confirm hiddens.
2. Manual QA: manual slots + builder → preview → re-attach image → confirm → list.
3. Update series E2E; run focused suite.
4. Lint/typecheck touched files.
5. Rollback: revert form components; E2E soft-assert can return temporarily.

## Open Questions

- Whether multi-select fields are required on series create today (if optional and empty, skip hidden sync for them).
- Exact HeroUI Select form association behavior in current `@heroui/react` — confirm during apply by inspecting POST body before/after fix.
