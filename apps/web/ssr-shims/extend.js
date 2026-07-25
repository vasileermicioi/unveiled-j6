/**
 * ESM shim for `extend` during Vite SSR. The published package is CJS
 * (`module.exports = …`), which throws `module is not defined` in Vite's ESM
 * module runner. Used by `unified` for deep-merging processor data/settings.
 */

function isPlainObject(value) {
  return Boolean(value) && Object.prototype.toString.call(value) === "[object Object]";
}

function extend(...args) {
  let deep = false;
  let target;
  let i = 0;

  if (typeof args[0] === "boolean") {
    deep = args[0];
    i = 1;
  }

  target = args[i];
  i += 1;

  if (!isPlainObject(target) && typeof target !== "function") {
    target = {};
  }

  for (; i < args.length; i++) {
    const source = args[i];
    if (source == null) {
      continue;
    }
    for (const key of Object.keys(source)) {
      const src = target[key];
      const copy = source[key];
      if (target === copy) {
        continue;
      }
      if (deep && copy && (isPlainObject(copy) || Array.isArray(copy))) {
        let clone = src;
        if (Array.isArray(copy)) {
          clone = Array.isArray(src) ? src : [];
        } else if (!isPlainObject(src)) {
          clone = {};
        }
        target[key] = extend(true, clone, copy);
      } else if (copy !== undefined) {
        target[key] = copy;
      }
    }
  }

  return target;
}

export default extend;
