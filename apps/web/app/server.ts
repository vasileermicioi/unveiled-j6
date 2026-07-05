import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";

import { authProxyHandler } from "./lib/auth-proxy";

const mainApp = createApp();
const app = new Hono();

// Register before locale catch-all (`/:locale/*` would otherwise match `/api/...`).
app.all("/api/auth/*", authProxyHandler);
app.route("/", mainApp);

showRoutes(app);

export default app;
