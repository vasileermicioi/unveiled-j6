/**
 * ESM shim for `qs` during Vite SSR. Stripe's ESM build imports CJS `qs`, which
 * calls `require` and blows up in Vite's module runner (`require is not defined`).
 * Workers production build uses wrangler bundling; this alias is for local Vite SSR.
 */

function serializeValue(value, serializeDate) {
  if (value == null) {
    return "";
  }
  if (value instanceof Date) {
    return serializeDate ? serializeDate(value) : value.toISOString();
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  return String(value);
}

function flatten(prefix, value, serializeDate, arrayFormat, out) {
  if (value == null) {
    out.push([prefix, ""]);
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const key =
        arrayFormat === "repeat" ? prefix : arrayFormat === "indices" ? `${prefix}[${i}]` : prefix;
      flatten(key, value[i], serializeDate, arrayFormat, out);
    }
    return;
  }
  if (typeof value === "object" && !(value instanceof Date)) {
    for (const [k, v] of Object.entries(value)) {
      flatten(prefix ? `${prefix}[${k}]` : k, v, serializeDate, arrayFormat, out);
    }
    return;
  }
  out.push([prefix, serializeValue(value, serializeDate)]);
}

export function stringify(data, options = {}) {
  const serializeDate = options.serializeDate;
  const arrayFormat = options.arrayFormat ?? "indices";
  const pairs = [];
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      flatten(key, value, serializeDate, arrayFormat, pairs);
    }
  }
  return pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

export function parse(input) {
  const params = new URLSearchParams(typeof input === "string" ? input : "");
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

const qs = { stringify, parse };
export default qs;
