## Context

Parent feature: Clone Event (`.dev-plan/current-iteration/clone-event-parent-guide.md`). Step 01 shipped `cloneEvent` / `CloneEventInput` (`dateTime` required; optional `voucherInventory`) and removed `createEventSeries`. The series route is a temporary redirect stub; list still shows “Event series” CTA; no clone UI exists.

Today’s admin create path (`events/new.tsx`): parse form → assert voucher inventory → `createEvent` → web-layer `applyVoucherInventoryForEvents`. Clone domain already asserts + applies inventory inside `cloneEvent` — web must not double-apply.

Constraints: SSR-only mutations; dedicated page (no modal); HeroUI + native fields; ADMIN guards; theme-only visuals; packages never depend on web; docs/e2e are step 03.

## Goals / Non-Goals

**Goals:**

- ADMIN SSR `/:locale/admin/events/:id/clone` GET (prefilled) + POST (`cloneEvent`, redirect).
- Clone entry points on Events list and/or edit.
- Delete series route, list CTA, series form/island/builders, unused series copy.
- Lint + typecheck green; manual smoke per step brief.

**Non-Goals:**

- Extending `CloneEventInput` with full metadata overrides (use edit after clone).
- Sitemap / Gherkin / Playwright / coverage-matrix / DEPLOYMENT product notes (03).
- Fixing shared-image delete reference-counting (gaps log in 03).
- Recurring RRULE / multi-slot builders / bulk clone / partner portal.

## Decisions

1. **Clone form shape: slim mutating fields + source summary**
   - **Choice:** Dedicated clone page shows a clear source summary (title, partner, ticket type, existing image preview) and collects **required** new `dateTime` plus **create-mode voucher inventory** when ticket type is `VOUCHER_PROMO` / `VOUCHER_PDF`. Other catalog fields are not editable on clone POST — domain copies them from source. On success, redirect to **edit of the new event id** (sensible surface for further tweaks) or events list if edit link is awkward; prefer edit.
   - **Rationale:** Matches narrow `CloneEventInput`; avoids inventing a second full create pipeline; verification cases only need date + inventory.
   - **Alternatives:** Full `EventAdminForm` prefilled + post-clone `updateEvent` (heavier, easy to desync with domain); clone-only then list redirect without edit (worse UX for title/date tweaks).

2. **Image on clone: reuse source, no upload required**
   - **Choice:** Display source primary image; do not require a new file. Domain reuses `source.imageId` and copies gallery joins. Staged-upload islands from create are only reused for **voucher PDF inventory** staging, not primary image.
   - **Rationale:** Parent + step 01 rules; create’s “image required” does not apply to clone.
   - **Alternatives:** Force re-upload (rejected — worse than series shared-image pattern).

3. **POST handler calls only `cloneEvent`**
   - **Choice:** Parse `dateTime` (+ voucher payload via existing `voucherPayloadFromFormValues` / create-mode assert helpers for UX validation if useful). Call `cloneEvent(db, sourceId, { dateTime, voucherInventory })`. Do **not** call `applyVoucherInventoryForEvents` after success (domain already applied). Map `CatalogValidationError` / inventory errors with `mapCatalogError`.
   - **Rationale:** Single writer for clone side effects; prevents double inventory rows.
   - **Alternatives:** Mirror create’s split create+apply (wrong for clone domain).

4. **dateTime may equal source**
   - **Choice:** Form requires an explicit datetime value (prefill with source as starting point). Domain accepts any valid `Date`, including equal to source.
   - **Rationale:** Parent open question resolved for UI: explicit field required; equality allowed.
   - **Alternatives:** Client reject equal dates (unnecessary).

5. **Partner / address prefill**
   - **Choice:** Clone does not offer partner change on the clone form (partner copied by domain). No create-vs-edit address prefill fork on this page. If implementers reuse create-shaped controls later, treat like **create** for editable fields — but default implementation keeps partner/address out of the mutating POST.
   - **Rationale:** Step task default satisfied by “fields already filled from source” via domain copy; avoids half-wired partner select.
   - **Alternatives:** Full create form with create-mode prefill (scope creep).

6. **Entry points**
   - **Choice:** Add Clone action on `AdminEventsTable` row actions **and** a Clone link on the edit page header/actions. Remove series CTA from `AdminEventsListPage`.
   - **Rationale:** Spec says list and/or edit — both are cheap and discoverable.
   - **Alternatives:** List-only (weaker).

7. **Series UI deletion (hard remove)**
   - **Choice:** Delete `routes/.../admin/events/series/new.tsx` (and empty `series/` dir), `components/admin/EventSeriesForm.tsx`, `islands/EventSeriesForm.tsx`, and any series-only builder helpers still referenced only by those. Grep-clean imports. Remove `newEventSeries` / `newEventSeriesTitle` (and related dead keys) from `admin-content.ts` once unused.
   - **Rationale:** Step deliverable; stub redirect is not enough once clone ships.
   - **Alternatives:** Keep 302 stub forever (rejected — sitemap/e2e still point at series until 03, but UI must not offer it).

8. **Copy / i18n**
   - **Choice:** Add DE+EN clone page title, submit label, dateTime helper, inventory helper, and `cloneAction` for list/edit. Leave product feature-file wording to step 03.
   - **Rationale:** App shell copy lives in `admin-content.ts`.

9. **404 source event**
   - **Choice:** GET clone for unknown id → redirect to events list (or 404 pattern used by edit). POST of missing source → mapped `EVENT_NOT_FOUND` error or redirect.
   - **Rationale:** Match existing admin edit missing-entity behavior.

## Risks / Trade-offs

- **[Risk] Double-apply voucher inventory** → Mitigation: Decision 3 — only `cloneEvent` writes inventory.
- **[Risk] Reusing EventAdminForm accidentally requires image upload** → Mitigation: slim clone form; do not mount create image required UX.
- **[Risk] e2e still hits `/admin/events/series/new`** → Mitigation: expected until step 03; this step only needs lint/typecheck + manual smoke. Do not rewrite Playwright here.
- **[Risk] Shared image delete still unsafe** → Mitigation: out of scope; document remains for 03.
- **[Trade-off] Metadata not editable on clone** → Acceptable; redirect to edit of new id.

## Migration Plan

1. Add clone route + copy + list/edit entry points.
2. Delete series route/UI/copy; fix imports.
3. `bun run lint` + `bun run typecheck`; manual smoke.
4. Mark step done in parent guide; hand off docs/e2e to 03.
5. Rollback: revert web PR; domain from 01 remains valid (series stub can return if needed).

## Open Questions

- None blocking. Redirect target after success: prefer edit of new id; list is acceptable fallback.
