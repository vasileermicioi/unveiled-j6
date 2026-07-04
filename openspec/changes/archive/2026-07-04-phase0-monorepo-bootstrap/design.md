## Context

The Unveiled Berlin rewrite starts from a docs-only repository (`docs/migration/`, `AGENTS.md`, `.dev-plan/`). Phase 0 step 01 is the first code commit: establish Bun workspaces and shared tooling presets before `apps/web` (step 02) and all later packages.

Constraints from `AGENTS.md` and `.dev-plan/IMPLEMENTATION-PLAN.md`:
- Bun workspaces with `apps/*` and `packages/*` globs.
- Shared dependency versions via root `catalog`.
- Biome as the sole linter/formatter (no ESLint/Prettier).
- Package scope `@unveiled/*`.
- Only `packages/config` in this step — no domain packages.

Current `.gitignore` only covers `.dev-plan/`, `docs/migration/`, and `.env`.

## Goals / Non-Goals

**Goals:**

- Root workspace installable via `bun install` with no application packages yet.
- `@unveiled/config` exportable presets for TypeScript and Biome that step 02+ extend without duplication.
- Root scripts stubbed for the full monorepo lifecycle (`dev`, `build`, `lint`, `typecheck`, `db:*`, `seed:demo`).
- `.gitignore` covers Bun/Node artifacts for local and CI use.

**Non-Goals:**

- Creating `apps/web` or any HonoX/HeroUI dependencies.
- CI/CD pipeline (step 05).
- Database, auth, billing, or UI packages.
- npm/yarn lockfiles or alternative package managers.

## Decisions

### 1. Root `package.json` shape

Follow the IMPLEMENTATION-PLAN example verbatim for workspaces, scripts, and catalog entries:

```json
{
  "name": "unveiled",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun --filter @unveiled/web dev",
    "build": "bun --filter @unveiled/web build",
    "lint": "biome check .",
    "typecheck": "bun run --filter '*' typecheck",
    "db:generate": "bun --filter @unveiled/db generate",
    "db:migrate": "bun --filter @unveiled/db migrate",
    "seed:demo": "bun scripts/seed-demo.ts"
  },
  "catalog": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "drizzle-orm": "^0.40.0",
    "typescript": "^5.8.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.0.0"
  }
}
```

**Rationale:** Scripts reference future packages now so root `package.json` is stable across Phase 0 steps. `dev`/`build` will fail until step 02 creates `@unveiled/web` — acceptable; `lint` and `bun install` must succeed in step 01.

**Alternative considered:** Omit `@unveiled/web` script targets until step 02. Rejected — would require editing root scripts twice and diverges from the plan.

### 2. `bunfig.toml`

Minimal workspace config:

```toml
[install]
# Hoist shared dev tools (Biome) to root node_modules
peer = true
```

No custom registry or linker overrides needed for Phase 0.

### 3. `@unveiled/config` package layout

```
packages/config/
├── package.json      # name: @unveiled/config, exports for tsconfig + biome
├── tsconfig.base.json
├── tsconfig.react.json
└── biome.json
```

`package.json` exports:

```json
{
  "name": "@unveiled/config",
  "private": true,
  "exports": {
    "./tsconfig.base.json": "./tsconfig.base.json",
    "./tsconfig.react.json": "./tsconfig.react.json",
    "./biome.json": "./biome.json"
  }
}
```

**Rationale:** Explicit `exports` lets consumers use `"extends": "@unveiled/config/tsconfig.base.json"` and root `biome.json` use `"extends": ["@unveiled/config/biome.json"]`.

### 4. TypeScript presets

**`tsconfig.base.json`** — strict baseline for all packages:

- `strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`
- `module: "ESNext"`, `moduleResolution: "Bundler"`
- `target: "ES2022"`, `lib: ["ES2022"]`
- `skipLibCheck: true`, `isolatedModules: true`
- `declaration: true`, `declarationMap: true`, `sourceMap: true`

**`tsconfig.react.json`** — extends base, adds JSX:

- `"extends": "./tsconfig.base.json"`
- `"jsx": "react-jsx"`, `"lib": ["ES2022", "DOM", "DOM.Iterable"]`

**Alternative considered:** Single tsconfig with optional JSX. Rejected — cleaner separation for future non-React packages (`@unveiled/db`).

### 5. Biome preset

**`packages/config/biome.json`:**

- Schema: Biome 2.x
- Formatter: 2-space indent, line width 100
- Linter: recommended rules enabled
- `files.ignore`: `node_modules`, `dist`, `.output`, `bun.lock`

**Root `biome.json`:**

```json
{
  "extends": ["@unveiled/config/biome.json"]
}
```

Root may add `"files.include": ["**"]` if needed so `biome check .` at repo root picks up all future workspace files.

### 6. `.gitignore` additions

Append (preserve existing entries):

```
node_modules/
dist/
.output/
.turbo/
*.tsbuildinfo
bun.lock
.env.local
.env.*.local
```

Keep existing `.env` entry. Do **not** gitignore `bun.lock` if the project policy is to commit it — IMPLEMENTATION-PLAN implies Bun lockfile on install; **commit `bun.lock`** for reproducible installs (remove from gitignore above).

**Revised decision:** Commit `bun.lock`; gitignore only `.env` variants and build artifacts, not the lockfile.

Final `.gitignore` additions:

```
node_modules/
dist/
.output/
.turbo/
*.tsbuildinfo
.env.local
.env.*.local
```

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `bun run dev` fails before step 02 | Document in tasks; only `lint` and `install` are verification gates for step 01 |
| Root `typecheck` fails with no packages | Acceptable until step 02 adds `@unveiled/web`; or add no-op `typecheck` script in `@unveiled/config` |
| Biome version drift | Pin `@biomejs/biome` in root devDependencies; catalog not used for Biome |
| Empty workspace globs | Bun tolerates missing `apps/*`; only `packages/config` exists |

## Migration Plan

1. Add all files in a single commit on branch `phase-0-foundation-01`.
2. Run `bun install` → generates `bun.lock`.
3. Run `bun run lint` → should exit 0 (config files only).
4. No rollback beyond reverting the commit; no production impact (docs-only repo today).

## Open Questions

- None blocking step 01. CI wiring deferred to step 05.
