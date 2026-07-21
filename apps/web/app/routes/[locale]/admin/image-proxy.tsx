import { fetchRemoteImageBytes, ImageValidationError } from "@unveiled/images";
import { createRoute } from "honox/factory";

import { guardAdminRoute } from "../../../lib/admin-route";

function readUrlFromBody(body: Record<string, string | File | (string | File)[]>): string {
  const value = body.url;
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first.trim() : "";
  }
  return "";
}

/**
 * ADMIN-only bytes proxy for remote image URLs.
 * Returns raw image bytes for client-side Pica — does not mutate catalog state.
 */
export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const contentType = c.req.header("content-type") ?? "";
  let url = "";

  try {
    if (contentType.includes("application/json")) {
      const json = (await c.req.json()) as { url?: unknown };
      url = typeof json.url === "string" ? json.url.trim() : "";
    } else {
      const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
      url = readUrlFromBody(body);
    }
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!url) {
    return c.json({ error: "url is required" }, 400);
  }

  try {
    const fetched = await fetchRemoteImageBytes(url);
    const body = Uint8Array.from(fetched.bytes);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": fetched.contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message =
      error instanceof ImageValidationError ? error.message : "Failed to fetch remote image URL";
    return c.json({ error: message }, 400);
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }
  return c.json({ error: "Method not allowed" }, 405);
});
