## 1. Pre-flight

- [x] 1.1 Confirm no conflicting root `package.json` or existing workspace layout
- [x] 1.2 Read `proposal.md`, `design.md`, and `specs/platform-foundation/spec.md`

## 2. Root workspace

- [x] 2.1 Create root `package.json` with `workspaces`, `catalog`, scripts (`dev`, `build`, `lint`, `typecheck`, `db:generate`, `db:migrate`, `seed:demo`), and `@biomejs/biome` devDependency per design
- [x] 2.2 Create `bunfig.toml` with workspace install defaults

## 3. Shared config package

- [x] 3.1 Create `packages/config/package.json` (`@unveiled/config`) with exports for tsconfig and biome presets
- [x] 3.2 Create `packages/config/tsconfig.base.json` — strict TypeScript baseline per design
- [x] 3.3 Create `packages/config/tsconfig.react.json` extending base with JSX/DOM libs
- [x] 3.4 Create `packages/config/biome.json` — formatter + linter preset with standard ignores
- [x] 3.5 Add no-op `"typecheck": "echo 'no types yet'"` script to `@unveiled/config` so root `typecheck` does not fail on empty filter

## 4. Root tooling

- [x] 4.1 Create root `biome.json` extending `@unveiled/config/biome.json`
- [x] 4.2 Update `.gitignore` for `node_modules/`, `dist/`, `.output/`, `.turbo/`, `*.tsbuildinfo`, `.env.local`, `.env.*.local` (preserve existing entries)

## 5. Validation

- [x] 5.1 Run `bun install` — completes without errors, generates `bun.lock`
- [x] 5.2 Run `bun run lint` — Biome exits 0
- [x] 5.3 Verify `packages/` contains only `config/` (no stray domain packages)
- [x] 5.4 Sanity-check JSON syntax of all tsconfig and biome files

## 6. Wrap-up

- [ ] 6.1 Commit on branch `phase-0-foundation-01` (or parent `phase-0-foundation`)
- [ ] 6.2 Mark step 01 done in parent iteration guide when merged
