/**
 * ESM shim for `style-to-js` during Vite SSR. The published package is CJS-only
 * (`require("style-to-object")`), which blows up in Vite's module runner
 * (`require is not defined`). Used by `hast-util-to-jsx-runtime` → `react-markdown`
 * for HTML `style=""` attributes. We do not enable `rehype-raw`, so event Markdown
 * never emits inline styles — returning `{}` is sufficient for local Vite SSR.
 */

export default function styleToJs(_style, _options) {
  return {};
}
