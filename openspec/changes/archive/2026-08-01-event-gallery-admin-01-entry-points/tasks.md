## 1. Setup

- [x] 1.1 Confirm gallery routes (`/:locale/admin/events/:id/gallery*`), `AdminEventGallery*Page`, `adminEventGalleryPath`, and catalog gallery APIs already exist
- [x] 1.2 Skim `.dev-plan/current-iteration/event-gallery-admin-parent-guide.md` for release criteria and non-goals

## 2. Events list entry

- [x] 2.1 Add gallery manage action to `AdminEventsTable` via `AdminTableActions` using `adminEventGalleryPath(locale, event.id)`, `copy.galleryManageAction`, and `icon: "gallery"`
- [x] 2.2 Ensure the action is shown for every catalog event row with no `featured_events` gate

## 3. Event edit entry

- [x] 3.1 Add gallery manage link/button to event edit page shell actions (`edit.tsx` `AdminPageShell` actions) beside Clone, linking to `adminEventGalleryPath`
- [x] 3.2 Confirm create-event (`new.tsx` / create form) has no gallery manage entry

## 4. Featured convenience

- [x] 4.1 Leave `AdminFeaturedTable` gallery action in place (convenience entry; not sole entry)

## 5. Validation & handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 5.2 Manual smoke: as ADMIN, open gallery for a non-featured event via Events list and/or edit → `/admin/events/:id/gallery`
- [x] 5.3 Mark step 01 done in `.dev-plan/current-iteration/event-gallery-admin-parent-guide.md`
- [x] 5.4 Prepare PR/handoff noting change ID, parent guide, and that product Gherkin/e2e Featured-exclusivity updates belong to `event-gallery-admin-02-docs-and-e2e`
