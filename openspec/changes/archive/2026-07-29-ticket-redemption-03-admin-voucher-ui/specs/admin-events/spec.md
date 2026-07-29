## ADDED Requirements

### Requirement: Admin event form ticket types and voucher inventory islands

Admin event create, edit, and series forms SHALL offer ticket types `SECRET_CODE`, `VOUCHER_PROMO`, and `VOUCHER_PDF` via the shared base fields. `SECRET_CODE` SHALL show a manual secret-code text field and SHALL NOT show a secret-code mode control. `VOUCHER_PROMO` SHALL show `event_website_url` plus a client preview island for text/CSV (or paste) promo codes. `VOUCHER_PDF` SHALL show a client island for master PDF upload with native number inputs for pages to skip and pages per ticket, plus per-ticket preview. Persistence of inventory SHALL occur only through the existing SSR form POST path (hidden staged fields and/or prior authenticated admin PDF upload that returns object keys). Theme and HeroUI rules SHALL match AGENTS.md (native file/number controls; no client-only inventory mutation modals).

#### Scenario: Secret code has no mode field

- **WHEN** an admin opens create or edit with ticket type `SECRET_CODE`
- **THEN** they can enter a secret code
- **AND** no secret-code mode select is shown

#### Scenario: Promo inventory island on create

- **WHEN** an admin chooses `VOUCHER_PROMO` on create
- **THEN** they see the website URL field and a file/paste control that previews codes before submit

#### Scenario: PDF inventory island on create

- **WHEN** an admin chooses `VOUCHER_PDF` on create
- **THEN** they see PDF upload plus skip and pages-per-ticket number inputs
- **AND** a preview of derived tickets before submit

### Requirement: Admin edit shows voucher inventory summary

When an admin opens edit for an event with voucher inventory, the form SHALL show available and allocated counts for the relevant inventory type(s). Counts SHALL be loaded server-side for the edit page (catalog inventory count helper) and rendered with HeroUI chrome.

#### Scenario: Edit shows available and allocated counts

- **WHEN** an admin opens edit for a `VOUCHER_PROMO` or `VOUCHER_PDF` event that has inventory rows
- **THEN** the page shows available and allocated inventory counts
