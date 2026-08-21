## Why

Step 01 already persists `title_de` / `title_en` / `description_de` / `description_en` and exports `resolveEventCopy`, but the admin General step still posts a single `title` / `description` (domain shim copies that string into both locales) and every member/guest surface still reads canonical `title`. Until the form authors both locales and public pages resolve by `/:locale`, EN copy cannot ship. This is step 02 of parent `03-event-copy-i18n`.

## What Changes

- Admin create/edit General: stack **two** title `TextField`s and **two** `EventDescriptionEditor`s (DE then EN). **No nested locale tablist.**
- **BREAKING (form POST):** stop reading `body.title` / `body.description`. Field names are `title_de`, `title_en`, `description_de`, `description_en`. Remove the step-01 domain shim from the admin write path (`toCreateEventInput` / `toUpdateEventInput` pass locale fields).
- Labels via `getAdminCopy`: Titel (DE) / Title (EN) and Beschreibung (DE) / Description (EN) (or equivalent). Both Markdown editors still submit hidden native textareas.
- Public/member surfaces that show event copy use `resolveEventCopy` for the active `/:locale` (fallback: other locale, then canonical): Event detail, EventCard (feed, Discover featured, saved), map popup, SEO document title / meta description / JSON-LD `name` + `description`, booking / waitlist / confirm / ticket card.
- SEO: `{resolved title} at {partner} — Unveiled Berlin`; meta description from resolved Markdown (plain-text extract, existing truncate); JSON-LD from resolved copy. Each locale URL’s body and meta MUST match that locale (`hreflang` already points at the other URL).
- Transactional email: if the renderer already has a locale (booking confirmation, waitlist promotion), pass `resolveEventCopy(event, locale).title`. ICS / ledger / admin tables MAY keep canonical `title` (DE-first).
- Admin Events table, Featured add-results, gallery, delete, clone chrome MAY keep showing canonical `title`. Title **filter** already matches both locales (step 01).
- Form-draft: flush **both** Markdown editors (distinct `name`s). Ladle/fixtures include `titleDe` / `titleEn` (canonical `title` still present).
- Out of scope: Gherkin / Playwright / schema-overview / i18n-inventory polish (step 03); translating category/type (series `04`); partner name i18n; nested locale tabs; Markdown pipeline changes.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Admin create/edit SHALL present two title fields and two Markdown description editors (DE then EN). Submitting SHALL persist `title_de` / `title_en` / `description_de` / `description_en`. Canonical `title` / `description` remain DE-derived on write. The single-field POST shim SHALL be removed from the admin write path.
- `event-discovery`: Public event detail, EventCards, map popups, Discover featured, saved list, and event SEO/JSON-LD SHALL display locale-resolved title (and description on detail + SEO only) for the active `/:locale`. `/de/events/:id` and `/en/events/:id` MAY show different copy for the same event.
- `booking`: Book, confirm, and ticket-card chrome SHALL show the locale-resolved title. Booking-confirmation and waitlist-promotion emails SHALL use `resolveEventCopy` when they already have a locale.

## Impact

- **Admin UI:** `EventAdminBaseFields.tsx` (stack DE/EN title + two editors); `EventDescriptionEditor` (already `name`-parameterized); `admin-content.ts` labels + `fieldErrors` for `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn`; `admin-event-form.ts` parser + `EventFormValues`; `event-admin-types.ts` defaults; `eventToFormDefaults` / `formValuesToDefaults`; `admin-event-input.ts` (`toCreateEventInput` / `toUpdateEventInput` / series helper); `mapCatalogErrorCode` locale field names; Ladle `EventAdminBaseFields.stories`.
- **Public/member UI:** `catalog-mappers.ts` (`toEventCardItem(event, locale)`); `EventDetailPage` + `events/[id].tsx`; `events/index.tsx`, `discover.tsx`, `saved/index.tsx`, `events/map.tsx`; `seo.ts` (`eventDetailPageMeta`, `buildEventJsonLd`) + `seo.test.ts`; booking/waitlist/confirm/ticket components and their routes.
- **Email:** callers of `buildBookingConfirmationContent` / `buildWaitlistPromotionContent` pass resolved title; ICS stays canonical.
- **Unchanged domain contract:** `@unveiled/db` `resolveEventCopy` / write coerce / title ILIKE (step 01). Admin list Title column stays canonical. Gherkin/Playwright/schema-overview/seed bilingual fixtures wait for step 03.
- **Source brief:** `.dev-plan/current-iteration/03-event-copy-i18n-02-admin-and-public-ui.md`
- **Parent:** `.dev-plan/current-iteration/03-event-copy-i18n-parent-guide.md`
- **Depends on:** `03-event-copy-i18n-01-schema-and-domain` (done — columns, `resolveEventCopy`, search OR, clone, shim)
- **Consumed by:** `03-event-copy-i18n-03-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/admin-event-form.test.ts app/lib/seo.test.ts`
