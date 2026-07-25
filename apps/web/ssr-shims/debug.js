/**
 * ESM shim for `debug` during Vite SSR. The published package is CJS
 * (`module.exports = require(...)`), which throws `module is not defined` in
 * Vite's ESM module runner. Used by micromark (via react-markdown) for optional
 * tokenizer tracing — a no-op logger is fine in local Vite SSR.
 */

function createDebug() {
  const log = () => {};
  log.enabled = false;
  log.color = "";
  log.diff = 0;
  log.log = () => {};
  log.destroy = () => true;
  log.extend = () => createDebug();
  return log;
}

export default function debug(_namespace) {
  return createDebug();
}
