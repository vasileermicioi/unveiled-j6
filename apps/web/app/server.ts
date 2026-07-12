import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";

import { authProxyHandler } from "./lib/auth-proxy";
import {
  type RuntimeEnv,
  resolveEnvVarFromContext,
  runtimeEnvMiddleware,
  seedRuntimeEnvFromProcess,
} from "./lib/runtime-env";
import { stripeWebhookHandler } from "./lib/stripe-webhook";

seedRuntimeEnvFromProcess();

const mainApp = createApp();
const app = new Hono<{ Bindings: RuntimeEnv }>();

app.use("*", runtimeEnvMiddleware);

app.get("/api/health/runtime", (c) => {
  const keys = ["AUTH_URL", "DATABASE_URL", "SITE_URL"] as const;
  return c.json({
    configured: Object.fromEntries(
      keys.map((key) => [key, Boolean(resolveEnvVarFromContext(c, key))]),
    ),
  });
});

// Register before locale catch-all (`/:locale/*` would otherwise match `/api/...`).
app.all("/api/auth/*", authProxyHandler);
app.post("/api/webhooks/stripe", stripeWebhookHandler);
app.route("/", mainApp);

showRoutes(app);

export default app;
