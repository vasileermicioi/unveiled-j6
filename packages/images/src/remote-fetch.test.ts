import { describe, expect, test } from "bun:test";

import { ImageValidationError } from "./errors";
import { assertSafeRemoteImageUrl } from "./remote-fetch";

describe("assertSafeRemoteImageUrl", () => {
  test("accepts https public hosts", () => {
    expect(assertSafeRemoteImageUrl("https://example.com/photo.jpg").hostname).toBe("example.com");
  });

  test("rejects non-http protocols", () => {
    expect(() => assertSafeRemoteImageUrl("file:///tmp/x.jpg")).toThrow(ImageValidationError);
  });

  test("rejects localhost and private IPv4", () => {
    expect(() => assertSafeRemoteImageUrl("http://localhost/a.jpg")).toThrow(ImageValidationError);
    expect(() => assertSafeRemoteImageUrl("http://127.0.0.1/a.jpg")).toThrow(ImageValidationError);
    expect(() => assertSafeRemoteImageUrl("http://192.168.1.10/a.jpg")).toThrow(
      ImageValidationError,
    );
    expect(() => assertSafeRemoteImageUrl("http://10.0.0.2/a.jpg")).toThrow(ImageValidationError);
  });
});
