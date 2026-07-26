/**
 * Offline migration: regenerate five WebP variants from the largest available
 * legacy JPEG per `images/{id}/`, upload WebP, then delete `.jpg` keys.
 *
 * Usage:
 *   bun scripts/migrate-r2-jpeg-to-webp.ts
 *   bun scripts/migrate-r2-jpeg-to-webp.ts --dry-run
 *
 * Requires S3_* env vars (same as seed/upload). Prefer running against staging
 * before production. Two-phase per id: upload all WebP first, then delete JPEGs.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  type S3Client,
} from "@aws-sdk/client-s3";

import {
  LEGACY_JPEG_VARIANT_FILENAMES,
  VARIANT_FILENAMES,
} from "../packages/images/src/constants.ts";
import { bufferToPrebuiltVariants } from "../packages/images/src/offline/index.ts";
import { createS3Client, readS3Env, uploadImageVariants } from "../packages/images/src/s3.ts";

function loadRootEnv(): void {
  const envPath = resolve(import.meta.dir, "../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadRootEnv();

const JPEG_PREFERENCE = [
  "original.jpg",
  "hero-1920.jpg",
  "large-1280.jpg",
  "medium-640.jpg",
  "small-320.jpg",
  "og-1200x630.jpg",
] as const;

const dryRun = process.argv.includes("--dry-run");

async function listAllKeys(client: S3Client, bucket: string, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const item of result.Contents ?? []) {
      if (item.Key) {
        keys.push(item.Key);
      }
    }
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

async function getObjectBuffer(client: S3Client, bucket: string, key: string): Promise<Buffer> {
  const result = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
  const body = result.Body;
  if (!body) {
    throw new Error(`Empty body for ${key}`);
  }
  const bytes = await body.transformToByteArray();
  return Buffer.from(bytes);
}

function groupJpegKeysByImageId(keys: string[]): Map<string, string[]> {
  const byId = new Map<string, string[]>();
  for (const key of keys) {
    const match = /^images\/([^/]+)\/(.+\.jpg)$/.exec(key);
    if (!match) continue;
    const imageId = match[1];
    const filename = match[2];
    if (!imageId || !filename) continue;
    const list = byId.get(imageId) ?? [];
    list.push(filename);
    byId.set(imageId, list);
  }
  return byId;
}

function pickLargestJpeg(filenames: string[]): string | null {
  for (const preferred of JPEG_PREFERENCE) {
    if (filenames.includes(preferred)) {
      return preferred;
    }
  }
  return filenames.find((name) => name.endsWith(".jpg")) ?? null;
}

async function migrateOne(
  client: S3Client,
  bucket: string,
  imageId: string,
  jpegFilenames: string[],
): Promise<void> {
  const sourceName = pickLargestJpeg(jpegFilenames);
  if (!sourceName) {
    console.warn(`skip ${imageId}: no JPEG source`);
    return;
  }

  const sourceKey = `images/${imageId}/${sourceName}`;
  console.log(`${dryRun ? "[dry-run] " : ""}migrate ${imageId} from ${sourceName}`);

  if (dryRun) {
    return;
  }

  const jpeg = await getObjectBuffer(client, bucket, sourceKey);
  const prebuilt = await bufferToPrebuiltVariants(jpeg, {
    source: "UPLOAD",
    imageId,
  });

  await uploadImageVariants(imageId, prebuilt.variants, client, bucket);

  const jpgKeys = [...new Set([...jpegFilenames, ...LEGACY_JPEG_VARIANT_FILENAMES])]
    .filter((name) => name.endsWith(".jpg"))
    .map((name) => ({ Key: `images/${imageId}/${name}` }));

  if (jpgKeys.length > 0) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: jpgKeys },
      }),
    );
  }

  const missing = VARIANT_FILENAMES.filter((name) => !prebuilt.variants[name]);
  if (missing.length > 0) {
    throw new Error(`missing webp variants after migrate ${imageId}: ${missing.join(", ")}`);
  }
}

async function main(): Promise<void> {
  const env = readS3Env();
  const client = createS3Client(env);
  const keys = await listAllKeys(client, env.bucket, "images/");
  const byId = groupJpegKeysByImageId(keys);

  if (byId.size === 0) {
    console.log("No legacy JPEG objects found under images/ — nothing to migrate.");
    return;
  }

  console.log(`Found ${byId.size} image id(s) with JPEG keys${dryRun ? " (dry-run)" : ""}.`);

  let ok = 0;
  let failed = 0;
  for (const [imageId, filenames] of byId) {
    try {
      await migrateOne(client, env.bucket, imageId, filenames);
      ok += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAILED ${imageId}: ${message}`);
    }
  }

  console.log(`Done. migrated=${ok} failed=${failed}${dryRun ? " (dry-run)" : ""}`);
  if (failed > 0) {
    process.exit(1);
  }
}

await main();
