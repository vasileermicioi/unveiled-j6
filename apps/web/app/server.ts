import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";

import { authProxyHandler } from "./lib/auth-proxy";
import { outerAppErrorHandler } from "./lib/error-response";
import {
  type RuntimeEnv,
  resolveEnvVarFromContext,
  runtimeEnvMiddleware,
  seedRuntimeEnvFromProcess,
} from "./lib/runtime-env";
import { buildSentryOptions, Sentry } from "./lib/sentry";
import { stripeWebhookHandler } from "./lib/stripe-webhook";

seedRuntimeEnvFromProcess();

const mainApp = createApp();
const app = new Hono<{ Bindings: RuntimeEnv }>();

app.use("*", runtimeEnvMiddleware);
app.onError(outerAppErrorHandler);

app.get("/api/health/runtime", (c) => {
  const keys = ["AUTH_URL", "DATABASE_URL", "SITE_URL"] as const;
  return c.json({
    configured: Object.fromEntries(
      keys.map((key) => [key, Boolean(resolveEnvVarFromContext(c, key))]),
    ),
  });
});

// Gated smoke endpoint for branded 500 / Sentry — never enable in production without the flag.
app.get("/api/health/error", (c) => {
  const proc = globalThis.process as { env?: Record<string, string | undefined> } | undefined;
  if (proc?.env?.ENABLE_ERROR_SMOKE !== "1") {
    return c.json({ error: "Not Found" }, 404);
  }
  throw new Error("Controlled smoke error");
});

// Register before locale catch-all (`/:locale/*` would otherwise match `/api/...`).
app.all("/api/auth/*", authProxyHandler);
app.post("/api/webhooks/stripe", stripeWebhookHandler);
app.route("/", mainApp);

showRoutes(app);

export default Sentry.withSentry((env: RuntimeEnv) => buildSentryOptions(env), app);
