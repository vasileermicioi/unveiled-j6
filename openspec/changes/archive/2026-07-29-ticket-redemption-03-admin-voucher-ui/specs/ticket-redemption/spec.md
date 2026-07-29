## ADDED Requirements

### Requirement: Admin promo code file upload with preview

Admins SHALL upload promo codes for `VOUCHER_PROMO` events from a text or CSV file (and MAY paste the same content). The browser SHALL parse the file as one non-empty trimmed code per line and preview codes before an SSR form POST persists them. Inventory rows SHALL NOT be written until the form is successfully posted. After a successful save, each previewed code SHALL exist as an `AVAILABLE` `event_voucher_codes` row for that event. On edit, a new upload SHALL append by default; an optional replace-unused control MAY delete only `AVAILABLE` rows before append and MUST NOT delete `ALLOCATED` rows.

#### Scenario: Preview then save promo codes

- **WHEN** an admin selects a text/CSV file on the event form
- **THEN** the UI lists the extracted non-empty codes (one per line) for preview
- **AND** no inventory rows are written until the form is successfully posted
- **AND** after a successful save each previewed code exists as an `AVAILABLE` inventory row

#### Scenario: Edit appends promo codes by default

- **WHEN** an admin edits a `VOUCHER_PROMO` event that already has inventory
- **AND** uploads additional codes without replace-unused
- **THEN** the new codes are inserted as `AVAILABLE`
- **AND** existing `ALLOCATED` and prior `AVAILABLE` rows remain

### Requirement: Admin PDF voucher split with preview

Admins SHALL upload one master PDF for `VOUCHER_PDF` events, configure pages to skip and pages per ticket (native number inputs; defaults skip = 0, pages-per-ticket = 1), preview every derived ticket, then persist one PDF inventory item per ticket via SSR. Client-side slicing SHALL produce one downloadable PDF object per previewed ticket stored in R2; the SSR create/edit path SHALL insert corresponding `AVAILABLE` `event_voucher_pdfs` rows. Preview islands SHALL NOT write inventory alone.

#### Scenario: Configure split and preview tickets

- **WHEN** an admin uploads a PDF and sets skip = S and pages-per-ticket = P
- **THEN** the UI shows one preview entry per derived ticket after the skipped pages
- **AND** confirming the event form stores one downloadable PDF object per previewed ticket as `AVAILABLE` inventory

#### Scenario: Invalid split configuration

- **WHEN** skip/pages-per-ticket leave zero complete tickets
- **THEN** the UI prevents submit and explains that no tickets were produced

### Requirement: Admin redemption configuration validation on create

Creating an event (including series create of voucher-typed base fields) SHALL validate redemption fields by ticket type as follows: `SECRET_CODE` requires `secretCode`; `VOUCHER_PROMO` requires a non-empty promo inventory payload and `eventWebsiteUrl`; `VOUCHER_PDF` requires a non-empty PDF inventory payload. There is no secret-code mode field. Editing an event MAY omit a new inventory payload when inventory already exists for that type.

#### Scenario Outline: Required redemption inputs

- **WHEN** an admin creates an event with ticket type "<ticketType>"
- **AND** omits "<requiredField>"
- **THEN** creation is rejected until it is provided

| ticketType    | requiredField        |
|---------------|----------------------|
| SECRET_CODE   | secretCode           |
| VOUCHER_PROMO | promo inventory      |
| VOUCHER_PROMO | eventWebsiteUrl      |
| VOUCHER_PDF   | PDF ticket inventory |

#### Scenario: Edit without new inventory keeps existing stock

- **WHEN** an admin edits a voucher event and does not upload new inventory
- **THEN** the save succeeds if event-level redemption fields remain valid
- **AND** existing inventory rows are unchanged

## REMOVED Requirements

### Requirement: Admin configures SHARED_GENERATED or UNIQUE_PER_BOOKING

**Reason:** Product removed secret-code modes; SECRET_CODE is always a single admin-configured manual code.

**Migration:** Remove any remaining admin UI, copy, and form parser acceptance of `secret_code_mode`; rely on `secret_code` only (schema already dropped the column in step 01).
