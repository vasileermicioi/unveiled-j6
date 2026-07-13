import * as Sentry from "@sentry/cloudflare";

import { getEnvVar, type RuntimeEnv } from "./runtime-env";

export type SentryOptions = {
  dsn?: string;
  enabled?: boolean;
  sendDefaultPii?: boolean;
  tracesSampleRate?: number;
};

/** Build Cloudflare Worker Sentry options. Empty DSN → disabled (no throw). */
export function buildSentryOptions(env?: RuntimeEnv | null): SentryOptions {
  const dsn =
    (typeof env?.SENTRY_DSN === "string" && env.SENTRY_DSN.length > 0
      ? env.SENTRY_DSN
      : undefined) ?? getEnvVar("SENTRY_DSN");

  if (!dsn) {
    return { enabled: false };
  }

  return {
    dsn,
    enabled: true,
    sendDefaultPii: false,
    // Error reporting only for this step — no performance sampling required.
    tracesSampleRate: 0,
  };
}

/** Capture when the SDK is active; no-op when DSN unset / not initialized. */
export function captureServerException(error: unknown): void {
  try {
    Sentry.captureException(error);
  } catch {
    // Never let monitoring break the error response path.
  }
}

export { Sentry };
