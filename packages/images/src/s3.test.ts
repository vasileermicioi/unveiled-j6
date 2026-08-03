import { describe, expect, test } from "bun:test";

import { normalizeS3Endpoint, readPrivateS3Env, readS3Env } from "./s3";

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

const publicS3Env = {
  S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com/unveiled-july",
  S3_REGION: "auto",
  S3_BUCKET: "unveiled-july",
  S3_ACCESS_KEY_ID: "public-key",
  S3_SECRET_ACCESS_KEY: "public-secret",
} as const;

describe("readPrivateS3Env", () => {
  test("requires S3_PRIVATE_BUCKET", () => {
    expect(() => readPrivateS3Env({ ...publicS3Env })).toThrow(
      "S3_PRIVATE_BUCKET is required for private object storage",
    );
  });

  test("uses shared public credentials with distinct private bucket", () => {
    const env = readPrivateS3Env({
      ...publicS3Env,
      S3_PRIVATE_BUCKET: "unveiled-private",
    });

    expect(env.bucket).toBe("unveiled-private");
    expect(env.endpoint).toBe("https://abc123.r2.cloudflarestorage.com");
    expect(env.region).toBe("auto");
    expect(env.accessKeyId).toBe("public-key");
    expect(env.secretAccessKey).toBe("public-secret");
  });

  test("applies per-field private overrides and falls back for unset fields", () => {
    const env = readPrivateS3Env({
      ...publicS3Env,
      S3_PRIVATE_BUCKET: "unveiled-private",
      S3_PRIVATE_ENDPOINT: "https://private.example.com/other-bucket",
      S3_PRIVATE_ACCESS_KEY_ID: "private-key",
    });

    expect(env.bucket).toBe("unveiled-private");
    expect(env.endpoint).toBe("https://private.example.com");
    expect(env.region).toBe("auto");
    expect(env.accessKeyId).toBe("private-key");
    expect(env.secretAccessKey).toBe("public-secret");
  });

  test("throws when credentials cannot be resolved after fallback", () => {
    expect(() =>
      readPrivateS3Env({
        S3_PRIVATE_BUCKET: "unveiled-private",
      }),
    ).toThrow(/Private S3 requires endpoint, region, and credentials/);
  });
});
