## ADDED Requirements

### Requirement: sip WASM available in the Worker isolate

The `apps/web` Cloudflare Workers build SHALL include the `@standardagents/sip` WASM module (or sip’s workerd-supported loader) so `await ready()` succeeds inside the isolate before image transforms run. The production bundle SHALL NOT depend on unresolved `sharp` (or other Node-native image addons) for admin upload processing.

#### Scenario: Worker cold start upload

- **WHEN** the first admin image upload runs on a fresh Worker isolate
- **THEN** sip initializes successfully and processes the image without native-addon errors

#### Scenario: Production build ships sip without sharp

- **WHEN** an operator runs `bun run build` for `apps/web`
- **THEN** the Worker bundle references sip/wasm successfully and does not require a `sharp` native addon at runtime

## MODIFIED Requirements

### Requirement: Image processing runtime target

The application SHALL target Cloudflare Workers for `apps/web` SSR and SHALL process admin image uploads in-request on that host using `@standardagents/sip`. Product documentation SHALL name `@standardagents/sip` as the processing approach and SHALL describe JPEG variant filenames. The historical “Node-only sharp / Option B local uploads” hosting assumption is superseded and SHALL NOT be presented as the required happy path for staging or production uploads.

#### Scenario: Documentation states the target processor

- **WHEN** an operator reads `docs/migration/extras/image-uploads.md` after this change
- **THEN** the doc names `@standardagents/sip` (or equivalent Workers-native library) as the processing approach and describes JPEG variant filenames

#### Scenario: Deployment docs do not require local-only uploads

- **WHEN** an operator reads `apps/web/DEPLOYMENT.md` image-processing notes after this change
- **THEN** the notes do not instruct that Workers admin uploads must use `bun run dev` / Option B as the only path
