import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

import { requireAuth } from "./guards";
import type { AuthOptions } from "./types";

describe("requireAuth", () => {
  test("returns 401 when no session exists", async () => {
    const options: AuthOptions = {
      authUrl: "http://127.0.0.1:9",
      db: {} as AuthOptions["db"],
    };

    const app = new Hono();
    app.get("/protected", requireAuth(options), (c) => c.json({ ok: true }));

    const response = await app.request("/protected");
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
