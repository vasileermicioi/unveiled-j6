## Context

Phase 5.5 step 03 (workstream B), after steps 01–02 shipped Theme Overview, shared `brand-theme.css`, Logo ownership, and named UI typography deferrals. Product SoT:

- `docs/product/testing/bdd-and-e2e.md` — proximity selectors only; file-input exception with `// BDD exception: file-input`; no standing `input[name=…]` exception (gap **G7**); `@skip-no-ui` gate for MVP vs post-MVP
- `docs/product/features/admin-events.feature` — **Supply the event image as a remote URL** is MVP-required
- `docs/product/extras/image-uploads.md` — upload XOR remote URL → same six JPEG variants

**Current inventory (pre-step):**

| Area | State |
|---|---|
| `e2e/specs/admin-events.spec.ts` | ~20 `page.locator` — mostly `input[name=event_date\|event_time\|slot_*\|builder_*\|image]`; one `img[src*=".jpg"]`; remote-URL scenario `@skip-no-ui` |
| `e2e/fixtures/admin.ts` | `event_date` / `event_time` / `image` / partner `logo` via `page.locator` |
| `e2e/fixtures/onboarding.ts` | `page.locator("label").filter({ hasText })` — proximity-ish; review only |
| `admin-partners.spec.ts` | Portal + QR `@skip-no-ui` — **leave alone** (post-MVP) |
| `EventAdminDateFields.tsx` | HeroUI `Label` sibling of `Input` — **not** wired for accessible name (`htmlFor`/`id` or Label wrapping) |
| `EventImageUpload.tsx` | File input only; no URL field; no accessible name on file input |
| Domain | `attachImageToEvent` / `parse` path already supports exclusive upload vs URL; `parseEventFormBody` currently sets `imageUpload` only (no `imageUrl` from body) |

Canonical product behavior stays in `docs/product/`; this OpenSpec delta is planning-only for apply.

## Goals / Non-Goals

**Goals:**

- Make admin date/time (and series slot/builder date-time) fields label-addressable for Playwright
- Replace G7 `input[name=…]` locators in admin-events + admin fixtures with `getByLabel` / roles / proximity
- Annotate unavoidable file inputs with `// BDD exception: file-input`
- Ship remote-URL event image UI wired to existing catalog image path and clear `@skip-no-ui` on that scenario (preferred); named deferral only if blocked
- Leave post-MVP partner portal/QR skips untouched
- Publish named deferrals for any remaining locator debt

**Non-Goals:**

- Discover CTA / public-detail Scenario tests or coverage matrix (step 04)
- Sitemap spot-check / staging release (step 05)
- Expanding the BDD exception list (charter amendment required)
- Partner logo remote-URL UI as a separate product feature (only share a field if it falls out of the same component work)
- Phase 6–8 booking/billing/waitlist e2e
- Deleting post-MVP skip stubs

## Decisions

### 1. Prefer implementing remote-URL UI over deferral

- **Choice:** Add an accessible text field (e.g. `image_url`) on admin event create/edit image section; parse it in `parseEventFormBody`; pass `imageUrl` into existing create/update catalog calls that already call `attachImageToEvent` / `validateImageSourceExclusive`. Clear `@skip-no-ui` and write a real Playwright scenario that pastes a stable public image URL (reuse seed Wikimedia URLs or a fixture URL that R2 processing can fetch in CI).
- **Rationale:** Domain + `@unveiled/images.processImageFromUrl` already exist; the skip message admits “upload-only UI”; MVP Gherkin requires the path; implementing is smaller than carrying a Phase 5.5 deferral into the coverage matrix.
- **Alternatives considered:**
  - Named deferral to Phase 8 — allowed by the step plan but weakens the `@skip-no-ui` gate and leaves Known coverage gaps stale.
  - CLI-only / seed-only path — already exists; does not satisfy admin UI Gherkin.
- **Fallback:** If network/R2 flakiness blocks a reliable e2e in this step, keep the UI shipped and either env-skip with an explicit comment (not `@skip-no-ui`) or record a named deferral for the **test** only (scenario + reason + target phase) while removing silent `@skip-no-ui` folklore.

### 2. Associate labels with native date/time inputs (fix a11y first)

- **Choice:** Fix `EventAdminDatePicker` / `EventAdminTimeField` (and series slot/builder fields that reuse them or duplicate the pattern) so each control has an accessible name Playwright can resolve via `getByLabel`. Prefer HeroUI `Label` properly associated with `Input` (`htmlFor`/`id` matching the `name`, or Label wrapping the control per HeroUI v3 patterns). Keep existing `name` attributes for SSR form POST.
- **Rationale:** BDD hard rule: if a scenario cannot use proximity selectors, fix UI a11y — do not add `data-testid`.
- **Alternatives:** Keep `input[name=…]` with a new standing exception — rejected (charter / `bdd-and-e2e.md` §4).

### 3. Locator migration map for admin-events + fixtures

