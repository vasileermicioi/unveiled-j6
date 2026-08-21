## Context

Parent feature: unsaved form draft persistence (`.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md`), step 03 of 03 — docs and e2e. See `proposal.md` for motivation. Canonical product behavior is `docs/product/`; OpenSpec `openspec/specs/` is a planning mirror only. Runtime draft rules already live in `openspec/specs/event-catalog` from steps 01–02.

Runtime already matches parent release criteria (steps 01–02 done):

- Helper `apps/web/app/lib/form-draft.ts` (`unveiled:form-draft:v1:{formId}`, 7-day TTL, skip `file` / `wizard_intent`, debounce 300ms).
- Island `FormDraftPersistence`; copy `draftRestored` / `discardDraft` (DE/EN).
- Mounts: event wizard `admin-event:new` / `admin-event:{eventId}`; partner `admin-partner:new` / `admin-partner:{id}`; clone `admin-event-clone:{sourceEventId}`; gallery add `admin-event-gallery-add:{eventId}`.
- Create GET `getEventCreateWizard` renders the requested step (no 302 to General).
- Unit tests: `apps/web/app/lib/form-draft.test.ts`.

What remains is the **verification and documentation layer**. `admin-events.feature` has no draft scenarios. Sitemap still says create `/new/dates` GET redirects to `/new` (stale). `AGENTS.md` / design-system Form controls do not name the helper. Playwright has no refresh/discard/clear coverage.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim; proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); no `data-testid`; no new helper features; do not specify onboarding/booking drafts.

## Goals / Non-Goals

**Goals:**

- Bind AGENTS.md, design-system Form controls, UI map, sitemap create-step GET notes, Gherkin, Playwright, coverage matrix, and gaps-and-decisions to the shipped draft helper.
- Close the parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- Changing `form-draft.ts` payload shape, TTL, mounts, or flush/applied events.
- Partner-feature Gherkin or a second Playwright file (would require matching e2e under the BDD contract; event wizard is enough).
- Member onboarding/profile, booking, cookie-consent gating, encrypting drafts, server-side draft tables.
- Adding `data-testid` or HeroUI mutation modals.

## Decisions

1. **Docs-and-Gherkin first, then Playwright, then matrix, then close-out**
   - **Choice:** Update AGENTS.md + design-system + UI map + sitemap + gaps → Gherkin titles → Playwright → coverage-matrix → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim; sitemap currently contradicts shipped GET behavior.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **Locked Gherkin / Playwright titles (exactly three)**
   - **Choice:** Product Gherkin and `e2e/specs/admin-events.spec.ts` use these titles verbatim:
     - `Refresh keeps unsaved event edits`
     - `Edit steps keep unsaved edits`
     - `Successful event save clears draft`
   - Fold create GET `/new/dates` (no redirect to step 1) into **Edit steps** as an AND / URL assertion. Do not add `Create dates GET does not bounce to step 1` as a fourth Scenario (OpenSpec `event-catalog` already has that planning scenario; product BDD would force a fourth Playwright test).
   - **Rationale:** Step Spec Delta names those three titles; “one event-wizard spec” means one spec **file**, three tests.
   - **Alternatives:** Fourth Gherkin title (extra e2e, rejected). Partner Gherkin without e2e (violates BDD verbatim-title contract unless matrix-deferred).

3. **No partner-feature scenario**
   - **Choice:** Do not add draft scenarios to `admin-partners.feature`. Document partner create/edit opt-in only in UI map + design-system + AGENTS.md.
   - **Rationale:** Step says a second scenario is optional if cheap; adding Gherkin without Playwright is not cheap under the BDD contract. Unit serialize tests already exist.
   - **Alternatives:** Cheap partner Gherkin + Playwright (out of “event-wizard is enough”); matrix `deferred` row (noise).

4. **AGENTS.md hard rule 15 + pitfalls row**
   - **Choice:** Append a new numbered hard rule after native-first forms (§14). Cite `apps/web/app/lib/form-draft.ts` and `FormDraftPersistence`. State: unique `formId` per resource and intent; restore on load/refresh; skip `type=file` and `wizard_intent`; clear on successful persist POST; offer Discard. Exempt search, delete-confirm, freeze/refund/adjust-credits, comp-ticket, featured add search, Better Auth, member onboarding/profile. Add a Common pitfalls row: “Refresh loses admin form values” → mount the shared helper; do not invent cookies or a drafts table.
   - **Rationale:** Step deliverable; future forms follow AGENTS.md.
   - **Alternatives:** Design-system only (agents start at AGENTS.md hard rules).

5. **Design-system Form controls paragraph**
   - **Choice:** After the existing native-control bullets in `docs/product/ui/design-system.md` ## Form controls, add a short paragraph: SSR add/edit forms persist unsaved named fields in `localStorage` via `form-draft.ts` / `FormDraftPersistence`; restore after refresh; skip raw file inputs (staged ids/credits/hidden JSON MAY restore); clear on successful persist POST; Discard reloads server values. Exempt the same list as AGENTS.md. Do not describe debounce/TTL internals.
   - **Rationale:** Spec Delta “Docs name the helper.”
   - **Alternatives:** New top-level section (harder to find; Form controls is the cited home).

6. **UI map + sitemap notes**
   - **Choice:** Events row: create/edit wizard, clone, and gallery add opt into `FormDraftPersistence` (`admin-event:new` / `admin-event:{id}` / `admin-event-clone:{sourceEventId}` / `admin-event-gallery-add:{eventId}`). Partners row: create/edit `admin-partner:new` / `admin-partner:{id}`. Sitemap: replace “GET redirects to `/new`” on `/admin/events/new/dates` with “GET renders Date & tickets (no redirect to `/new`; localStorage drafts can restore)”; note the same for `/admin/events/new/image` GET. Optional one-liner that create/edit restore unsaved fields from `localStorage`.
   - **Rationale:** Step 01 shipped the GET contract; sitemap is still lying; UI map is where agents look for which forms exist.
   - **Alternatives:** Leave sitemap (agents reintroduce the 302).

