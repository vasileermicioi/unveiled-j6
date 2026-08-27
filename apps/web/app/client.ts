import { createClient } from "honox/client";
import { filterByPattern } from "honox/client/utils/filter";

// Exclude *.test.tsx: HonoX globs every islands/**/*.tsx into the client bundle.
const islandFiles = filterByPattern(
  {
    ...import.meta.glob(["/app/islands/**/*.tsx", "!/app/islands/**/*.test.tsx"]),
    ...import.meta.glob("/app/**/*.island.tsx"),
    ...import.meta.glob("/app/**/$*.tsx"),
  },
  [/\/[a-zA-Z0-9-]+\.tsx$/, /\/_[a-zA-Z0-9-]+\.island\.tsx$/, /\/\$[a-zA-Z0-9-]+\.tsx$/],
);

createClient({
  ISLAND_FILES: islandFiles,
  // Islands are SSR'd inside <honox-island> for no-JS fallback, then client-mounted
  // with createRoot().render(). hydrateRoot mismatches React Aria auto-IDs between
  // the externalized SSR bundle and the Vite client bundle.
  hydrate: async (elem, root) => {
    const [{ createRoot }, { SSRProvider }, { createElement }] = await Promise.all([
      import("react-dom/client"),
      import("@react-aria/ssr"),
      import("react"),
    ]);

    createRoot(root).render(createElement(SSRProvider, null, elem));
  },
  createElement: async (type: unknown, props: unknown) => {
    const { createElement } = await import("react");
    const normalizedType =
      typeof type === "string" && type === type.toUpperCase() && type !== type.toLowerCase()
        ? type.toLowerCase()
        : type;
    return createElement(normalizedType as never, props as never);
  },
});
