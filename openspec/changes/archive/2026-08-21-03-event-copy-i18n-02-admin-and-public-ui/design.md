## Context

Parent feature: event title/description DE+EN (`.dev-plan/current-iteration/03-event-copy-i18n-parent-guide.md`), step 02 of 03 — admin General fields + locale-resolved public/member chrome. See proposal.md for motivation.

Step 01 is done (`03-event-copy-i18n-01-schema-and-domain`):

- Columns `title_de` / `title_en` / `description_de` / `description_en` (`text not null`). Canonical `title` / `description` are DE write-time copies.
- `resolveEventCopy(event, locale)` — requested locale (non-empty title) → other locale → canonical. `resolveEventCopyFields` still has a **legacy shim** when no locale fields are passed (seed/tests).
- Title ILIKE already ORs both locale columns. Admin list Title column still sorts/displays canonical `title`.

Current live UI this step replaces:

- `EventAdminBaseFields`: single `TextField` `name="title"` + one `EventDescriptionEditor` `name="description"`.
- `parseEventFormBody` / `EventFormValues` / `toCreateEventInput` / `toUpdateEventInput` / `eventToFormDefaults` still use `title` / `description` → domain shim duplicates into both locales.
- `toEventCardItem(event)` sets `title: event.title`. Call sites: `events/index.tsx`, `discover.tsx`, `saved/index.tsx`.
- `EventDetailPage` and its map-marker helper read `event.title` / `event.description`. `eventDetailPageMeta` / `buildEventJsonLd` do the same.
- Book / waitlist / confirm / `BookingTicketCard` / `listUserBookings` event slice use canonical `title`. Booking and waitlist-promotion emails already take a `locale` but still interpolate `event.title`.

Constraints: SSR form POST only; HeroUI + native-first (hard rules §8, §14); two MDX editors remain the documented form-control exception; Tailwind layout only; no nested locale tablist on the three-step wizard; Gherkin/Playwright/schema-overview wait for step 03.

## Goals / Non-Goals

**Goals:**

- General step authors DE and EN titles + Markdown descriptions (stacked, labeled).
- Admin write path posts locale field names and passes `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` into catalog create/update.
- Every member/guest surface that shows event **copy** uses `resolveEventCopy` for the active `/:locale`.
- SEO/JSON-LD body match the URL locale. Emails that already have a locale use resolved title.
- Form-draft flushes **both** Markdown editors. Stories/fixtures have distinct locale fields (canonical `title` still present).
- Parser + SEO unit tests cover the new field names and locale-resolved meta.

**Non-Goals:**

- Dropping the domain legacy shim for seed/tests (step 03 owns bilingual seed). Admin path must not use it.
- Admin list/table, Featured, gallery, delete, clone, comp-ticket chrome showing EN titles (canonical DE-first is OK).
- Gherkin, Playwright, `schema-overview.md`, `seo-and-metadata.md`, content-i18n-inventory (step 03).
- Translating partner name, address, category/type (series `04`), secret codes, image credits.
- Nested locale tablist; changing GFM/`MarkdownContent` / MDXEditor internals.
- Per-recipient email locale (waitlist promotions keep the caller’s `locale`).
- ICS `SUMMARY` / booking ledger `description` (stay canonical).

## Decisions

1. **Stack DE then EN on General; no locale tabs**
   - **Choice:** In `EventAdminBaseFields`, replace the single title + description block with four controls, partner field then:

     1. `TextField` `name="title_de"` — label `copy.titleLabelDe` (Titel (DE) / Title (DE))
     2. `EventDescriptionEditor` `name="description_de"` — `copy.descriptionLabelDe` (Beschreibung (DE) / Description (DE))
     3. `TextField` `name="title_en"` — `copy.titleLabelEn` (Titel (EN) / Title (EN))
     4. `EventDescriptionEditor` `name="description_en"` — `copy.descriptionLabelEn`

     Distinct `id` / `aria-labelledby` / hint ids per editor (`description-de-*`, `description-en-*`). Keep `isRequired={generalRequired}` / `required={generalRequired}` on all four. Shared Markdown hint can stay one `Description` under each editor or a single hint reused — prefer **one hint per editor** so each has `aria-describedby`. Do **not** add a tablist, accordion, or “copy from DE” control.
   - **Rationale:** Parent non-goal: nested locale tablist conflicts with the three-step wizard. Step plan locks DE-then-EN stack and copy keys via `getAdminCopy`.
   - **Alternatives:** Nested tabs (forbidden). One editor with a locale toggle (client-only mutation of a single field — hides the other locale on submit). Side-by-side columns on large viewports (optional layout later; stack is the lock).

