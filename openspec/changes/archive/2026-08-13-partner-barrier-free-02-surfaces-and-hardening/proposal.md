## Why

Step 01 stored `partners.barrier_free` but left `events.barrier_free` as the live source for admin events and public DETAILS. Admins can still disagree across events at the same venue. This step closes parent feature `01-partner-barrier-free` (step 02 of 02): one venue-level control, still visible on every event detail.

## What Changes

- Partner create/edit: native Yes/No select labeled Barrierefrei / Barrier-free (`AdminFormSelect` / `.admin-native-select`), placed near opening hours. Yes → `true`, No → `null`. Parse in partner create/edit POST (`parsePartnerFormBody` + `createPartner` / `updatePartner`).
- Public event detail DETAILS Accessibility / Barrierefreiheit row reads `partner.barrierFree` (route already loads the hosting partner for logo/hours). Stop reading `event.barrierFree`. Keep existing `accessibilityValue` copy (`true` → Barrier-free / Barrierefrei; unset → Not specified / Keine Angabe). The unused `false` display branch MAY remain for defensive reads.
- **BREAKING (admin/catalog):** Remove the event-level field from `EventAdminBaseFields`, `EventFormValues`, body parser `barrier_free`, `createEvent` / `updateEvent` / `cloneEvent` inputs, clone copy, booking/catalog fixtures that only existed for the column.
- **BREAKING (schema):** Migration backfills `partners.barrier_free = bool_or(events.barrier_free)` per partner (any `true` wins; otherwise `NULL`, coercing stored `false`), then drops `events.barrier_free`.
- Seed: lift barrier-free onto demo partners (any fixture event `barrierFree: true` lifts to that partner); stop writing event `barrierFree`. Current Abundo fixtures are all `false`, so partners stay `NULL` unless a fixture is later marked true.
- Gherkin + Playwright: partner set/clear; event form has no barrier-free control; event detail still shows the partner value. Split the old admin-events “Optional accessibility and audience metadata” line — keep languages/subtitles on the event form scenario.
- Canonical docs: `schema-overview.md`, `admin-partners.feature`, `admin-events.feature`, `event-discovery.feature`, `ui-component-map.md` Event detail / Partners notes, coverage matrix, e2e `admin.ts` helper → partner form.
- Out of scope: Discover filters; member profile `accessibility`; partner portal; storing `false` as a third state.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `partner-catalog`: Admin partner create and edit SHALL include an optional native select for barrier-free (Yes/No). Yes stores `partners.barrier_free = true`. No stores `NULL`. After this step, partner writes no longer have an event column to dual-write; the step-01 “do not update `events.barrier_free`” contract is retired with the drop.
- `event-catalog`: Admins MAY still set supported languages, language-independent, and subtitles on events. The system SHALL NOT collect or store barrier-free on events. `events.barrier_free` and clone/create/update copies of it are removed after `bool_or` backfill onto partners.
- `event-discovery`: Public event detail DETAILS SHALL show an Accessibility / Barrierefreiheit row whose value comes from the hosting partner’s `barrier_free` (`true` → Barrier-free / Barrierefrei; `NULL` → Not specified / Keine Angabe). Guests and members see the same ungated row (like partner hours).

## Impact

- **Admin UI:** `apps/web/app/components/admin/PartnerForm.tsx`; `apps/web/app/lib/admin-content.ts` (reuse `barrierFreeLabel`); `apps/web/app/lib/admin-route.ts` (`PartnerFormValues` + `parsePartnerFormBody`); create/edit partner routes pass `barrierFree` into domain writes and form defaults.
- **Event admin:** `EventAdminBaseFields`, `event-admin-types.ts`, `admin-event-form.ts` parser, `admin-event-input.ts`, `admin-event-route-helpers.ts`; clone no longer copies `source.barrierFree`.
- **Public detail:** `apps/web/app/routes/[locale]/events/[id].tsx` partner attribution; `EventDetailPage` `accessibilityValue(partner.barrierFree)`.
- **DB:** Drizzle `events` drop `barrierFree`; generated migration (backfill then drop); `packages/db/src/catalog/events.ts` create/update/clone; `packages/db/src/catalog/seed-data.ts` + `seed.ts` + Abundo fixture; `packages/db/src/catalog/barrier-free.integration.test.ts` (drop “leave event column unchanged” assertion).
- **E2E:** `e2e/fixtures/admin.ts` (`barrierFree` helper → partner form); `e2e/specs/admin-partners.spec.ts`, `admin-events.spec.ts`, `event-discovery.spec.ts`; `e2e/fixtures/catalog.ts` / `waitlist.ts` event `barrierFree` fields.
- **Product SoT:** `docs/product/database/schema-overview.md`, `docs/product/features/{admin-partners,admin-events,event-discovery}.feature`, `docs/product/ui/ui-component-map.md`, `docs/product/testing/coverage-matrix.md`.
- **Source brief:** `.dev-plan/current-iteration/01-partner-barrier-free-02-surfaces-and-hardening.md`
- **Parent:** `.dev-plan/current-iteration/01-partner-barrier-free-parent-guide.md`
- **Depends on:** `partner-barrier-free-01-schema-and-domain` (archived / done)
- **Consumed by:** closes the Partner barrier-free feature
- **Verification:** `bun run db:generate`; `cd packages/db && bun test`; `bun run typecheck`; `bun run lint`; Playwright titles match new Gherkin (R2 skip only when partner create needs a logo upload)
