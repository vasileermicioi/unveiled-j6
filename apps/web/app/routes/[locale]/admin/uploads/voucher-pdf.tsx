import { uploadPrivateObject } from "@unveiled/images";
import { createRoute } from "honox/factory";

import { guardAdminRoute } from "../../../../lib/admin-route";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

function readOptionalString(
  body: Record<string, string | File | (string | File)[]>,
  key: string,
): string | null {
  const value = body[key];
  if (typeof value === "string") {
    return value.trim() || null;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first.trim() || null : null;
  }
  return null;
}

function isUploadBlob(value: unknown): value is File | Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).size === "number"
  );
}

function readFile(
  body: Record<string, string | File | (string | File)[]>,
  key: string,
): File | Blob | null {
  const value = body[key];
  if (isUploadBlob(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return isUploadBlob(first) ? first : null;
  }
  return null;
}

/**
 * ADMIN-only staging upload for a single sliced voucher PDF.
 * Returns `{ objectKey, originalFilename?, pageLabel? }` — does not write inventory rows.
 */
export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  let body: Record<string, string | File | (string | File)[]>;
  try {
    body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
  } catch {
    return c.json({ error: "Invalid multipart body" }, 400);
  }

  const file = readFile(body, "file");
  if (!file || file.size === 0) {
    return c.json({ error: "file is required" }, 400);
  }
  if (file.size > MAX_PDF_BYTES) {
    return c.json({ error: "PDF exceeds 20MB limit" }, 400);
  }

  const contentType =
    ("type" in file && typeof file.type === "string" ? file.type : "") || "application/pdf";
  if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
    return c.json({ error: "file must be a PDF" }, 400);
  }

  const pageLabel = readOptionalString(body, "pageLabel");
  const originalFilename =
    readOptionalString(body, "originalFilename") ||
    ("name" in file && typeof file.name === "string" ? file.name || null : null);
  const eventId = readOptionalString(body, "eventId");

  const bytes = Buffer.from(await file.arrayBuffer());
  const objectKey = eventId
    ? `vouchers/${eventId}/${crypto.randomUUID()}.pdf`
    : `vouchers/staging/${guard.session.user.id}/${crypto.randomUUID()}.pdf`;

  try {
    await uploadPrivateObject({
      objectKey,
      body: bytes,
      contentType: "application/pdf",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return c.json({ error: message }, 500);
  }

  return c.json({
    objectKey,
    originalFilename,
    pageLabel,
  });
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }
  return c.json({ error: "Method not allowed" }, 405);
});
