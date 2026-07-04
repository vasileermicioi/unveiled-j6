## Why

The repository is docs-only today — no application code, no workspace tooling. Phase 0 step 01 must establish a Bun workspaces monorepo with shared TypeScript and Biome presets so subsequent steps can add `apps/web` and later packages without rework or duplicated config.

## What Changes

- Add root `package.json` with Bun workspaces (`apps/*`, `packages/*`), a shared dependency `catalog`, and root scripts (`dev`, `build`, `lint`, `typecheck`, plus stubs for `db:*` and `seed:demo` that activate in later phases).
- Add `bunfig.toml` with workspace-appropriate defaults.
- Create `packages/config` (`@unveiled/config`) exporting shared TypeScript and Biome presets.
- Add root `biome.json` extending the config package preset.
- Update `.gitignore` for Bun/Node build artifacts and local env files.
- **Out of scope for this change:** `apps/web`, domain packages (`db`, `auth`, `ui`, etc.), CI/CD, HeroUI/HonoX dependencies.

## Capabilities

### New Capabilities

- `platform-foundation`: Bun workspaces monorepo root, shared `@unveiled/config` presets, and Phase 0 package scope (only `packages/config` exists).

### Modified Capabilities

<!-- None — no existing specs in openspec/specs/ yet. -->

## Impact

- **New files:** `package.json`, `bunfig.toml`, `biome.json`, `packages/config/*`, updated `.gitignore`.
- **Dependencies:** `@biomejs/biome` (dev), Bun lockfile created on first `bun install`.
- **Downstream:** `phase0-foundation-02-honox-app-scaffold` consumes this workspace; root scripts will target `@unveiled/web` once that package exists.
- **Branch:** `phase-0-foundation` or `phase-0-foundation-01` per iteration convention.