2. **Parser and form values: locale fields only; ignore legacy POST names**
   - **Choice:** Extend `EventFormValues`, `EventFormDefaults`, `parseEventFormBody`, `eventToFormDefaults`, `formValuesToDefaults`:

     | Form / DB | TypeScript |
     |---|---|
     | `title_de` | `titleDe` |
     | `title_en` | `titleEn` |
     | `description_de` | `descriptionDe` |
     | `description_en` | `descriptionEn` |

     Stop assigning `values.title` / `values.description` from `body.title` / `body.description`. Keep optional `title` / `description` on `EventFormValues` **only if** a caller still needs canonical for display — prefer **drop** them from form values and derive canonical in `toCreateEventInput` via catalog (`titleDe` is canonical). `toCreateEventInput` / `toUpdateEventInput` / `toSeriesCreateInput` pass `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` and **omit** legacy `title` / `description` so `resolveEventCopyFields` takes the locale path.

     `eventToFormDefaults`: `titleDe: event.titleDe`, etc. (not canonical `event.title`).
   - **Rationale:** Step plan: remove the admin shim. Domain still accepts legacy for seed.
   - **Alternatives:** Parser copies `title` into both locales if locale names missing (hides missed callers). Keep `values.title` as an alias of `titleDe` (confusing).

3. **Catalog errors: locale field names map to copy**
   - **Choice:** Add `fieldErrors.titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` (DE/EN admin UI copy, e.g. “English title is required.” / “Englischer Titel ist erforderlich.”). Keep `fieldErrors.title` / `description` for `EVENT_NOT_FOUND` and any leftover canonical mapping. `mapCatalogErrorCode` already looks up `REQUIRED_FIELD` field names that exist on `fieldErrors` — `requireNonEmpty(..., "titleDe")` will hit the new keys. `eventFormErrorStep` already sends unknown `REQUIRED_FIELD` to step 1 — locale copy stays on General.
   - **Rationale:** Empty EN title must not show the partner `name` error (`REQUIRED_FIELD` default is `"name"`).
   - **Alternatives:** Reuse `fieldErrors.title` for all four (ambiguous which field failed).

4. **Resolve at the edge: mapper / page / SEO, not inside EventCard**
   - **Choice:** `EventCardItem.title` stays a resolved string. Change `toEventCardItem(event, locale: Locale)` to `title: resolveEventCopy(event, locale).title`. Update Discover, feed, and saved call sites (`guard.locale` / route locale). `EventCard` itself stays locale-agnostic.

     `EventDetailPage`: at the top, `const copy = resolveEventCopy(event, locale)` and use `copy.title` / `copy.description` for identity heading, `MarkdownContent`, hero `alt`, and the in-page map marker. Do **not** mutate `event`.

     `eventDetailPageMeta(event, locale)` / `buildEventJsonLd(event, locale)`: resolve first, then existing `markdownToPlainText` + truncate. Document title pattern unchanged except the title segment is resolved: `` `${copy.title} at ${event.partnerName}` `` (`buildPageMeta` still appends ` — Unveiled Berlin`).

     Map route: `title: resolveEventCopy(event, guard.locale).title` when building `EventMapMarker`.
   - **Rationale:** Step plan: `toEventCardItem` and `buildEventJsonLd` must take `locale` (or pre-resolved strings). One helper at the boundary avoids every card re-importing `@unveiled/db`.
   - **Alternatives:** Pass both titles into `EventCard` (API churn, unused). Resolve in SQL (wrong for fallback rules; helper already exists).

5. **Booking / waitlist / tickets: resolve in the route, keep slim event `{ title }`**
   - **Choice:** Book, confirm, waitlist join/cancel, and ticket-card pages already receive an event-like `{ title }`. Set `title: resolveEventCopy(event, locale).title` in the route (or a one-liner helper `resolvedEventTitle(event, locale)` in `catalog-mappers.ts`). `UserBookingEventSummary` stays `{ title: string }`; `listUserBookings` should select `title_de` / `title_en` / canonical `title` (and descriptions only if needed) and resolve in the bookings route with page locale — **or** select the four copy columns onto the summary and resolve in `BookingTicketCard`. Prefer resolve in the **bookings route** so the card stays dumb. Extend the SQL select accordingly; do not change ledger copy.
   - **Rationale:** Ticket card has no `locale` today; the route does. Avoid threading `Event` through every booking component.
   - **Alternatives:** Give `BookingTicketCard` a `locale` + full event (wider props). Keep canonical titles on My Tickets (fails step-plan “ticket card”).

6. **Emails with locale use resolved title; ICS stays canonical**
   - **Choice:** In `book.tsx` `sendConfirmationSafe` and `waitlist-promotion-email.ts` callers, pass `title: resolveEventCopy(event, locale).title`. Email builders stay “given a title string.” ICS builders keep `event.title` (canonical) unless they already receive the same slim object — if they share the slim `{ title }` used by the email, **split**: email gets resolved title; ICS input uses canonical `event.title` from the catalog row. Waitlist promotion keeps the **caller’s** locale (no per-recipient profile lookup this step).
   - **Rationale:** Step plan: MAY keep canonical in email unless the renderer has a locale — these renderers do. ICS is calendar interoperability, not a page locale.
   - **Alternatives:** Resolve inside `buildBookingConfirmationContent` from a full Event (email package should not depend on catalog fallback rules if the route can pass a string). Per-user locale for waitlist (needs profile language; out of scope).

