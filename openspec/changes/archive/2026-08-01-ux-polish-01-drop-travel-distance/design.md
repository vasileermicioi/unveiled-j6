## Context

Parent feature: UX polish (`.dev-plan/current-iteration/ux-polish-parent-guide.md`), step 01. Travel distance was added by the archived `onboarding-travel-distance` parent and is now unused for discovery ranking.

Current state:

- **Domain (`@unveiled/auth`):** `LocationStepPayload.maxDistance` required; `validateMaxDistance` enforces integer km in `MAX_DISTANCE_MIN`–`MAX_DISTANCE_MAX` (1–50); location + Vibes saves persist `max_distance` and clear `districts`.
- **UI:** `LocationStepForm` and `PreferencesForm` show native `input type="number"` for `max_distance` with `radiusLabel` / `km` copy; route parsers (`parseMaxDistanceField`) fail closed when missing.
- **Admin:** `AdminUserDetailPage` shows `{value} km` when non-null; omits when null.
- **Docs/e2e:** Gherkin, schema overview, gaps/i18n, coverage matrix, `DEPLOYMENT.md`, and Playwright assert required travel distance on onboarding + Vibes.

Constraints: domain logic in packages; HeroUI + native forms; `docs/product/` SoT; proximity-only e2e; leave JSONB key in place (no SQL purge); independently mergeable vs later ux-polish steps.

## Goals / Non-Goals

**Goals:**

- Onboarding step 3 and Vibes collect Germany/Berlin + Berlin zip only — no travel-distance control, copy, or required field.
- Location/preference domain validation and writes do not require or set `max_distance`; existing JSONB values remain untouched on those saves.
- Admin still displays legacy km when non-null; omit/unset when null (no invented value).
- Unit tests, stories, product docs, coverage matrix, `DEPLOYMENT.md`, and touched Playwright specs match the new contract.
- Lint + typecheck green; auth unit tests + touched onboarding/profile e2e pass.

**Non-Goals:**

- Feed filtering/ranking by distance.
- SQL migration or bulk nulling of `max_distance`.
- Forced re-onboarding for users who already have a stored distance.
- `ux-polish-02`–`05` (structured address, hero, subtitles, featured thumbnails).
- Partner portal / Phase 6+ booking changes.

## Decisions

1. **Leave legacy JSONB untouched on write (neither require nor clear)**
   - **Choice:** Remove `maxDistance` from `LocationStepPayload` / cultural preference location validation path. Location merge writes `country` / `city` / `zip_code` + `districts: null` and **omit** `max_distance` from the update object so Drizzle/JSON merge does not overwrite the key. Do not reintroduce a “always null out” policy.
   - **Rationale:** Step plan + parent guide: remnant data may still show in admin; no purge in this step.
   - **Alternatives:** Clear to null on every location save (rejected — loses admin intel and contradicts “leave untouched”). Require optional pass-through of posted value (rejected — no UI to collect it).

2. **Remove `validateMaxDistance` from the save path; delete or keep constants as unused**
   - **Choice:** Stop calling `validateMaxDistance` from onboarding location / preference validation. Remove `parseMaxDistanceField` and `invalid_max_distance` error mapping from web routes. Prefer deleting dead helpers/tests that only exist for the required field; `MAX_DISTANCE_MIN` / `MAX_DISTANCE_MAX` MAY remain exported if still referenced by admin copy elsewhere, otherwise remove with the field.
   - **Rationale:** Fail-closed validation of a field that is no longer collected is dead code.
   - **Alternatives:** Keep validator for hypothetical admin edit (rejected — admin is read-only intel for this field).

3. **UI: strip control + copy from onboarding and Vibes**
   - **Choice:** Remove the number input and `radiusLabel` / `km` / `invalidMaxDistance` strings from `LocationStepForm`, `PreferencesForm`, and `onboarding-content` / profile content. Keep Germany/Berlin chrome + zip.
   - **Rationale:** Product outcome of this step.
   - **Alternatives:** Hide with CSS (rejected — still in DOM/a11y tree).

4. **Admin: keep conditional display; reframe docs as legacy**
   - **Choice:** No behavior change required in `AdminUserDetailPage` beyond comment/copy if needed. Update Gherkin/coverage/OpenSpec so non-null display is “legacy remnant,” not “actively collected.”
   - **Rationale:** Parent guide explicitly allows showing legacy km.
   - **Alternatives:** Hide admin row always (rejected — useful intel for existing members).

5. **Canonical product docs update in the same change**
   - **Choice:** Update `docs/product/` feature files, schema overview, gaps, i18n inventory, coverage matrix, and `DEPLOYMENT.md` together with code (not a deferred follow-up).
   - **Rationale:** Step plan deliverables; AGENTS SoT is `docs/product/`.
   - **Alternatives:** Code-only then docs later (rejected — creates SoT drift).

6. **E2E helpers drop distance fills**
   - **Choice:** `completeLocationStep` and Vibes e2e fill zip only; assert absence of travel-distance control (proximity/layout selectors). Admin e2e may still assert km when fixture has non-null `max_distance`.
   - **Rationale:** Behavioral SoT follows Gherkin; proximity-only selectors per testing contract.

## Risks / Trade-offs

- **[Risk] Accidental clear of existing `max_distance` via spread/`null` write** → Mitigation: omit the key from location update payloads; add/adjust unit tests that a pre-existing `max_distance` survives a zip-only save.
- **[Risk] Stale OpenSpec main specs vs `docs/product/` until archive sync** → Mitigation: ship delta specs here; update `docs/product/` in apply; sync/archive per project workflow after merge.
- **[Risk] Demo scripts / DEPLOYMENT still mention travel distance** → Mitigation: update demo script and client demo line in the same PR.
- **[Trade-off] Leaving orphan JSONB values** → Acceptable until a later cleanup; admin can still read them.

## Migration Plan

1. Domain: drop required `maxDistance` from location validation/writes; adjust unit tests (including “pre-existing max_distance survives”).
2. Web: remove UI, parsers, copy, error mapping; update stories/fixtures/content tests.
3. Docs + Playwright + coverage + DEPLOYMENT.
4. Verify lint, typecheck, auth unit tests, touched e2e.
5. Mark step done in `ux-polish-parent-guide.md`.
6. Rollback: revert the PR; prior required-field behavior returns.

## Open Questions

- None blocking. Whether to delete `MAX_DISTANCE_*` constants entirely vs leave unused exports can be decided during apply based on remaining references (admin display does not need bounds).
