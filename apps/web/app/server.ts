import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";

import { authProxyHandler } from "./lib/auth-proxy";
import { type RuntimeEnv, runtimeEnvMiddleware, seedRuntimeEnvFromProcess } from "./lib/runtime-env";

seedRuntimeEnvFromProcess();

const mainApp = createApp();
const app = new Hono<{ Bindings: RuntimeEnv }>();

app.use("*", runtimeEnvMiddleware);

// Register before locale catch-all (`/:locale/*` would otherwise match `/api/...`).
app.all("/api/auth/*", authProxyHandler);
app.route("/", mainApp);

showRoutes(app);

export default app;
