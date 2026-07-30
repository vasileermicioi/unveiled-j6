import { describe, expect, test } from "bun:test";

import { normalizeS3Endpoint, readS3Env } from "./s3";

describe("normalizeS3Endpoint", () => {
  test("strips Cloudflare R2 bucket path copied from the dashboard", () => {
    expect(normalizeS3Endpoint("https://abc123.r2.cloudflarestorage.com/unveiled-july")).toBe(
      "https://abc123.r2.cloudflarestorage.com",
    );
  });

  test("strips trailing slash and nested path", () => {
    expect(normalizeS3Endpoint("https://abc123.r2.cloudflarestorage.com/unveiled-july/")).toBe(
      "https://abc123.r2.cloudflarestorage.com",
    );
  });

  test("keeps host-only endpoint unchanged", () => {
    expect(normalizeS3Endpoint("https://abc123.r2.cloudflarestorage.com")).toBe(
      "https://abc123.r2.cloudflarestorage.com",
    );
  });

  test("preserves non-default port", () => {
    expect(normalizeS3Endpoint("http://127.0.0.1:9000/my-bucket")).toBe("http://127.0.0.1:9000");
  });
});

describe("readS3Env", () => {
  test("normalizes endpoint when reading env", () => {
    const env = readS3Env({
      S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com/unveiled-july",
      S3_REGION: "auto",
      S3_BUCKET: "unveiled-july",
      S3_ACCESS_KEY_ID: "key",
      S3_SECRET_ACCESS_KEY: "secret",
    });

    expect(env.endpoint).toBe("https://abc123.r2.cloudflarestorage.com");
    expect(env.bucket).toBe("unveiled-july");
  });
});
