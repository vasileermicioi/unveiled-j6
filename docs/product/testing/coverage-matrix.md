# BDD coverage matrix (MVP)

Single inventory of product Gherkin Scenarios → Playwright tests for Phase 5.5+.

**Status vocabulary:**

| Status | Meaning |
|---|---|
| `pass` | Titled Playwright test exists and is expected to run (env skips like missing R2 are OK) |
| `skip` | `@skip-no-ui` or hard `test.skip(true, …)` — usually post-MVP |
| `deferred` | MVP-required; named deferral with target phase in Notes |
| `unshipped` | Feature not implemented yet; e2e ships with Phases 6–8 |

**Rules:** [`bdd-and-e2e.md`](./bdd-and-e2e.md) · **Harness:** [`e2e/README.md`](../../../e2e/README.md)

## MVP features

| Feature file | Scenario title | Playwright | Status | Notes |
|---|---|---|---|---|
| `admin-events.feature` | Create a single event | `e2e/specs/admin-events.spec.ts` · `Scenario: Create a single event` | `pass` | Fills Berlin PLZ `10115`; asserts zip on public detail; fills DE+EN title/description |
| `admin-events.feature` | Create event with DE and EN titles | `e2e/specs/admin-events.spec.ts` · `Scenario: Create event with DE and EN titles` | `pass` | R2 / `E2E_ADMIN_*` env-skip; distinct DE/EN titles; `/de` and `/en` public headings |
| `admin-events.feature` | Create rejects empty English title | — | `pass` | Gherkin-only; `packages/db` `event-copy.unit.test.ts` `REQUIRED_FIELD` (no Playwright — wizard + R2) |
| `admin-events.feature` | Add and remove datetimes on create | `e2e/specs/admin-events.spec.ts` · `Scenario: Add and remove datetimes on create` | `pass` | R2 env-skip; per-row credits via `getByLabel`; unskipped (multi-datetime UI shipped) |
| `admin-events.feature` | Per-datetime credits persist | `e2e/specs/admin-events.spec.ts` · `Scenario: Per-datetime credits persist` | `pass` | R2 env-skip; edit form shows 1 then 3 |
| `admin-events.feature` | Total credits shown on the form | `e2e/specs/admin-events.spec.ts` · `Scenario: Total credits shown on the form` | `pass` | R2 env-skip (partner create); live island total |
| `admin-events.feature` | Timing mode is first on Date & tickets | `e2e/specs/admin-events.spec.ts` · `Scenario: Timing mode is first on Date & tickets` | `pass` | R2 env-skip (partner logo); layout `boundingBox` order |
| `admin-events.feature` | All day hides time inputs | `e2e/specs/admin-events.spec.ts` · `Scenario: All day hides time inputs` | `pass` | R2 env-skip (partner logo) |
| `admin-events.feature` | Time slot shows times | `e2e/specs/admin-events.spec.ts` · `Scenario: Time slot shows times` | `pass` | R2 env-skip (partner logo) |
| `admin-events.feature` | Shared capacity is one pool | `e2e/specs/admin-events.spec.ts` · `Scenario: Shared capacity is one pool` | `pass` | R2 env-skip; two datetimes; no per-row capacity |
| `admin-events.feature` | Per-date capacities persist | `e2e/specs/admin-events.spec.ts` · `Scenario: Per-date capacities persist` | `pass` | R2 env-skip; rows 4 and 6; total 10 |
| `admin-events.feature` | Range rebuild stamps default capacity | `e2e/specs/admin-events.spec.ts` · `Scenario: Range rebuild stamps default capacity` | `pass` | R2 env-skip; Per date capacity 8 |
| `admin-events.feature` | Capacity and inventory totals mismatch | `e2e/specs/admin-events.spec.ts` · `Scenario: Capacity and inventory totals mismatch` | `pass` | R2 env-skip; 10 vs 7 promo codes; reject copy not CSS color |
| `admin-events.feature` | Edit datetimes inplace | `e2e/specs/admin-events.spec.ts` · `Scenario: Add and remove datetimes on create` (edit + remove) | `pass` | Covered by add/remove edit path |
| `admin-events.feature` | Range and two time slots generate a grid | `e2e/specs/admin-events.spec.ts` · `Scenario: Range and two time slots generate a grid` | `pass` | R2 env-skip; 2 days × 2 slots |
| `admin-events.feature` | Changing the end date rebuilds from scratch | `e2e/specs/admin-events.spec.ts` · `Scenario: Changing the end date rebuilds from scratch` | `pass` | R2 env-skip; also covered by `admin-event-form.test.ts` |
| `admin-events.feature` | Create prefills slots from partner open times | `e2e/specs/admin-events.spec.ts` · `Scenario: Create prefills slots from partner open times` | `pass` | R2 env-skip; DB hours then select partner |
| `admin-events.feature` | Range includes closed partner weekdays | `e2e/specs/admin-events.spec.ts` · `Scenario: Range includes closed partner weekdays` | `pass` | R2 env-skip; Sat–Mon includes Sunday |
| `admin-events.feature` | Admin event list shows next upcoming datetime | `e2e/specs/admin-events.spec.ts` · `Scenario: Add and remove datetimes on create` (`+N` on list) | `pass` | List `+1` asserted in add/remove |
| `admin-events.feature` | Admin sets Berlin zip on create | `e2e/specs/admin-events.spec.ts` · `Scenario: Admin sets Berlin zip on create` | `pass` | R2 env-skip; asserts saved zip on public detail |
| `admin-events.feature` | Country and city are fixed on the form | `e2e/specs/admin-events.spec.ts` · `Scenario: Country and city are fixed on the form` | `pass` | Germany/Berlin readonly; zip editable; no neighborhood |
| `admin-events.feature` | Supply the event image as a direct upload | `e2e/specs/admin-events.spec.ts` · `Scenario: Supply the event image as a direct upload` | `pass` | R2 env-skip; asserts `.webp` hero/srcset |
| `admin-events.feature` | Event image is required | `e2e/specs/admin-events.spec.ts` · `Scenario: Event image is required` | `pass` | R2 env-skip (create partner needs logo); client required-image block |
| `admin-events.feature` | Create walks three steps | `e2e/specs/admin-events.spec.ts` · `Scenario: Create walks three steps` | `pass` | R2 env-skip (partner logo); Next through `/new` → `/new/dates` → `/new/image` |
| `admin-events.feature` | Create submit is on the image step | `e2e/specs/admin-events.spec.ts` · `Scenario: Create submit is on the image step` | `pass` | R2 env-skip; Anlegen/Create only on `/new/image`; POST includes earlier steps |
| `admin-events.feature` | Edit can jump to image | `e2e/specs/admin-events.spec.ts` · `Scenario: Edit can jump to image` | `pass` | R2 env-skip (create source); GET `/edit/image` without posting |
| `admin-events.feature` | Refresh keeps unsaved event edits | `e2e/specs/admin-events.spec.ts` · `Scenario: Refresh keeps unsaved event edits` | `pass` | `E2E_ADMIN_*`; create `/new` title; Discard from `/new/dates` returns to step 1; no R2 |
| `admin-events.feature` | Edit steps keep unsaved edits | `e2e/specs/admin-events.spec.ts` · `Scenario: Edit steps keep unsaved edits` | `pass` | `E2E_ADMIN_*`; GET `/new/dates` no redirect; Back skips date validation; no R2 |
| `admin-events.feature` | Successful event save clears draft | `e2e/specs/admin-events.spec.ts` · `Scenario: Successful event save clears draft` | `pass` | R2 env-skip; leftover draft vs saved title; no restore banner on reopen |
| `admin-events.feature` | Missing image returns to step 3 | `e2e/specs/admin-events.spec.ts` · `Scenario: Missing image returns to step 3` | `pass` | R2 env-skip (partner logo); error stays on image step |
| `admin-events.feature` | Redemption configuration validation on create | `e2e/specs/admin-events.spec.ts` (create flows) | `pass` | Covered alongside event create |
| `admin-events.feature` | Shared generated code is created automatically | `e2e/specs/admin-events.spec.ts` · `Scenario: Shared generated code is created automatically` | `pass` |  |
| `admin-events.feature` | Default values on creation | `e2e/specs/admin-events.spec.ts` · `Scenario: Default values on creation` | `pass` | List 10/10; step 2 Time slot + Shared + capacity 10 |
| `admin-events.feature` | Admin uploads promo codes with preview | `e2e/specs/admin-events.spec.ts` · `Scenario: Admin uploads promo codes with preview` | `pass` | R2 env-skip; paste 10 codes matching capacity 10 |
| `admin-events.feature` | Admin uploads a master PDF and previews tickets | — | `skip` | Dedicated PDF e2e deferred (private bucket); capacity=inventory covered by promo preview + mismatch |
| `admin-events.feature` | Admin uploads multiple PDF files as tickets | — | `skip` | Dedicated PDF e2e deferred (private bucket); capacity=inventory covered by promo preview + mismatch |
| `admin-events.feature` | Clone event from catalog list | `e2e/specs/admin-events.spec.ts` · `Scenario: Clone event from catalog list` | `pass` | R2 env-skip (create source needs image); SECRET_CODE happy path |
| `admin-events.feature` | Clone voucher event requires inventory | `e2e/specs/admin-events.spec.ts` · `Scenario: Clone voucher event requires inventory` | `pass` | R2 env-skip; creates VOUCHER_PROMO source then clones without inventory |
| `admin-events.feature` | Clone entry points visible | `e2e/specs/admin-events.spec.ts` · `Scenario: Clone entry points visible` | `pass` | R2 env-skip; asserts Clone/Klonen on list + edit; no series CTA |
| `admin-events.feature` | Clone is not a wizard | `e2e/specs/admin-events.spec.ts` · `Scenario: Clone is not a wizard` | `pass` | R2 env-skip (create source); no three-step progress chrome; datetimes visible without Next |
| `admin-events.feature` | Event list can be sorted | `e2e/specs/admin-events.spec.ts` · `Scenario Outline: Event list can be sorted` | `pass` | Column-header sort; URL `sort`/`dir`; default last-created omitted |
| `admin-events.feature` | Event list filters by title, partner, and language | `e2e/specs/admin-events.spec.ts` · `Scenario: Event list filters by title, partner, and language` | `pass` | Title/partner/language filters; Languages + Subtitles columns |
| `admin-events.feature` | Event list reset filters clears search and sort | `e2e/specs/admin-events.spec.ts` · `Scenario: Event list reset filters clears search and sort` | `pass` | Clears title/partner/language + sort params |
| `admin-events.feature` | Update an event's capacity | `e2e/specs/admin-events.spec.ts` · `Scenario: Update an event's capacity` | `pass` |  |
| `admin-events.feature` | Edit event details | `e2e/specs/admin-events.spec.ts` · `Scenario: Edit event details` | `pass` |  |
| `admin-events.feature` | Delete an event | `e2e/specs/admin-events.spec.ts` · `Scenario: Delete an event` | `pass` |  |
| `admin-events.feature` | Optional audience metadata without barrier-free | `e2e/specs/admin-events.spec.ts` · `Scenario: Optional audience metadata without barrier-free` | `pass` | Languages/subtitles remain; no barrier-free control; no age groups |
| `admin-events.feature` | Check Subtitles reveals language multi-select | `e2e/specs/admin-events.spec.ts` · `Scenario: Check Subtitles reveals language multi-select` | `pass` | R2 env-skip (partner logo); native checkbox + searchable CheckboxMultiSelect |
| `admin-events.feature` | Save event with Subtitles and multiple languages | `e2e/specs/admin-events.spec.ts` · `Scenario: Save event with Subtitles and multiple languages` | `pass` | R2 env-skip; asserts public DETAILS Subtitles + DE and EN |
| `admin-events.feature` | Subtitles controls available when language-independent | `e2e/specs/admin-events.spec.ts` · `Scenario: Subtitles controls available when language-independent` | `pass` | R2 env-skip (partner logo) |
| `admin-events.feature` | Languages multi-select with search | `e2e/specs/admin-events.spec.ts` · `Scenario: Languages multi-select with search` | `pass` | R2 env-skip (partner logo); CheckboxMultiSelect + search |
| `admin-events.feature` | Add event prefills structured location and map from partner | `e2e/specs/admin-events.spec.ts` · `Scenario: Add event prefills structured location and map from partner` | `pass` | Street/house/zip prefill required; live Nominatim map-pin not required in CI |
| `admin-events.feature` | Edit event keeps existing location when partner changes | `e2e/specs/admin-events.spec.ts` · `Scenario: Edit event keeps existing location when partner changes` | `pass` | R2 env-skip; asserts structured fields unchanged on partner change |
| `admin-events.feature` | Geocode soft-fails leave structured location filled | `e2e/specs/admin-events.spec.ts` · `Scenario: Geocode soft-fails leave structured location filled` | `pass` | Structured prefill asserted; soft-fail paths unit-tested in `geocode-berlin.test.ts` (live Nominatim not forced) |
| `admin-events.feature` | No admin lat lng or zoom controls | `e2e/specs/admin-events.spec.ts` · (covered by form field assertions in location scenarios) | `pass` | No free-text address field; structured native inputs only |
| `admin-events.feature` | Export redemption codes for an event | `e2e/specs/admin-events.spec.ts` · `Scenario: Export redemption codes for an event` | `pass` |  |
| `admin-events.feature` | Seed demo data (empty environment only) | `e2e/specs/admin-events.spec.ts` · `Scenario: Seed demo data (empty environment only)` | `skip` | hard-skipped in e2e |
| `admin-events.feature` | Seed demo data is a no-op when data exists | `e2e/specs/admin-events.spec.ts` · `Scenario: Seed demo data is a no-op when data exists` | `pass` |  |
| `admin-events.feature` | Admin multi-upload gallery photos | `e2e/specs/admin-events.spec.ts` · `Scenario: Admin multi-upload gallery photos` | `pass` | R2 env-skip when vars missing |
| `admin-events.feature` | Admin removes selected gallery photos | `e2e/specs/admin-events.spec.ts` · `Scenario: Admin removes selected gallery photos` | `pass` | R2 env-skip when vars missing |
| `admin-events.feature` | Admin reorders gallery photos by drag and drop | `e2e/specs/admin-events.spec.ts` · `Scenario: Admin reorders gallery photos by drag and drop` | `pass` | R2 env-skip; HTML5 DnD via Playwright |
| `admin-events.feature` | Gallery manage is available from the Events catalog | `e2e/specs/admin-events.spec.ts` · `Scenario: Gallery manage is available from the Events catalog` | `pass` | R2 env-skip when vars missing; non-featured catalog event OK; Featured list is not a gallery entry point |
| `admin-events.feature` | Event primary credit on create | `e2e/specs/admin-events.spec.ts` · `Scenario: Event primary credit on create` | `pass` | Needs `E2E_ADMIN_*` + R2; create with `imageCredit`; public hero caption |
| `admin-events.feature` | Keep existing image and edit credit | `e2e/specs/admin-events.spec.ts` · `Scenario: Keep existing image and edit credit` | `pass` | Needs `E2E_ADMIN_*` + R2; keep file, change credit, public caption updates |
| `admin-events.feature` | Gallery photo credit on add | `e2e/specs/admin-events.spec.ts` · `Scenario: Gallery photo credit on add` | `pass` | Needs `E2E_ADMIN_*` + R2; one file `image_credit_0`; manage list shows credit |
| `admin-partners.feature` | Create a partner | `e2e/specs/admin-partners.spec.ts` · `Scenario: Create a partner` | `pass` | R2 env-skip; structured street/house/zip + logo required (five WebP) |
| `admin-partners.feature` | Supply the partner logo as a direct upload | `e2e/specs/admin-partners.spec.ts` · `Scenario: Supply the partner logo as a direct upload` | `pass` | R2 env-skip when vars missing; asserts `small-320.webp` |
| `admin-partners.feature` | Partner logo is required | `e2e/specs/admin-partners.spec.ts` · `Scenario: Partner logo is required` | `pass` | Client block; no R2 required |
| `admin-partners.feature` | Partner creation validation | `e2e/specs/admin-partners.spec.ts` (validation paths in create flows) | `pass` | Street/house/zip validation; email path attaches logo + R2 skip |
| `admin-partners.feature` | Edit a partner | `e2e/specs/admin-partners.spec.ts` · `Scenario: Edit a partner` | `pass` | R2 env-skip; updates structured location; list shows composed address |
| `admin-partners.feature` | Set barrier-free on create | `e2e/specs/admin-partners.spec.ts` · `Scenario: Set barrier-free on create` | `pass` | Needs `E2E_ADMIN_*` + R2; native Yes/No select; persist true |
| `admin-partners.feature` | Clear barrier-free on edit | `e2e/specs/admin-partners.spec.ts` · `Scenario: Clear barrier-free on edit` | `pass` | Needs `E2E_ADMIN_*` + R2; set No stores null |
| `admin-partners.feature` | Set bank details on create | `e2e/specs/admin-partners.spec.ts` · `Scenario: Set bank details on create` | `pass` | Needs `E2E_ADMIN_*` + R2; native textarea; persist and reopen edit |
| `admin-partners.feature` | Clear bank details on edit | `e2e/specs/admin-partners.spec.ts` · `Scenario: Clear bank details on edit` | `pass` | Needs `E2E_ADMIN_*` + R2; clear textarea stores null |
| `admin-partners.feature` | Partner logo credit without replacing the file | `e2e/specs/admin-partners.spec.ts` · `Scenario: Partner logo credit without replacing the file` | `pass` | Needs `E2E_ADMIN_*` + R2; keep logo, set credit, reopen edit |
| `admin-partners.feature` | Enable weekly opening hours on create or edit | `e2e/specs/admin-partners.spec.ts` · `Scenario: Enable weekly opening hours on create or edit` | `pass` | Needs `E2E_ADMIN_*` + R2; edit toggle + Mon–Sun; asserts public detail hours |
| `admin-partners.feature` | Incomplete or invalid opening hours are rejected | `e2e/specs/admin-partners.spec.ts` · `Scenario: Incomplete or invalid opening hours are rejected` | `pass` | Needs `E2E_ADMIN_*` + R2; inverted range / incomplete day |
| `admin-partners.feature` | Disable opening hours | `e2e/specs/admin-partners.spec.ts` · `Scenario: Disable opening hours` | `pass` | Needs `E2E_ADMIN_*` + R2; uncheck toggle; public detail omits hours |
| `admin-partners.feature` | Renaming a partner propagates to its events | `e2e/specs/admin-partners.spec.ts` · `Scenario: Renaming a partner propagates to its events` | `pass` | R2 env-skip when vars missing |
| `admin-partners.feature` | Delete a partner | `e2e/specs/admin-partners.spec.ts` · `Scenario: Delete a partner` | `pass` | R2 env-skip; venue CRUD (MVP); portal/QR scenarios below stay post-MVP |
| `admin-partners.feature` | List featured partners | `e2e/specs/admin-partners.spec.ts` · `Scenario: List featured partners` | `pass` | Needs `E2E_ADMIN_*` + R2; grid + Save order / Remove partners chrome |
| `admin-partners.feature` | Add by searching existing partners | `e2e/specs/admin-partners.spec.ts` · `Scenario: Add by searching existing partners` | `pass` | Needs `E2E_ADMIN_*` + R2 |
| `admin-partners.feature` | Admin reorders featured partners by drag and drop | `e2e/specs/admin-partners.spec.ts` · `Scenario: Admin reorders featured partners by drag and drop` | `pass` | Needs `E2E_ADMIN_*` + R2; HTML5 DnD via Playwright |
| `admin-partners.feature` | Admin remove from featured partners keeps venue | `e2e/specs/admin-partners.spec.ts` · `Scenario: Admin remove from featured partners keeps venue` | `pass` | Needs `E2E_ADMIN_*` + R2; checkbox + bulk remove confirm |
| `admin-partners.feature` | Empty featured partners list | — | `skip` | Deferred — owner: featured-partners step 03; shared-DB empty state brittle; covered by admin empty-state copy + manual smoke |
| `admin-partners.feature` | Partner list search is labeled Name | `e2e/specs/admin-partners.spec.ts` · `Scenario: Partner list search is labeled Name` | `pass` | Needs `E2E_ADMIN_*` + Playwright chromium matching package; asserts Name label/placeholder; events-list placeholder absent |
| `admin-partners.feature` | Partner list can be sorted | `e2e/specs/admin-partners.spec.ts` · `Scenario Outline: Partner list can be sorted` | `pass` | Needs `E2E_ADMIN_*` + Playwright chromium; column-header sort (Name/Created/Active events); default created+desc omits URL params; search preserved via hidden params |
| `admin-partners.feature` | Partner list reset filters clears search and sort | `e2e/specs/admin-partners.spec.ts` · `Scenario: Partner list reset filters clears search and sort` | `pass` | Needs `E2E_ADMIN_*` + Playwright chromium |
| `admin-partners.feature` | Partner list shows Active events column | `e2e/specs/admin-partners.spec.ts` · `Scenario: Partner list shows Active events column` | `pass` | Needs `E2E_ADMIN_*` + Playwright chromium; column header; count cell when rows exist |
| `admin-partners.feature` | Partner list Export opens sales export | `e2e/specs/admin-partners.spec.ts` · `Scenario: Partner list Export opens sales export` | `pass` | Needs `E2E_ADMIN_*` + Playwright chromium |
| `admin-partners.feature` | View tickets sold for a period | `e2e/specs/admin-partners.spec.ts` · `Scenario: View tickets sold for a period` | `pass` | Needs `E2E_ADMIN_*` + Playwright chromium; table headers or empty-events copy; seed bookings optional (zeros OK) |
| `admin-partners.feature` | Filter sales export by event title and partner name | `e2e/specs/admin-partners.spec.ts` · `Scenario: Filter sales export by event title and partner name` | `pass` | Asserts title/partner fields + filtered CSV URL params |
| `admin-partners.feature` | Download sales CSV | `e2e/specs/admin-partners.spec.ts` · `Scenario: Download sales CSV` | `pass` | Needs `E2E_ADMIN_*` + Playwright chromium; asserts text/csv + Content-Disposition + tickets_sold header |
| `admin-partners.feature` | Sales export is admin-only | `e2e/specs/admin-partners.spec.ts` · `Scenario: Sales export is admin-only` | `pass` | Needs Playwright chromium; guest cookies cleared → login?returnTo= (no ADMIN creds required after clear); USER→home covered by auth route-protection |
| `admin-events.feature` | List featured events | `e2e/specs/admin-events.spec.ts` · `Scenario: List featured events` | `pass` | Needs `E2E_ADMIN_*`; asserts **Featured events** / **Featured partners** tab labels; Save order / Remove selected asserted in reorder/remove when the list is non-empty |
| `admin-events.feature` | Add by searching existing events | `e2e/specs/admin-events.spec.ts` · `Scenario: Admin remove from featured keeps catalog event` | `pass` | Covered inline in remove flow (add search + add-results thumb proximity + add POST); needs `E2E_ADMIN_*` + R2 (env-skip when missing) |
| `admin-events.feature` | Admin reorders featured events by drag and drop | `e2e/specs/admin-events.spec.ts` · `Scenario: Admin reorders featured events by drag and drop` | `pass` | Needs `E2E_ADMIN_*` + R2; Surface-row mouse-drag + Save order; relative order after reload |
| `admin-events.feature` | Admin remove from featured keeps catalog event | `e2e/specs/admin-events.spec.ts` · `Scenario: Admin remove from featured keeps catalog event` | `pass` | Needs `E2E_ADMIN_*` + R2; checkbox + bulk confirm `/admin/featured/remove`; list-row thumb (`small-320.webp`) proximity; not `role=row` |
| `admin-users.feature` | List all members | `e2e/specs/admin-users.spec.ts` · `Scenario: List all members` | `pass` | Needs `DATABASE_URL` + `E2E_ADMIN_*` |
| `admin-users.feature` | Search members | `e2e/specs/admin-users.spec.ts` · `Scenario: Search members` | `pass` |  |
| `admin-users.feature` | View a member's collapsed summary | `e2e/specs/admin-users.spec.ts` · `Scenario: View a member's collapsed summary` | `pass` | List row columns (role, subscription, credits, …) |
| `admin-users.feature` | Expand a member's detail / "intel" panel | `e2e/specs/admin-users.spec.ts` · `Scenario: Expand a member's detail / "intel" panel` | `pass` | Maps to `/admin/users/:id`; asserts zip location; legacy travel distance only when non-null (not districts) |
| `admin-users.feature` | Adjust a member's credits from their detail panel | `e2e/specs/admin-users.spec.ts` · `Scenario: Adjust a member's credits from their detail panel` | `pass` | SSR adjust-credits page |
| `admin-users.feature` | Freeze or unfreeze a member from their detail panel | `e2e/specs/admin-users.spec.ts` · `Scenario: Freeze or unfreeze a member from their detail panel` | `pass` | SSR freeze page |
| `admin-users.feature` | Issue a complimentary ticket to a member | `e2e/specs/admin-users.spec.ts` · `Scenario: Issue a complimentary ticket to a member` | `pass` | SSR comp-ticket page |
| `auth.feature` | Sign up as a new member | `e2e/specs/auth.spec.ts` · `Scenario: Sign up as a new member` | `pass` |  |
| `auth.feature` | Signup validation | `e2e/specs/auth.spec.ts` · `Scenario Outline: Signup validation — …` | `pass` | Outline examples covered as separate titled tests |
| `auth.feature` | Log in with valid credentials | `e2e/specs/auth.spec.ts` · `Scenario: Log in with valid credentials` | `pass` |  |
| `auth.feature` | Post-login routing by role and state | `e2e/specs/auth.spec.ts` · covered via login + role protection scenarios | `pass` | Behavior asserted across auth scenarios |
| `auth.feature` | Log in with invalid credentials | `e2e/specs/auth.spec.ts` · `Scenario: Log in with invalid credentials` | `pass` |  |
| `auth.feature` | Log in without a password | `e2e/specs/auth.spec.ts` · `Scenario: Log in without a password` | `pass` |  |
| `auth.feature` | Request a password reset | `e2e/specs/auth.spec.ts` · `Scenario: Request a password reset` | `pass` |  |
| `auth.feature` | Request a password reset with no email | `e2e/specs/auth.spec.ts` · `Scenario: Request a password reset with no email` | `pass` |  |
| `auth.feature` | Log out | `e2e/specs/auth.spec.ts` · `Scenario: Log out` | `pass` |  |
| `auth.feature` | Route protection for authenticated-only areas | `e2e/specs/auth.spec.ts` · `Scenario: Route protection for authenticated-only areas` | `pass` |  |
| `auth.feature` | Route protection by role | `e2e/specs/auth.spec.ts` · `Scenario: Route protection by role` | `pass` |  |
| `auth.feature` | Auth screens do not offer Google | `e2e/specs/auth.spec.ts` · `Scenario: Auth screens do not offer Google` | `pass` | Guest login/signup; no Google/social control |
| `auth.feature` | Request a data export | `e2e/specs/auth.spec.ts` · `Scenario: Request a data export` | `pass` | Needs `DATABASE_URL`; on-demand JSON download |
| `auth.feature` | Request account deletion | `e2e/specs/auth.spec.ts` · `Scenario: Request account deletion` | `pass` | Disposable member; may skip credential check if Neon Auth disable incomplete |
| `auth.feature` | Account deletion is distinct from subscription cancellation | `e2e/specs/auth.spec.ts` · `Scenario: Account deletion is distinct from subscription cancellation` | `pass` | Cancel-alone vs delete; no fake Stripe ids on delete path |
| `auth.feature` | Admin can process account deletion on a member's behalf | `e2e/specs/auth.spec.ts` · `Scenario: Admin can process account deletion on a member's behalf` | `pass` | Needs `E2E_ADMIN_*`; may skip credential check if Neon Auth admin remove incomplete |
| `booking.feature` | Booking requires authentication | `e2e/specs/booking.spec.ts` · `Scenario: Booking requires authentication` | `pass` | Needs `DATABASE_URL` for seeded event id |
| `booking.feature` | Booking requires an active subscription | `e2e/specs/booking.spec.ts` · `Scenario: Booking requires an active subscription` | `pass` |  |
| `booking.feature` | Successful booking | `e2e/specs/booking.spec.ts` · `Scenario: Successful booking` | `pass` | Seeds ACTIVE via billing fixture |
| `booking.feature` | Book a priced datetime slot | `e2e/specs/booking.spec.ts` · `Scenario: Book a priced datetime slot` | `pass` | Needs `DATABASE_URL`; evening slot 4 credits; confirm time + ledger |
| `booking.feature` | Redemption info by ticket type | `e2e/specs/booking.spec.ts` · outline rows SECRET / VOUCHER_PROMO / VOUCHER_PDF | `pass` | Seed titles; PDF row skips without `S3_PRIVATE_BUCKET` |
| `booking.feature` | Booking fails — insufficient voucher inventory | `e2e/specs/booking.spec.ts` · `Scenario: Booking fails — insufficient voucher inventory` | `skip` | Covered by `book-event.integration.test` |
| `booking.feature` | Sold out — automatic waitlist offer | `e2e/specs/booking.spec.ts` · `Scenario: Sold out — automatic waitlist offer` | `pass` | Seed title `Sold Out: Waitlist Demo Night` |
| `booking.feature` | Booking fails — insufficient credits | `e2e/specs/booking.spec.ts` · `Scenario: Booking fails — insufficient credits` | `pass` |  |
| `booking.feature` | Booking fails — subscription frozen (past due) | `e2e/specs/booking.spec.ts` · `Scenario: Booking fails — subscription frozen (past due)` | `pass` |  |
| `booking.feature` | Idempotent retry | `e2e/specs/booking.spec.ts` · `Scenario: Idempotent retry` | `skip` | Covered by `book-event.integration.test` |
| `booking.feature` | Post-booking actions | `e2e/specs/booking.spec.ts` · `Scenario: Post-booking actions` | `pass` | Mask/reveal + copy + ICS + My Tickets |
| `booking.feature` | Multi-ticket promo codes are listed separately | `e2e/specs/booking.spec.ts` · `Scenario: Multi-ticket promo codes are listed separately` | `pass` | Needs seeded promo inventory |
| `booking.feature` | PDF voucher download is ownership-gated | `e2e/specs/booking.spec.ts` · `Scenario: PDF voucher download is ownership-gated` | `pass` | Skips without `S3_PRIVATE_BUCKET` (private-bucket named skip) |
| `booking.feature` | Booking confirmation email | `e2e/specs/booking.spec.ts` · `Scenario: Booking confirmation email` | `skip` | Staging Resend checklist — no inbox harness |
| `booking.feature` | Admin cancels a confirmed booking | `e2e/specs/booking.spec.ts` · `Scenario: Admin cancels a confirmed booking` | `pass` | Needs `E2E_ADMIN_*`; no credit refund on cancel; restock covered in domain tests |
| `booking.feature` | Cannot cancel a booking that is not confirmed | `e2e/specs/booking.spec.ts` · `Scenario: Cannot cancel a booking that is not confirmed` | `pass` | Re-open cancel URL after first cancel |
| `booking.feature` | Members cannot self-cancel or self-refund | `e2e/specs/booking.spec.ts` · `Scenario: Members cannot self-cancel or self-refund` | `pass` |  |
| `credits-subscription.feature` | New signups start inactive with starter credits | `e2e/specs/credits-subscription.spec.ts` · `Scenario: New signups start inactive with starter credits` | `pass` |  |
| `credits-subscription.feature` | Activating a subscription via real Stripe Checkout | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Activating a subscription via real Stripe Checkout` | `skip` | Opt-in `E2E_STRIPE_CHECKOUT=1`; staging smoke SoT |
| `credits-subscription.feature` | Checkout blocked while frozen | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Checkout blocked while frozen` | `pass` | Seeds `UNPAID` |
| `credits-subscription.feature` | Already-active member revisits checkout | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Already-active member revisits checkout` | `pass` |  |
| `credits-subscription.feature` | Failed payment marks the account past due | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Failed payment marks the account past due` | `pass` | Seeds `PAST_DUE` + book gate; full Stripe fail = staging webhook |
| `credits-subscription.feature` | Recovering from past due | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Recovering from past due` | `pass` | Asserts `/profile/billing` PAST_DUE + portal CTA; deep Portal = staging |
| `credits-subscription.feature` | Monthly renewal resets credits (no rollover) | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Monthly renewal resets credits (no rollover)` | `skip` | Billing package / webhook tests |
| `credits-subscription.feature` | Cancelling a subscription | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Cancelling a subscription` | `pass` | Cancel confirm UI + seeded `CANCELLED_PENDING`; live Stripe cancel = package/staging |
| `credits-subscription.feature` | Cancellation takes effect at period end | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Cancellation takes effect at period end` | `pass` | `CANCELLED_PENDING` still bookable |
| `credits-subscription.feature` | Reactivating after cancellation | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Reactivating after cancellation` | `pass` | INACTIVE → membership CTA |
| `credits-subscription.feature` | Booking gate by subscription status | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Booking gate by subscription status` | `pass` |  |
| `credits-subscription.feature` | Admin manually adjusts a member's credits | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin manually adjusts a member's credits` | `pass` | Membership HQ adjust-credits |
| `credits-subscription.feature` | Admin adjustment rejects a zero amount | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin adjustment rejects a zero amount` | `pass` |  |
| `credits-subscription.feature` | Admin issues a manual credit refund (support gesture) | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin issues a manual credit refund (support gesture)` | `pass` |  |
| `credits-subscription.feature` | Admin freezes a member's account | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin freezes a member's account` | `pass` | ACTIVE → UNPAID via admin freeze |
| `credits-subscription.feature` | Admin unfreezes a member's account | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin unfreezes a member's account` | `pass` | UNPAID → ACTIVE; no Stripe call |
| `credits-subscription.feature` | Admin creates a complimentary ticket | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin creates a complimentary ticket` | `pass` | Shared booking path, no credit charge |
| `event-discovery.feature` | Public discovery preview for guests | `e2e/specs/event-discovery.spec.ts` · `Scenario: Public discovery preview for guests` | `pass` | Partner venues section visible when seed has featured partners |
| `event-discovery.feature` | Guest sees featured Discover | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest sees featured Discover` | `pass` | Needs `DATABASE_URL`; `ensureDemoFeaturedSplit` |
| `event-discovery.feature` | Guest sees featured partners only | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest sees featured partners only` | `pass` | Needs `DATABASE_URL`; `ensureDemoFeaturedPartnersSplit` |
| `event-discovery.feature` | Empty featured partners hides Partner venues | — | `skip` | Deferred — owner: featured-partners step 03; clearing all featured partners on shared staging DB risks parallel Discover tests |
| `event-discovery.feature` | Guest can view public event detail without authentication | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest can view public event detail without authentication` | `pass` |  |
| `event-discovery.feature` | Guest sees English title on /en | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest sees English title on /en` | `pass` | Needs `DATABASE_URL`; seeded `localeCopyDe` / `localeCopyEn`; identity h1 |
| `event-discovery.feature` | Guest sees German title on /de | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest sees German title on /de` | `pass` | Needs `DATABASE_URL`; same bilingual seed; identity h1 |
| `event-discovery.feature` | Dropdown changes credits | `e2e/specs/event-discovery.spec.ts` · `Scenario: Dropdown changes credits` | `pass` | Needs `DATABASE_URL`; `createPricedSlotEvent` morning 1 / evening 4 |
| `event-discovery.feature` | Guest checkout omits slot picker | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest checkout omits slot picker` | `pass` | Needs `DATABASE_URL`; no datetime select, no credit totals |
| `event-discovery.feature` | Detail shows subtitles when present | `e2e/specs/event-discovery.spec.ts` · `Scenario: Detail shows subtitles when present` | `pass` | Needs `DATABASE_URL` + reseeded demo promo event (`has_subtitles`, one or more codes); also covered by admin-events save scenario |
| `event-discovery.feature` | Detail omits subtitles when absent | `e2e/specs/event-discovery.spec.ts` · `Scenario: Detail omits subtitles when absent` | `pass` | Needs `DATABASE_URL`; seeded tonight has no subtitles |
| `event-discovery.feature` | Large viewport uses two primary rows | `e2e/specs/event-discovery.spec.ts` · `Scenario: Large viewport uses two primary rows` | `pass` | Smoke: identity + checkout CTA + hero + DETAILS (no CSS-grid hashes) |
| `event-discovery.feature` | Guest sees partner attribution | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest sees partner attribution` | `pass` | Needs `DATABASE_URL` + R2; partner logo alt = partner name; DETAILS attribution (not hero sticker) |
| `event-discovery.feature` | Guest sees partner opening hours | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest sees partner opening hours` | `pass` | Needs `DATABASE_URL`; temporarily enables hours on seeded partner and restores after; open-day line visible; Wed/Sun Closed count 0 |
| `event-discovery.feature` | Hours omitted when disabled | `e2e/specs/event-discovery.spec.ts` · `Scenario: Hours omitted when disabled` | `pass` | Needs `DATABASE_URL`; asserts no weekday hours list when `has_opening_hours` false |
| `event-discovery.feature` | Eligible member Date is date-only when partner has hours | `e2e/specs/event-discovery.spec.ts` · `Scenario: Eligible member Date is date-only when partner has hours` | `pass` | Needs `DATABASE_URL` + member signup; Date cell omits `\d{1,2}:\d{2}`; hours list still visible; same-day collapse covered by `event-detail-when-display.test.ts` |
| `event-discovery.feature` | Eligible member Date keeps time when partner has no hours | `e2e/specs/event-discovery.spec.ts` · `Scenario: Eligible member Date keeps time when partner has no hours` | `pass` | Needs `DATABASE_URL` + member signup; Date cell includes clock time; hours list absent |
| `event-discovery.feature` | Event detail shows partner barrier-free | `e2e/specs/event-discovery.spec.ts` · `Scenario: Event detail shows partner barrier-free` | `pass` | Needs `DATABASE_URL`; temporarily sets partner `barrier_free` true and restores after |
| `event-discovery.feature` | Event detail when partner barrier-free is unset | `e2e/specs/event-discovery.spec.ts` · `Scenario: Event detail when partner barrier-free is unset` | `pass` | Needs `DATABASE_URL`; partner null → Keine Angabe / Not specified |
| `event-discovery.feature` | Guest does not see zip or age groups in DETAILS | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest does not see zip or age groups in DETAILS` | `pass` | Needs `DATABASE_URL`; DETAILS omits PLZ / Zip code; Target age groups row remains absent (field removed) |
| `event-discovery.feature` | Detail LOCATION shows composed address with map | `e2e/specs/event-discovery.spec.ts` · (LOCATION with map) | `pass` | Composed address text; map gated on lat/lng + cookie consent |
| `event-discovery.feature` | Detail LOCATION shows composed address without coordinates | `e2e/specs/event-discovery.spec.ts` · (LOCATION without map) | `pass` | Composed address when lat/lng null; no map required |
| `event-discovery.feature` | Event card shows zip | `e2e/specs/event-discovery.spec.ts` · `Scenario: Event card shows zip` | `pass` | Discover card shows Berlin PLZ |
| `event-discovery.feature` | Guest views gallery on event detail | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest views gallery on event detail` | `pass` | Needs `DATABASE_URL` + R2; `ensureDemoEventGallery` |
| `event-discovery.feature` | No gallery images | `e2e/specs/event-discovery.spec.ts` · `Scenario: No gallery images` | `pass` | Uses seeded konzert (no gallery) |
| `event-discovery.feature` | Featured demo event includes gallery | `e2e/specs/event-discovery.spec.ts` · `Scenario: Featured demo event includes gallery` | `pass` | Needs `DATABASE_URL` + R2 |
| `event-discovery.feature` | Hero shows credit | `e2e/specs/event-discovery.spec.ts` · `Scenario: Hero shows credit` | `pass` | Needs `DATABASE_URL`; temporarily sets primary `images.credit` and restores |
| `event-discovery.feature` | Gallery photo credit in lightbox | `e2e/specs/event-discovery.spec.ts` · `Scenario: Gallery photo credit in lightbox` | `pass` | Needs `DATABASE_URL` + R2; credit on first gallery image; not on thumbs |
| `event-discovery.feature` | Empty credit omitted | `e2e/specs/event-discovery.spec.ts` · `Scenario: Empty credit omitted` | `pass` | Needs `DATABASE_URL`; NULL credit → no caption |
| `event-discovery.feature` | Cards omit credit | `e2e/specs/event-discovery.spec.ts` · `Scenario: Cards omit credit` | `pass` | Needs `DATABASE_URL`; Discover cards omit primary credit |
| `event-discovery.feature` | Guest path to full browse requires signup or login | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest path to full browse requires signup or login` | `pass` |  |
| `event-discovery.feature` | Default feed shows all upcoming events soonest first | `e2e/specs/event-discovery.spec.ts` · `Scenario: Default feed shows all upcoming events soonest first` | `pass` |  |
| `event-discovery.feature` | Events with invalid or past dates are hidden | `e2e/specs/event-discovery.spec.ts` · `Scenario: Events with invalid or past dates are hidden` | `pass` |  |
| `event-discovery.feature` | Filter by category | `e2e/specs/event-discovery.spec.ts` · `Scenario: Filter by category` | `pass` |  |
| `event-discovery.feature` | Event name filter control | `e2e/specs/event-discovery.spec.ts` · `Scenario: Event name filter control` | `pass` | Event name field visible with partner/date controls; date `min` = Berlin today |
| `event-discovery.feature` | Filter by event name | `e2e/specs/event-discovery.spec.ts` · `Scenario: Filter by event name` | `pass` | Title substring via GET `title` |
| `event-discovery.feature` | Filter by English title on /de | `e2e/specs/event-discovery.spec.ts` · `Scenario: Filter by English title on /de` | `pass` | Needs `DATABASE_URL`; `title=Unveiled-EN-Copy` on `/de/events`; card shows German title |
| `event-discovery.feature` | Filter by partner (venue) | `e2e/specs/event-discovery.spec.ts` · `Scenario: Filter by partner (venue)` | `pass` |  |
| `event-discovery.feature` | Filter by custom date range | `e2e/specs/event-discovery.spec.ts` · `Scenario: Filter by custom date range` | `pass` | Inclusive Berlin days; future-only / today floor |
| `event-discovery.feature` | Reset filters | `e2e/specs/event-discovery.spec.ts` · `Scenario: Reset filters` | `pass` | Clears title + category + partner + dates |
| `event-discovery.feature` | No results | `e2e/specs/event-discovery.spec.ts` · `Scenario: No results` | `pass` |  |
| `event-discovery.feature` | Map view mirrors the filtered feed | `e2e/specs/event-discovery.spec.ts` · `Scenario: Map view mirrors the filtered feed` | `pass` | Preserves title/category/partner/date |
| `event-discovery.feature` | Saved events view | `e2e/specs/event-discovery.spec.ts` · `Scenario: Saved events view` | `pass` |  |
| `event-discovery.feature` | Save and unsave an event | `e2e/specs/event-discovery.spec.ts` · `Scenario: Save and unsave an event` | `pass` |  |
| `event-discovery.feature` | Saving requires authentication | `e2e/specs/event-discovery.spec.ts` · `Scenario: Saving requires authentication` | `pass` |  |
| `onboarding.feature` | Onboarding is required before using the app | `e2e/specs/onboarding.spec.ts` · `Scenario: Onboarding is required before using the app` | `pass` |  |
| `onboarding.feature` | Non-USER roles skip onboarding | `e2e/specs/onboarding.spec.ts` · `Scenario: Non-USER roles skip onboarding` | `pass` |  |
| `onboarding.feature` | Already-onboarded users skip onboarding | `e2e/specs/onboarding.spec.ts` · `Scenario: Already-onboarded users skip onboarding` | `pass` | Redirect may be `/events` or `/discover` by booking eligibility |
| `onboarding.feature` | Step 1 — age group (skippable) | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 1 — age group (skippable)` | `pass` |  |
| `onboarding.feature` | Step 2 — interests and moods | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 2 — interests and moods` | `pass` | Asserts Other / Sonstiges visibility; Other+text submit covered by auth unit tests |
| `onboarding.feature` | Step 2 — interests and moods optional | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 2 — interests and moods optional` | `pass` | Empty interests/moods advance |
| `onboarding.feature` | Step 3 — zip under Germany/Berlin | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 3 — zip under Germany/Berlin` | `pass` | Germany/Berlin prefilled; optional Berlin PLZ; blank Next OK; invalid non-empty zip rejected; no travel distance |
| `onboarding.feature` | Step 4 — timing, days, languages, accessibility | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 4 — timing, days, languages, accessibility` | `pass` | Searchable languages; Accessibility needed? Yes/Ja |
| `onboarding.feature` | Step 4 — timing preferences optional | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 4 — timing preferences optional` | `pass` | Empty timing/days/languages finish to membership |
| `onboarding.feature` | Completing onboarding | `e2e/specs/onboarding.spec.ts` · `Scenario: Completing onboarding` | `pass` |  |
| `onboarding.feature` | Completing onboarding with all fields blank | `e2e/specs/onboarding.spec.ts` · `Scenario: Completing onboarding with all fields blank` | `pass` | Skip age + blank prefs through membership |
| `profile.feature` | View and edit identity | `e2e/specs/profile.spec.ts` · `Scenario: View and edit identity` | `pass` |  |
| `profile.feature` | Change password | `e2e/specs/profile.spec.ts` · `Scenario: Change password` | `pass` | Asserts `/profile/security` entry; Neon Auth owns mutation |
| `profile.feature` | View billing information | `e2e/specs/profile.spec.ts` · `Scenario: View billing information` | `pass` |  |
| `profile.feature` | Update billing information | `e2e/specs/profile.spec.ts` · `Scenario: Update billing information` | `pass` | Portal CTA + error path with fake `cus_*`; deep Portal = staging |
| `profile.feature` | Cancel subscription | `e2e/specs/profile.spec.ts` · `Scenario: Cancel subscription` | `pass` | Confirm page + seeded `CANCELLED_PENDING` |
| `profile.feature` | Access account deletion and data export | `e2e/specs/profile.spec.ts` · `Scenario: Access account deletion and data export` | `pass` | Entry links + page headings; full mechanics in `auth.spec.ts` |
| `profile.feature` | Edit cultural preferences ("Vibes") | `e2e/specs/profile.spec.ts` · `Scenario: Edit cultural preferences ("Vibes")` | `pass` | Zip under Germany/Berlin; no travel distance; languages / accessibility / Other surfaces |
| `profile.feature` | View membership home | `e2e/specs/profile.spec.ts` · `Scenario: View membership home` | `pass` | Membership panel + manage CTA; tablist above account heading; skip if no `DATABASE_URL` |
| `profile.feature` | Inactive member starts membership from profile home | `e2e/specs/profile.spec.ts` · `Scenario: Inactive member starts membership from profile home` | `pass` | Checkout CTA → `/membership`; skip if no `DATABASE_URL` |
| `static-pages.feature` | Guest marketing home is the locale home page | `e2e/specs/static-pages.spec.ts` · `Scenario: Guest marketing home is the locale home page` | `pass` |  |
| `static-pages.feature` | Signed-in users are redirected away from the guest marketing home | — | `deferred` | Covered by unit `resolvePostAuthRedirect` + index route; e2e optional |
| `static-pages.feature` | Discover is available at /discover | `e2e/specs/static-pages.spec.ts` · `Scenario: Discover is available at /discover` | `pass` |  |
| `static-pages.feature` | Discover preview links to public event detail | `e2e/specs/static-pages.spec.ts` · `Scenario: Discover preview links to public event detail` | `pass` |  |
| `static-pages.feature` | Discover CTA path to the full member events feed | `e2e/specs/static-pages.spec.ts` · `Scenario: Discover CTA path to the full member events feed` | `pass` | CTA → signup?returnTo=/events; after onboarding test navigates to `/events`. Auto honor `returnTo` on onboarding finish → `deferred` (post-MVP polish) |
| `static-pages.feature` | How it works | `e2e/specs/static-pages.spec.ts` · `Scenario: How it works` | `pass` |  |
| `static-pages.feature` | FAQ | `e2e/specs/static-pages.spec.ts` · `Scenario: FAQ` | `pass` |  |
| `static-pages.feature` | Bare /discover redirects to localized Discover | `e2e/specs/static-pages.spec.ts` · `Scenario: Bare /discover redirects to localized Discover` | `pass` |  |
| `static-pages.feature` | Bilingual content | `e2e/specs/static-pages.spec.ts` · `Scenario: Bilingual content` | `pass` |  |
| `static-pages.feature` | Legal pages exist and are linked from the footer | `e2e/specs/static-pages.spec.ts` · `Scenario: Legal pages exist and are linked from the footer` | `pass` | Three footer LEGAL links; distinctive body (address / rights / credits no-rollover); foreground card copy |
| `static-pages.feature` | Cookie consent banner on first visit | `e2e/specs/static-pages.spec.ts` · `Scenario: Cookie consent banner on first visit` | `pass` |  |
| `static-pages.feature` | Declining consent disables the map embed | `e2e/specs/static-pages.spec.ts` · `Scenario: Declining consent disables the map embed` | `pass` |  |
| `static-pages.feature` | Error tracking is not gated behind consent | `e2e/specs/static-pages.spec.ts` · `Scenario: Error tracking is not gated behind consent` | `pass` | Server-only Sentry (`SENTRY_DSN`); no `window.Sentry` — asserts tracking is not consent-gated |
| `waitlist.feature` | Join the waitlist | `e2e/specs/waitlist.spec.ts` · `Scenario: Join the waitlist` | `pass` | Seed `Sold Out: Waitlist Demo Night` |
| `waitlist.feature` | Joining the waitlist requires authentication | `e2e/specs/waitlist.spec.ts` · `Scenario: Joining the waitlist requires authentication` | `pass` |  |
| `waitlist.feature` | Duplicate waitlist join is prevented | `e2e/specs/waitlist.spec.ts` · `Scenario: Duplicate waitlist join is prevented` | `pass` |  |
| `waitlist.feature` | I can cancel my own waitlist entry | `e2e/specs/waitlist.spec.ts` · `Scenario: I can cancel my own waitlist entry` | `pass` |  |
| `waitlist.feature` | Automatic promotion when capacity frees up | `e2e/specs/waitlist.spec.ts` · `Scenario: Automatic promotion when capacity frees up` | `pass` | Needs `E2E_ADMIN_*`; admin capacity bump |
| `waitlist.feature` | Promotion is skipped if I'm no longer eligible | `e2e/specs/waitlist.spec.ts` · `Scenario: Promotion is skipped if I'm no longer eligible` | `pass` | Needs `E2E_ADMIN_*` |
| `waitlist.feature` | Promotion respects queue order and partial capacity | `e2e/specs/waitlist.spec.ts` · `Scenario: Promotion respects queue order and partial capacity` | `skip` | Covered by `waitlist.integration.test`; multi-user e2e harness limit |
| `waitlist.feature` | Admin can manually trigger promotion for a specific entry | `e2e/specs/waitlist.spec.ts` · `Scenario: Admin can manually trigger promotion for a specific entry` | `pass` | Capacity freed via DB (no auto-promote), then `/admin/waitlist/:id/promote` |
| `waitlist.feature` | Admin visibility | `e2e/specs/waitlist.spec.ts` · `Scenario: Admin visibility` | `pass` | `/admin/waitlist` list |
| `waitlist.feature` | User visibility is scoped to their own entries | `e2e/specs/waitlist.spec.ts` · `Scenario: User visibility is scoped to their own entries` | `pass` | Entry-scoped status/cancel only |

## Post-MVP (`features/post-mvp/`)

Partner portal / check-in is **out of MVP**. Overlapping stubs in `e2e/specs/admin-partners.spec.ts` remain `@skip-no-ui` until post-MVP.

| Feature file | Scenario title | Playwright | Status | Notes |
|---|---|---|---|---|
| `post-mvp/partner-and-checkin.feature` | Regenerate a partner's venue check-in QR token | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Create partner portal login access | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Creating portal access when it already exists | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Creating portal access requires a valid email | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Creating portal access with an email already in use | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | View partner dashboard summary | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | View my venue check-in QR link | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | View guest list | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Guest list is scoped to my venue only | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Search the guest list | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Filter the guest list by event | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Manually check in a guest | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Check-in action is disabled outside the window or after use | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Export guest codes | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Create my own event | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Edit my own event | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Delete my own event | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Cannot manage another partner's events | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Cannot reassign an event to another partner | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Admin retains full override across all partners | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Partner manually checks in a guest (door) | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Admin can check in any booking | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Cannot check in outside the window | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Cannot check in a booking that isn't confirmed | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Re-checking in an already-used booking | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Guest self-check-in via venue QR code | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Guest scans venue QR while signed out | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Guest scans venue QR with no eligible booking | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Re-scanning an already-used venue QR check-in | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Venue token mismatch | — | `skip` | post-MVP |

## Phase 8 close-out (`seo-launch-polish-03`)

All 11 top-level MVP `docs/product/features/*.feature` files are mapped above to `pass` / `skip` / `deferred`. No `unshipped` MVP rows remain. Silent skips are forbidden; named MVP deferrals:

| Scenario | Status | Owner / reason |
|---|---|---|
| Stripe Checkout activation | `skip` | Opt-in `E2E_STRIPE_CHECKOUT=1`; staging smoke SoT |
| Monthly renewal / no rollover | `skip` | Billing package + webhook tests |
| Booking confirmation email | `skip` | No inbox harness; staging Resend |
| Idempotent retry / waitlist queue order | `skip` | Covered by package integration tests |
| Onboarding auto-`returnTo` after finish | `deferred` | post-MVP polish — finish still → `/membership` |
| GDPR credential reject after anonymize | conditional skip | Neon Auth delete/remove plugins; ops cutover |
| Partner portal / QR / check-in | `skip` | `features/post-mvp/` |

## Locator / harness notes

| Item | Status | Notes |
|---|---|---|
| Admin event date/time `input[name=…]` (G7) | remediated | `getByLabel` / roles in admin-events + fixtures |
| File inputs (`image`, `logo`) | exception | `// BDD exception: file-input` |
| `e2e/fixtures/onboarding.ts` `page.locator("label").filter` | deferred polish | proximity-adjacent; left as-is |
| Remote-URL event image | pass | |
