## 1. Pre-flight

- [x] 1.1 Confirm step 01 artifacts exist (`package.json`, `packages/config/*`, `bunfig.toml`)
- [x] 1.2 Read `proposal.md`, `design.md`, and `specs/platform-foundation/spec.md`
- [x] 1.3 Confirm no existing `apps/web` directory conflicts

## 2. Package scaffold

- [x] 2.1 Create `apps/web/package.json` (`@unveiled/web`) with `dev`, `build`, `start`, `typecheck` scripts and dependencies per design
- [x] 2.2 Create `apps/web/tsconfig.json` extending `@unveiled/config/tsconfig.react.json` with `jsxImportSource: "react"`
- [x] 2.3 Create empty `apps/web/public/` directory (add `.gitkeep` if needed)

## 3. HonoX app structure

- [x] 3.1 Create `apps/web/vite.config.ts` with `@hono/vite-build/node`, `@hono/vite-dev-server/node`, honox plugin, and React SSR externals per design
- [x] 3.2 Create `apps/web/app/server.ts` with `createApp()` entry
- [x] 3.3 Create `apps/web/app/global.d.ts` with `@hono/react-renderer` Props augmentation
- [x] 3.4 Create `apps/web/app/routes/_renderer.tsx` using `reactRenderer` (minimal HTML shell, no client script)
- [x] 3.5 Create `apps/web/app/routes/index.tsx` with scaffold page ("Unveiled Berlin — scaffold")

## 4. Install and wire-up

- [x] 4.1 Run `bun install` from repository root — workspace resolves `@unveiled/web`
- [x] 4.2 Confirm root scripts (`dev`, `build`, `typecheck`) target `@unveiled/web` without further root `package.json` edits

## 5. Validation

- [x] 5.1 Run `bun run dev` — dev server starts; `curl -s http://localhost:<port>/` returns HTML containing "Unveiled Berlin — scaffold"
- [x] 5.2 Run `bun run build` — completes without errors; `dist/index.js` exists
- [x] 5.3 Run `bun run typecheck` — passes for `@unveiled/web` and root filter
- [x] 5.4 Run `bun run lint` — Biome exits 0 with new `apps/web` files included
- [x] 5.5 Smoke-test production start: `cd apps/web/dist && node index.js` serves scaffold page

## 6. Wrap-up

- [ ] 6.1 Commit on branch `phase-0-foundation-02` (or parent `phase-0-foundation`)
- [ ] 6.2 Mark step 02 done in parent iteration guide when merged
