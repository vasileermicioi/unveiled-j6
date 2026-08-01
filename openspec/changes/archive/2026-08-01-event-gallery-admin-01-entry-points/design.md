## Context

Per-event gallery routes (`/:locale/admin/events/:id/gallery*`), pages (`AdminEventGallery*Page`), path helpers (`adminEventGalleryPath`), copy keys (`galleryManageAction`), and catalog APIs already exist. Today only `AdminFeaturedTable` wires a gallery action. `AdminEventsTable` exposes edit / clone / delete / codes only. Event edit (`edit.tsx`) has a Clone shell action but no gallery link. Product Gherkin (`admin-events.feature`) still asserts Featured-only exclusivity; that docs/e2e alignment is step 02.

## Goals / Non-Goals

**Goals:**

- Expose gallery manage for every existing catalog event from the Events list and/or event edit page.
- Do not gate visibility on `featured_events`.
- Reuse existing path helpers, copy, and `AdminTableActions` gallery icon — no new routes or APIs.
- Keep Featured-list gallery shortcut as a convenience entry.

**Non-Goals:**

- Schema, capacity (12), five-WebP pipeline, or public detail gallery UI changes.
- Product Gherkin / Playwright / coverage-matrix / DEPLOYMENT rewrites (step 02).
- Gallery manage on create-event.
- Partner-portal gallery management.

## Decisions

1. **Primary entry: Events list row action**
   - Add a gallery `AdminTableActions` item in `AdminEventsTable` using `adminEventGalleryPath(locale, event.id)` and `copy.galleryManageAction` / `icon: "gallery"`, matching Featured table pattern.
   - Rationale: list is the natural catalog surface; every event row gets the action without Featured membership.
   - Alternative considered: edit-page-only — rejected as sole entry because admins discovering the catalog start on the list; edit-only would hide the action until open.

2. **Secondary entry: event edit shell action (recommended)**
   - Add a secondary Button/Link beside the existing Clone action on the edit page shell (`AdminPageShell` `actions`), linking to `adminEventGalleryPath`.
   - Rationale: openspec already describes edit-page entry; shell actions keep the create form free of gallery chrome.
   - Alternative considered: link inside `EventAdminForm` — rejected to avoid implying gallery is part of create/save.

3. **Retain Featured gallery shortcut**
   - Leave `AdminFeaturedTable` gallery action unchanged.
   - Rationale: parent guide default; convenience for curation workflow; step 02 can soften Featured-only Gherkin without removing the shortcut.

4. **No gating / no new copy keys**
   - Do not query `featured_events` for the new actions.
   - Reuse existing i18n strings; no new admin-content keys required unless edit shell needs a shorter label (prefer existing `galleryManageAction`).

5. **Docs/e2e deferred**
   - After this UI change, Featured-only product Gherkin and the e2e assertion that Events list has zero gallery links will temporarily diverge until step 02. Acceptable per step plan scope; call out in PR/handoff.

## Risks / Trade-offs

- [Temporary Gherkin/e2e mismatch] → Mitigation: step 02 owns rewrites; PR notes the known fail of the Featured-exclusivity e2e scenario if run before 02; lint/typecheck remain the step 01 gate.
- [Actions column crowding on Events table] → Mitigation: reuse compact icon actions already used for edit/clone/delete/codes; gallery icon already exists in `AdminTableActions`.
- [Edit + list both linking feels redundant] → Mitigation: intentional dual entry per parent guide; low cost, clearer discoverability.

## Migration Plan

1. Ship UI wiring only (list ± edit).
2. Verify manually: ADMIN opens gallery for a non-featured event via Events list/edit → `/admin/events/:id/gallery`.
3. Run `bun run lint` and `bun run typecheck`.
4. Mark step 01 done in the parent guide; hand off to `event-gallery-admin-02-docs-and-e2e`.
5. Rollback: revert the two UI call sites; gallery routes remain intact.

## Open Questions

- None blocking. Featured shortcut keep vs remove defaulted to **keep**.
