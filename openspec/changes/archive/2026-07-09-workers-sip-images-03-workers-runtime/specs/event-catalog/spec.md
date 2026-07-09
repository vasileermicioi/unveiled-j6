## ADDED Requirements

### Requirement: Admin image upload on the application host

Admin partner and event image uploads SHALL succeed on the primary deployed host (Cloudflare Workers). The system SHALL NOT require a separate Node-only process for variant generation in the happy path. Multipart uploads remain SSR form POST only.

#### Scenario: Partner create with logo on Workers

- **WHEN** an admin submits a valid logo file to `/:locale/admin/partners/new` on the Workers deployment
- **THEN** the request completes successfully, six JPEG variants are stored in object storage, and the partner detail/list shows the logo thumbnail

#### Scenario: Event create with image on Workers

- **WHEN** an admin submits a valid event image file to `/:locale/admin/events/new` on the Workers deployment
- **THEN** the request completes successfully, six JPEG variants are stored in object storage, and admin/public surfaces can resolve the image thumbnail URL

#### Scenario: Validation failures still reject uploads

- **WHEN** an admin submits a file that is too large, below minimum dimensions, or provides both upload and remote URL
- **THEN** the request fails with a clear validation error and no incomplete image row/objects are left for that attempt

## REMOVED Requirements

### Requirement: Option B local-only image uploads

**Reason:** `@unveiled/images` now uses `@standardagents/sip` (WASM), which runs in the Cloudflare Workers isolate. The Option B behavior that rejected uploads with `IMAGE_PROCESSING_UNAVAILABLE` / “upload using bun run dev” is obsolete for the sip-based pipeline.

**Migration:** Bundle sip WASM in the `apps/web` Workers build, use a static import of `@unveiled/images` from catalog image persistence, and delete `IMAGE_PROCESSING_UNAVAILABLE` from catalog errors and admin error mapping. Operators upload via the staging/production Workers URL; local `bun run dev` remains supported but is no longer required for happy-path admin image flows.
