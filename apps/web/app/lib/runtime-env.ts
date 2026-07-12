import type { MiddlewareHandler } from "hono";

/** Runtime env keys mirrored from Cloudflare bindings or local process.env. */
export const RUNTIME_ENV_KEYS = [
  "SITE_URL",
  "DATABASE_URL",
  "AUTH_URL",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "IMAGE_PUBLIC_BASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_BASIC_BERLIN",
  "RESEND_API_KEY",
  "DAILY_CODES_FROM_EMAIL",
  "SENTRY_DSN",
  "ADMIN_PROMOTE_EMAILS",
] as const;

export type RuntimeEnvKey = (typeof RUNTIME_ENV_KEYS)[number];
export type RuntimeEnv = Partial<Record<RuntimeEnvKey, string>>;

declare global {
  // Populated per request on Workers; seeded once from process.env in local Node dev.
  var __UNVEILED_ENV__: RuntimeEnv | undefined;
}

export function setRuntimeEnv(env: RuntimeEnv | undefined): void {
  if (!env) {
    return;
  }

  const next: RuntimeEnv = { ...globalThis.__UNVEILED_ENV__ };
  for (const key of RUNTIME_ENV_KEYS) {
    const value = env[key];
    if (typeof value === "string" && value.length > 0) {
      next[key] = value;
    }
  }
  globalThis.__UNVEILED_ENV__ = next;
}

export function getEnvVar(key: RuntimeEnvKey): string | undefined {
  const fromStore = globalThis.__UNVEILED_ENV__?.[key];
  if (fromStore) {
    return fromStore;
  }

  const proc = globalThis.process as { env?: Record<string, string | undefined> } | undefined;
  return proc?.env?.[key];
}

/** Prefer Worker `c.env` bindings, then the per-request runtime store / process.env. */
export function resolveEnvVar(
  key: RuntimeEnvKey,
  bindings?: RuntimeEnv | null,
): string | undefined {
  const fromBindings = bindings?.[key];
  if (typeof fromBindings === "string" && fromBindings.length > 0) {
    return fromBindings;
  }

  return getEnvVar(key);
}

export function resolveEnvVarFromContext(
  c: { env?: RuntimeEnv | null },
  key: RuntimeEnvKey,
): string | undefined {
  return resolveEnvVar(key, c.env);
}

export function hasRuntimeAuthConfig(): boolean {
  return Boolean(getEnvVar("DATABASE_URL") && getEnvVar("AUTH_URL"));
}

/** Used by shared packages that expect a NodeJS.ProcessEnv-shaped object. */
export function getRuntimeProcessEnv(): NodeJS.ProcessEnv {
  return (globalThis.__UNVEILED_ENV__ ?? {}) as NodeJS.ProcessEnv;
}

export function seedRuntimeEnvFromProcess(): void {
  const proc = globalThis.process as { env?: Record<string, string | undefined> } | undefined;
  if (!proc?.env) {
    return;
  }

  const seeded: RuntimeEnv = {};
  for (const key of RUNTIME_ENV_KEYS) {
    const value = proc.env[key];
    if (typeof value === "string" && value.length > 0) {
      seeded[key] = value;
    }
  }
  setRuntimeEnv(seeded);
}

export const runtimeEnvMiddleware: MiddlewareHandler<{ Bindings: RuntimeEnv }> = async (
  c,
  next,
) => {
  setRuntimeEnv(c.env);
  await next();
};
