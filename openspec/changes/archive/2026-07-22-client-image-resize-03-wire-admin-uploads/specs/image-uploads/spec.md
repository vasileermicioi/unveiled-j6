## ADDED Requirements

### Requirement: Admin direct upload processing location
The system SHALL generate the six JPEG variants for admin file-picker uploads in the browser with Pica before the SSR form POST, and the server SHALL persist those prebuilt variants to object storage without server-side sip resize for that submission. Admin file-picker image upload REQUIRES JavaScript.

#### Scenario: Admin picks a local image file
- **WHEN** an admin selects a valid image file on event or partner create/edit and submits the form
- **THEN** the client produces six JPEG variants and the server stores them under `images/{id}/` without server-side sip resize for that submission

#### Scenario: Client processing failure surfaces before persist
- **WHEN** the client generator rejects or fails on a selected file (undersized, unreadable, or processing error)
- **THEN** the admin sees a localized processing error and the form does not persist a new catalog image from that incomplete attempt

#### Scenario: Remote URL path remains server-side until later hardening
- **WHEN** an admin submits an event image via remote URL only (no local file / no prebuilt variants)
- **THEN** the server continues the existing fetch + sip path for that submission