7. **Playwright: title field as the observable; proximity selectors**
   - **Choice:** All three tests observe `adminLabels.title` (`Titel*`) via existing `fillTextbox`. Restore banner: `getByText(/nicht gespeicherter entwurf wiederhergestellt|unsaved draft restored/i)`. Discard: `getByRole("button", { name: /entwurf verwerfen|discard draft/i })`. Wait for draft persistence with `page.waitForFunction` on `localStorage.getItem("unveiled:form-draft:v1:admin-event:new")` (or `admin-event:{id}`) rather than a blind timeout. No `data-testid`. No CSS class selectors except if an existing layout class is already used elsewhere (prefer text/role).
   - **Refresh** (no R2): `goto` `/:locale/admin/events/new`, fill unique title, wait for key, `reload`, expect title + banner, Discard, expect empty title and no banner.
   - **Edit steps** (no R2): fill title on `/new`, wait for key, `page.goto` `/:locale/admin/events/new/dates` (GET, not Next POST), `toHaveURL` `/new/dates` (not `/new`), `goto` `/new` (or General step link), expect same title.
   - **Successful save** (R2 / `createEventViaUI`): create event title `Original`; edit; fill `UnsavedNeverSaved`; wait for key; fill `SavedTitle`; click Save **immediately** (do not wait for the second debounce) so a leftover draft would still be `UnsavedNeverSaved`; reopen edit; expect `SavedTitle`, no restore banner. Env-skip when `E2E_ADMIN_*` / R2 missing — never “UI not built.”
   - **Rationale:** Step says refresh title is enough; save-clears needs a mismatch between stored draft and POST body; GET `/new/dates` is the step-01 contract.
   - **Alternatives:** Edit-only refresh (needs a created event / R2 for the cheap tests). Assert `localStorage` null after save only (weaker user-visible proof; banner + DB title is enough if the race is set up).

8. **Coverage matrix: three new rows**
   - **Choice:** Insert after the wizard-step cluster (`Create walks three steps` / `Edit can jump to image`):
     - `Refresh keeps unsaved event edits` → `pass`; notes: create `/new` title; Discard; `E2E_ADMIN_*`; no R2.
     - `Edit steps keep unsaved edits` → `pass`; notes: GET `/new/dates` no redirect; return to General; `E2E_ADMIN_*`; no R2.
     - `Successful event save clears draft` → `pass`; notes: R2 env-skip; leftover draft vs saved title; no restore banner on reopen.
   - **Rationale:** Step deliverable. Status `pass` with env-skip is allowed.
   - **Alternatives:** Mark save-clears `deferred` (rejected — it is in the Spec Delta).

9. **Gaps-and-decisions one-liner**
   - **Choice:** Append under Image uploads / event-form UX (or a short **Admin SSR form drafts** row): unsaved add/edit drafts are browser `localStorage` (`unveiled:form-draft:v1:{formId}`), not cookies (payload can exceed cookie size; must not ride every HTTP request) and not a `drafts` table. No multi-device sync. Raw `File` bytes are not stored.
   - **Rationale:** Parent non-goal; step asks for this exact decision.
   - **Alternatives:** Silent (next agent will propose cookies).

10. **OpenSpec mirror vs product SoT**
    - **Choice:** This change’s `admin-events` and `design-system` deltas are the planning contract. Apply updates `docs/product/` + `AGENTS.md` as SoT. Do not treat archived OpenSpec specs as behavioral SoT. Do not duplicate runtime helper rules into a new `event-catalog` delta (already shipped in steps 01–02). After apply, mark the parent step done.
    - **Rationale:** AGENTS.md / step Cleanup.
    - **Alternatives:** Sync `openspec/specs/` only — agents would still follow stale Gherkin/sitemap.

## Risks / Trade-offs

- **[Risk] Sitemap “GET redirects to `/new`” survives** → Mitigation: Decision 6 + grep `GET redirects to` / `redirects to \`/new\``.
- **[Risk] Fourth Gherkin title creeps in and CI fails the BDD mapping** → Mitigation: Decision 2 — only three Scenario titles; GET contract is an AND.
- **[Risk] Save-clears race: second `fill` debounces before click** → Mitigation: Decision 7 — no wait after `SavedTitle`; if flaky, set the input value via `fill` then click within the same turn; fail the test rather than add `data-testid`.
- **[Risk] Hydration: reload asserts title before the island restores** → Mitigation: wait for banner text or `waitForFunction` on the input value; `expect` with timeout.
- **[Risk] Create `/new` without a partner still shows Titel** → Mitigation: existing `Country and city are fixed on the form` already opens `/new` without R2; reuse that setup.
- **[Risk] R2 / `E2E_ADMIN_*` skip masks a title mismatch** → Mitigation: titles and matrix are committed regardless of skip; skip reason stays env-only.
- **[Trade-off] No partner/clone/gallery e2e** → Intentional; helper unit tests + wizard e2e; docs cover the other mounts.
- **[Trade-off] Checking `localStorage` in waitForFunction** → Allowed as a wait, not as the sole assertion; user-visible title/banner/URL remain the Then.

## Migration Plan

1. Land docs + Gherkin + e2e + coverage-matrix + gaps + parent close-out together (no schema/API migration).
2. No rollback beyond reverting the docs/e2e commit; steps 01–02 helper and mounts remain correct.
3. After merge: mark step 03 + parent guide done; archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — helper API, copy keys, form ids, and GET wizard behavior are already shipped; this step only documents and tests them.)_