- **Choice:** Replace systematically:

  | Current | Target |
  |---|---|
  | `input[name="event_date"]` / `event_time` | `getByLabel` using admin copy labels |
  | `slot_date_*` / `slot_time_*` / `builder_*` | `getByLabel` with the visible field labels (or label + `nth` within the series section) |
  | `input[name="image"]` / partner `logo` | Keep `page.locator` + `setInputFiles` **with** `// BDD exception: file-input` |
  | `img[src*=".jpg"]` hero assert | Prefer role/alt/proximity under main content (e.g. `getByRole('main').locator('img').filter({ has: … })` or assert via visible variant URL text/attribute on an image inside the event detail region) — no CSS-class or id selectors |

- Shared helpers in `e2e/fixtures/admin.ts` should expose label-based fill helpers so specs stay DRY.
- **Rationale:** Matches inventory in `bdd-and-e2e.md` and step verification `rg` gate.
- **Onboarding fixture:** `page.locator("label").filter({ hasText })` is proximity-adjacent; only change if a clearer `getByLabel` / role path is trivial — do not expand onboarding scope.

### 4. Image field UX: upload XOR URL, HeroUI-only

- **Choice:** On `EventImageUpload`, show file input **and** a labeled URL text field. Enforce exclusive source in existing server validation (`validateImageSourceExclusive`) — do not add radios/checkboxes (AGENTS.md hard rule). Optional: short hint copy that one of upload or URL is required. Make file input `required` only when URL is empty is hard with pure HTML; prefer server-side rejection (already required) and adjust client `required` so create works with URL-only (e.g. drop HTML `required` on file when URL field is present and rely on server, or use a single SSR validation error path).
- **Rationale:** Matches product extras; avoids Select-for-mode complexity unless needed.
- **Alternatives:** HeroUI Select “Upload vs URL” mode switch — more UI, still valid; use only if exclusive empty-both UX is too confusing without it.

### 5. Named deferral format (remaining G7 only)

- **Choice:** Any locator that cannot be fixed in this PR goes into parent guide **Risks** (and optionally `gaps-and-decisions.md`) as: **file path + locator purpose + reason + target phase**. Same shape for a remote-URL **test** deferral if UI ships but e2e cannot run reliably.
- **Rationale:** Step outcome forbids silent `@skip-no-ui` / silent locator debt.
- **Do not** expand §4 exception list without charter amendment.

### 6. Post-MVP skips stay

- **Choice:** Do not touch `admin-partners.spec.ts` portal-access / venue QR `@skip-no-ui` tests beyond confirming they remain skipped.
- **Rationale:** Parent non-goal; product Gherkin lives under `features/post-mvp/`.

### 7. Verification bar

- **Choice:** `bun run lint`, `bun run typecheck`, `bun run test:e2e -- e2e/specs/admin-events.spec.ts` (or project-equivalent filter); `rg -n "page\\.locator\\(" e2e/specs/admin-events.spec.ts e2e/fixtures/admin.ts` — remaining hits are file-input exceptions or listed deferrals.
- **Rationale:** Matches step plan Deliverables & Verification.

## Risks / Trade-offs

- **[Risk] HeroUI Label/`Input` association differs from native `htmlFor`** → Mitigate by verifying with Playwright `getByLabel` against a local admin form before bulk-replacing locators; follow `.agents/skills/heroui-react` / existing labeled textboxes in the same forms.
- **[Risk] Remote URL e2e flakes on network/R2** → Mitigate with known-good Wikimedia/seed URL, generous timeout, and env-skip if R2 unset (same pattern as direct-upload scenario); never reintroduce bare `@skip-no-ui` without a named deferral record.
- **[Risk] Series builder fields have duplicate labels** → Mitigate with section-scoped `getByRole('group'|…)` / `filter` / `nth`; document in fixture helpers.
- **[Risk] Removing `required` on file input weakens client-side empty submit** → Server already rejects missing image; keep “Event image is required” scenario asserting stay-on-form / validation.
- **[Trade-off] Partner logo remote URL not in scope** → Event path unblocks MVP Gherkin; partner logo can follow later if needed.

## Migration Plan

1. Inventory current `page.locator` / `@skip-no-ui` (confirm counts vs table above).
2. Fix date/time (and series) accessible names in admin components.
3. Add remote URL field + form parse + pass-through to catalog create/update.
4. Migrate admin-events specs + admin fixtures to proximity selectors; annotate file inputs.
5. Implement and unskip remote-URL scenario (or named deferral).
6. Run verification commands; update parent guide + Known coverage gaps if status text changed.
7. Rollback: revert UI/form/e2e commits; domain image helpers unchanged.

## Open Questions

- None blocking apply. If HeroUI v3 makes Label association awkward for native `type="date"|"time"|"file"`, implementer may use an explicitly associated native-accessible pattern still built from HeroUI primitives (no raw `<label>`/`<input>` in routes — use HeroUI `Label`/`Input`).
