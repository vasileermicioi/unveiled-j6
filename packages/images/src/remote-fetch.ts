import {
  ACCEPTED_MIME_TYPES,
  type AcceptedMimeType,
  MAX_UPLOAD_BYTES,
  REMOTE_FETCH_TIMEOUT_MS,
} from "./constants";
import { ImageValidationError, validateRemoteContentType } from "./errors";

export const REMOTE_IMAGE_USER_AGENT =
  "UnveiledBerlin/1.0 (image pipeline; contact: support@unveiled.berlin)";

export type FetchedRemoteImage = {
  bytes: Uint8Array;
  contentType: AcceptedMimeType;
  finalUrl: string;
};

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal", "metadata.goog"]);

function isIpv4(hostname: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function parseIpv4(hostname: string): number[] | null {
  if (!isIpv4(hostname)) {
    return null;
  }
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }
  return parts;
}

/** Reject obvious local / link-local / metadata targets (hostname + literal IPv4). */
export function assertSafeRemoteImageUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ImageValidationError("Invalid remote image URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ImageValidationError("Remote image URL must use http or https");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname) {
    throw new ImageValidationError("Invalid remote image URL");
  }

  if (
    hostname === "0.0.0.0" ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost")
  ) {
    throw new ImageValidationError("Remote image URL host is not allowed");
  }

  if (hostname === "::1" || hostname.startsWith("[")) {
    throw new ImageValidationError("Remote image URL host is not allowed");
  }

  const ipv4 = parseIpv4(hostname);
  if (ipv4) {
    const a = ipv4[0] ?? 0;
    const b = ipv4[1] ?? 0;
    const isPrivate =
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168);
    if (isPrivate) {
      throw new ImageValidationError("Remote image URL host is not allowed");
    }
  }

  return parsed;
}

/**
 * Server-side fetch of remote image bytes for the admin bytes proxy.
 * Does not resize — returns raw bytes after size/type checks.
 */
export async function fetchRemoteImageBytes(rawUrl: string): Promise<FetchedRemoteImage> {
  const safeUrl = assertSafeRemoteImageUrl(rawUrl);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      fetch(safeUrl.toString(), {
        redirect: "follow",
        headers: {
          "User-Agent": REMOTE_IMAGE_USER_AGENT,
        },
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new ImageValidationError("Timed out fetching remote image URL"));
        }, REMOTE_FETCH_TIMEOUT_MS);
      }),
    ]);

    if (!response.ok) {
      throw new ImageValidationError(`Failed to fetch image URL (${response.status})`);
    }

    // Re-check final URL after redirects.
    assertSafeRemoteImageUrl(response.url || safeUrl.toString());

    const contentType = validateRemoteContentType(response.headers.get("content-type"));
    const contentLengthHeader = response.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number.parseInt(contentLengthHeader, 10);
      if (!Number.isNaN(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
        throw new ImageValidationError(`Image exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes`);
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new ImageValidationError("Image file is empty");
    }
    if (arrayBuffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new ImageValidationError(`Image exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes`);
    }

    return {
      bytes: new Uint8Array(arrayBuffer),
      contentType,
      finalUrl: response.url || safeUrl.toString(),
    };
  } catch (error) {
    if (error instanceof ImageValidationError) {
      throw error;
    }
    throw new ImageValidationError("Failed to fetch remote image URL");
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export function isAcceptedImageContentType(contentType: string | null): boolean {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  return ACCEPTED_MIME_TYPES.includes(normalized as AcceptedMimeType);
}
