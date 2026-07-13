import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

import { outerAppErrorHandler } from "./error-response";

describe("outerAppErrorHandler", () => {
  test("returns JSON 500 for /api paths without stack traces", async () => {
    const app = new Hono();
    app.onError(outerAppErrorHandler);
    app.get("/api/health/error", () => {
      throw new Error("Controlled smoke error");
    });

    const res = await app.request("/api/health/error");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Internal Server Error" });
    const text = JSON.stringify(body);
    expect(text.includes("Controlled smoke")).toBe(false);
    expect(text.includes("at ")).toBe(false);
  });

  test("returns plain text 500 when render is unavailable", async () => {
    const app = new Hono();
    app.onError(outerAppErrorHandler);
    app.get("/de/boom", () => {
      throw new Error("Controlled smoke error");
    });

    const res = await app.request("/de/boom");
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe("Internal Server Error");
    expect(text.includes("Controlled smoke")).toBe(false);
  });
});
