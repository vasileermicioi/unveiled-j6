## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/03-event-copy-i18n-02-admin-and-public-ui.md`, parent guide release criteria / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 01 is present: `events.title_de` (etc.) exist; `resolveEventCopy` is exported; `parseEventFormBody` still reads `body.title` / `body.description`; General UI is still a single title + one `EventDescriptionEditor`

## 2. Admin copy, fields, and parser

- [x] 2.1 Add `getAdminCopy` labels `titleLabelDe` / `titleLabelEn` / `descriptionLabelDe` / `descriptionLabelEn` (Titel (DE) / Title (EN) and Beschreibung (DE) / Description (EN) or equivalent) and `fieldErrors.titleDe` / `titleEn` / `descriptionDe` / `descriptionEn`; keep `fieldErrors.title` / `description` for existing mappings
- [x] 2.2 On General in `EventAdminBaseFields`, stack DE then EN: two `TextField`s (`title_de`, `title_en`) and two `EventDescriptionEditor`s (`description_de`, `description_en`) with distinct ids / labelled-by; no nested locale tablist; keep Markdown hint + hidden textarea POST
- [x] 2.3 Extend `EventFormValues` / `EventFormDefaults` with `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn`; `parseEventFormBody` reads those POST names and ignores `title` / `description`; `eventToFormDefaults` / `formValuesToDefaults` round-trip locale fields
- [x] 2.4 `toCreateEventInput` / `toUpdateEventInput` / `toSeriesCreateInput` pass locale fields and omit legacy `title` / `description` so catalog takes the locale write path (leave domain shim for seed/tests)

## 3. Public and member surfaces

- [x] 3.1 Change `toEventCardItem(event, locale)` to set `title` from `resolveEventCopy`; update Discover, member feed, and saved list call sites
- [x] 3.2 `EventDetailPage` (identity heading, Markdown description, hero alt, in-page map marker) uses `resolveEventCopy(event, locale)`
- [x] 3.3 `eventDetailPageMeta(event, locale)` and `buildEventJsonLd(event, locale)` use resolved title/description; document title `{resolved title} at {partner}`; meta/JSON-LD description from plain-text of resolved Markdown; wire `events/[id].tsx`
- [x] 3.4 Map popup titles in `events/map.tsx` use resolved title for `guard.locale`
- [x] 3.5 Book, waitlist join/cancel, confirm chrome, and `BookingTicketCard` show resolved title for the page locale; extend `listUserBookings` select if the ticket summary is canonical-only
- [x] 3.6 Booking-confirmation and waitlist-promotion email callers pass `resolveEventCopy(event, locale).title`; ICS / ledger / admin tables keep canonical `title`

## 4. Tests, stories, and grep

- [x] 4.1 Update `admin-event-form.test.ts` bodies to `title_de` / `title_en` / `description_*`; assert locale parse; assert posted `title` / `description` are ignored
- [x] 4.2 Add/adjust `seo.test.ts` for `eventDetailPageMeta` / `buildEventJsonLd` with divergent DE/EN copy per locale
- [x] 4.3 Update Ladle / `fixtures.ts`: `titleDe` / `titleEn` (canonical `title` still present); `EventAdminBaseFields.stories` defaults use both locale fields; prefer one divergent-title fixture for visual review
- [x] 4.4 Grep `apps/web` member/guest routes and components for leftover `event.title` / `toEventCardItem(` without locale (admin list/table MAY stay canonical; refund `name="description"` is unrelated)

## 5. Verification and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 5.2 Run `cd apps/web && bun test app/lib/admin-event-form.test.ts app/lib/seo.test.ts` — exit 0
- [x] 5.3 Mark step 02 done in `.dev-plan/current-iteration/03-event-copy-i18n-parent-guide.md`. Leave Gherkin / Playwright / schema-overview / i18n-inventory to step 03. Do not start taxonomy (series `04`)
