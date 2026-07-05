# Unveiled Berlin — Agent UI Documentation

Git-tracked guides for AI agents building UI. Read these **before** implementing any page or component.

## Read order for UI tasks

| Order | Document | Purpose |
|---|---|---|
| 1 | [`../design-tokens.md`](../design-tokens.md) | Brand tokens, visual rules, theme workflow |
| 2 | [`DESIGN_TOKENS.json`](DESIGN_TOKENS.json) | Machine-readable colors, spacing, typography |
| 3 | [`DESIGN.md`](DESIGN.md) | App architecture, file layout, SSR model |
| 4 | [`COMPONENTS.md`](COMPONENTS.md) | Existing reusable components |
| 5 | [`PATTERNS.md`](PATTERNS.md) | Page layouts, routes, content, SEO |
| 6 | [`UX_RULES.md`](UX_RULES.md) | Interaction, forms, islands, accessibility |
| 7 | [`examples/`](examples/) | Future-phase page blueprints |

Also read [`../AGENTS.md`](../AGENTS.md) for hard rules and phase scope. Product detail lives in `docs/migration/` when available locally (gitignored in some checkouts).

## Current implementation status (Phase 1)

**Shipped:** guest app shell, landing, how-it-works, FAQ, membership info, 404.

**Not yet built:** discover, legal pages, auth, onboarding, events, booking, admin, partner portal, forms.

Examples in `examples/` describe **future** pages — follow them when those phases start, do not build ahead of scope.
