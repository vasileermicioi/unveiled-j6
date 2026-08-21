## Why

Admin event create/edit is a three-step wizard with per-step URLs, but unsaved values live only in the current document (or a create Next/Back POST replay). Edit step chrome uses `<Link>` (full GET from the database), create GET on `/dates` and `/image` 302s to step 1, and a refresh always drops in-memory values. Admins lose in-progress work; this step ships a reusable `localStorage` draft helper on the event wizard so later catalog forms can reuse it.

## What Changes

- Add a small client helper (`apps/web/app/lib/form-draft.ts`) plus island (`apps/web/app/islands/FormDraftPersistence.tsx`) that snapshots serializable named fields on any SSR `<form>` into `localStorage` key `unveiled:form-draft:v1:{formId}`.
- Event wizard form ids: `admin-event:new` (create) and `admin-event:{eventId}` (edit). Skip `type=file`, `wizard_intent`, and submit buttons. Do not persist raw `File` bytes.
- Debounced `input`/`change` listeners; restore in `useLayoutEffect` before paint when possible. Flush MDXEditor (and other islands) into hidden inputs before snapshot via a document event or callback registry.
- Clear the draft on persist submit (`wizard_intent` missing or `create`/`save`, not `next`/`back`). 7-day TTL; ignore malformed JSON.
- Mount the helper on `EventAdminForm`. Restore banner DE/EN: “Nicht gespeicherter Entwurf wiederhergestellt” / “Unsaved draft restored” plus Discard (clears storage, reloads).
- **Create GET** `/:locale/admin/events/new/dates` and `/:locale/admin/events/new/image` SHALL render those wizard steps (empty/default server values) instead of 302 to step 1, so a restored draft can populate steps 2/3 after refresh.
- Unit-test serialize/restore/TTL/skip-file (and skip `wizard_intent`) in `form-draft.ts` without jsdom if possible.
- Out of scope: partner/clone/gallery forms (step 02); AGENTS.md/Gherkin/Playwright (step 03); encrypting drafts; cookie-consent gating; cookies as draft storage.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Admin event create and edit wizards SHALL persist in-progress field values in browser `localStorage` (not cookies) keyed per create-session or event id, restore them after a refresh or step URL change, and clear them after a successful create or save POST. Raw `File` inputs SHALL NOT be stored. Create GET on `/:locale/admin/events/new/dates` and `/:locale/admin/events/new/image` SHALL render those steps (no redirect to step 1) so a restored draft can populate the form. A visible restore notice SHALL offer Discard draft.

## Impact

- **Client helper:** `apps/web/app/lib/form-draft.ts` + `apps/web/app/lib/form-draft.test.ts` (pure snapshot/restore/TTL).
- **Island:** `apps/web/app/islands/FormDraftPersistence.tsx` (and likely `apps/web/app/components/admin/FormDraftPersistence.tsx` matching existing island re-export). Banner chrome is HeroUI; Tailwind layout only.
- **Event wizard:** `EventAdminForm` gets a stable `formId`; `EventDescriptionEditor` flushes Markdown into `description` (and later locale fields) before snapshot.
- **HTTP:** `getEventCreateWizard` stops 302ing `step !== 1` to General. Create Next/Back POST behavior stays; localStorage is an additional restore path for refresh and edit Links.
- **Copy:** `getAdminCopy` restore + discard strings (DE/EN). Do not collide with cookie-consent key `unveiled:cookie-consent`.
- **Source brief:** `.dev-plan/current-iteration/02-form-draft-persistence-01-shared-helper-and-event-wizard.md`
- **Parent:** `.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md`
- **Consumed by:** `02-form-draft-persistence-02-remaining-admin-forms`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/form-draft.test.ts`