7. **Form-draft: two editors, existing flush-by-name**
   - **Choice:** Do **not** change `form-draft.ts`. `EventDescriptionEditor` already writes `textarea.name` on `FORM_DRAFT_FLUSH_EVENT` and restores `draftFieldValue(fields, name)`. Two instances with `description_de` / `description_en` both flush. Title `TextField`s are native named inputs and already persist. Update the wizard story/scenario copy only if a story hard-codes `name="description"`.
   - **Rationale:** Series `02` already shipped; step plan says flush both if that helper exists.
   - **Alternatives:** A dedicated dual-editor flush (unnecessary).

8. **Admin tables stay canonical; stories get both locales**
   - **Choice:** `AdminEventsTable` / Featured add-results / gallery headings / delete body keep `event.title`. Ladle `EventAdminBaseFields.stories` and `fixtures.ts` `mockEvent`: set `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` (MAY diverge, e.g. DE “Poetry & Jazz Night” / EN “Poetry & Jazz Night” is OK; prefer at least one story/fixture with divergent titles so visual review is obvious). Canonical `title` remains the DE value. `mockEventCardItem.title` is whatever locale the story is in (EN stories → English string).
   - **Rationale:** Step plan: admin list MAY stay DE-first; stories must include locale fields.
   - **Alternatives:** Locale-switch the admin table (out of scope; DE-first is the Berlin admin language).

9. **Tests this step: parser + SEO only**
   - **Choice:** `admin-event-form.test.ts`: parse `title_de`/`title_en`/`description_*`; ignore posted `title`/`description`; empty EN title still parses to `""` (domain rejects later). Helper fixtures that POST `title: "Jazz Night"` must switch to locale names (bulk update of the shared body factory). `seo.test.ts`: add `eventDetailPageMeta` / `buildEventJsonLd` cases with divergent DE/EN copy and `locale: "en"` vs `"de"`. Do not add Playwright here.
   - **Rationale:** Step verification names those two files. Catalog `resolveEventCopy` is already unit-tested in step 01.
   - **Alternatives:** Snapshot EventDetailPage (Ladle is enough). E2E in this PR (step 03).

## Risks / Trade-offs

- **[Risk] Missed `event.title` on a member/guest surface** → Mitigation: grep `apps/web` (routes + components, not admin tables) for `event.title` and `toEventCardItem(`; list remaining admin-only hits in the PR.
- **[Risk] Parser tests still POST `title` and silently save duplicated locales** → Mitigation: parser **ignores** `title`/`description`; tests that omit locale names get empty strings and fail assertions / catalog `REQUIRED_FIELD`.
- **[Risk] Two MDXEditor bundles on General** → Accepted; same island twice. Draft flush is per-name so they do not clobber each other.
- **[Risk] `listUserBookings` only selects canonical `events.title`** → Mitigation: extend the select + resolve in the bookings route in the same PR as ticket-card copy.
- **[Trade-off] Domain shim remains for seed** → Admin never uses it; step 03 replaces seed strings. Leaving the shim avoids a seed rewrite in this UI step.
- **[Trade-off] Admin Events Title column stays German** → Matches parent: canonical is DE; filter already matches EN.
- **[Trade-off] Waitlist promotion email locale is the triggering request, not the member’s profile language** → Pre-existing; only the title string becomes locale-resolved for that caller locale.

## Migration Plan

1. Confirm step 01 exports (`resolveEventCopy`, locale columns on `Event`, shim still used by `toCreateEventInput`).
2. Copy keys + four General fields; parser + defaults + `toCreateEventInput` locale path; error keys.
3. Thread `locale` through `toEventCardItem`, detail, map, SEO/JSON-LD, booking/waitlist/ticket routes, email callers.
4. Extend `listUserBookings` select if the ticket card still sees canonical-only title.
5. Update Ladle/fixtures; bulk-fix `admin-event-form.test.ts` bodies; add SEO locale tests.
6. `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/admin-event-form.test.ts app/lib/seo.test.ts`.
7. Grep leftover admin POST `name="title"` / `name="description"` on the event form (refund/adjust-credits `name="description"` is unrelated).
8. Mark step 02 done in the parent guide. Do not start step 03 Gherkin.
9. **Rollback:** revert the PR. Locale columns stay (step 01); form would need the shim again if rolled back alone — roll back UI+parser together.

## Open Questions

- None blocking. Whether `toEventCardItem` takes `locale` vs pre-resolved `{ title }` is an implementation detail; tests and call sites must not read canonical `event.title` for public cards.
