/**
 * Server/script-only seed API (loads local image buffers).
 * Do not import from client islands / browser bundles.
 *
 * For titles only (e2e), prefer `@unveiled/db/seed-titles`.
 */

export {
  DEMO_DISCOVERY_TITLES,
  partnerNameForSeedTitle,
} from "./catalog/demo-discovery-titles";
export {
  type DemoSeedResult,
  resetCatalogData,
  runDemoSeed,
  shouldRunDemoSeed,
} from "./catalog/seed";
export {
  buildDemoEvents,
  DEMO_CATALOG,
  DEMO_PARTNERS,
  type DemoCatalogEntry,
  getDemoCatalog,
} from "./catalog/seed-data";
