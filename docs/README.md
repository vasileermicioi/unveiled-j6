# Unveiled Berlin — Agent UI Documentation

Git-tracked guides for AI agents building UI. Read these **before** implementing any page or component.

## Read order for UI tasks

| Order | Document | Purpose |
|---|---|---|
| 1 | [`../DESIGN.md`](../DESIGN.md) | Visual identity (Google Labs DESIGN.md format) |
| 2 | [`product/ui/design-tokens.md`](product/ui/design-tokens.md) | Brand tokens narrative / HeroUI mapping |
| 3 | [`DESIGN_TOKENS.json`](DESIGN_TOKENS.json) | Machine-readable colors, spacing, typography |
| 4 | [`DESIGN.md`](DESIGN.md) | App architecture, file layout, SSR model |
| 5 | [`COMPONENTS.md`](COMPONENTS.md) | Existing reusable components |
| 6 | [`PATTERNS.md`](PATTERNS.md) | Page layouts, routes, content, SEO |
| 7 | [`UX_RULES.md`](UX_RULES.md) | Interaction, forms, islands, accessibility |
| 8 | [`examples/`](examples/) | Future-phase page blueprints |

Also read [`../AGENTS.md`](../AGENTS.md) for hard rules and phase scope. Product detail lives in [`docs/product/`](../product/README.md) (active SoT). Delivery plan: [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](../../.dev-plan/IMPLEMENTATION-PLAN.mvp.md).

## Current implementation status (Phase 1)

**Shipped:** guest app shell, discover (home), how-it-works, FAQ, membership info, 404.

**Not yet built:** discover, legal pages, auth, onboarding, events, booking, admin, partner portal, forms.

Examples in `examples/` describe **future** pages — follow them when those phases start, do not build ahead of scope.
