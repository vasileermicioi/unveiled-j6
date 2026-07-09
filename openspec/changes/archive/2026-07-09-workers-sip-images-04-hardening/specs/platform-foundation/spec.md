## ADDED Requirements

### Requirement: Documented image upload operations

Operator documentation (`AGENTS.md`, `apps/web/DEPLOYMENT.md`, `packages/images/README.md`, `e2e/README.md`) SHALL describe `@standardagents/sip` on Cloudflare Workers as the supported upload path, including JPEG variant filenames and the need to re-seed or re-upload after migrating from the former WebP/sharp pipeline. Those docs SHALL NOT present Option B local-only uploads or `sharp` as the required happy path for staging or production.

#### Scenario: Operator follows DEPLOYMENT.md

- **WHEN** an operator configures R2 and deploys `apps/web` to Workers
- **THEN** documentation instructs them that admin image uploads work on that deployment and does not direct them to Option B local-only uploads as the primary path

#### Scenario: Agent and e2e docs match Workers+sip

- **WHEN** an operator or agent reads `AGENTS.md` hosting/images notes and `e2e/README.md` image-test guidance
- **THEN** both describe sip on Workers (and local Bun/Node) with `.jpg` variants and do not require `bun run dev` + `sharp` as the only upload host

#### Scenario: Legacy WebP migration is documented

- **WHEN** an operator has existing R2 objects or DB rows from the former `.webp` pipeline
- **THEN** `apps/web/DEPLOYMENT.md` (or linked image docs) instructs them to re-run `bun run seed:demo` and/or re-upload images so public URLs resolve to `.jpg` variants

## MODIFIED Requirements

### Requirement: Image processing runtime target

The application SHALL target Cloudflare Workers for `apps/web` SSR and SHALL process admin image uploads in-request on that host using `@standardagents/sip`. Product and operator documentation (`docs/migration/extras/image-uploads.md`, `AGENTS.md`, `apps/web/DEPLOYMENT.md`) SHALL name `@standardagents/sip` as the processing approach and SHALL describe JPEG variant filenames. The historical “Node-only sharp / Option B local uploads” hosting assumption is superseded and SHALL NOT be presented as the required happy path for staging or production uploads.

#### Scenario: Documentation states the target processor

- **WHEN** an operator reads `docs/migration/extras/image-uploads.md` after this change
- **THEN** the doc names `@standardagents/sip` (or equivalent Workers-native library) as the processing approach and describes JPEG variant filenames

#### Scenario: Deployment docs do not require local-only uploads

- **WHEN** an operator reads `apps/web/DEPLOYMENT.md` image-processing notes after this change
- **THEN** the notes do not instruct that Workers admin uploads must use `bun run dev` / Option B as the only path

#### Scenario: AGENTS.md hosting matches Workers+sip

- **WHEN** an agent reads the `AGENTS.md` hosting and Images stack rows
- **THEN** they state Cloudflare Workers + `@standardagents/sip` with six JPEG variants and do not claim admin uploads on the Workers URL are unavailable
