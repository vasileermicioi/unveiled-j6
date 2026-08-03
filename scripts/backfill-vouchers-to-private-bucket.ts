/**
 * One-shot backfill: copy `vouchers/` keys from the public catalog bucket
 * into the private assets bucket. Idempotent — skips keys that already exist
 * in the private bucket. Does not delete public sources (optional operator cleanup).
 *
 * Usage:
 *   bun scripts/backfill-vouchers-to-private-bucket.ts
 *   bun scripts/backfill-vouchers-to-private-bucket.ts --dry-run
 *
 * Requires public S3_* + S3_PRIVATE_BUCKET (optional S3_PRIVATE_* overrides).
 * Prefer staging dry-run before production. App download stays private-only
 * (no dual-read) — run this before expecting historical PDF downloads to work.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";

import {
  createPrivateS3Client,
  createS3Client,
  readPrivateS3Env,
  readS3Env,
} from "../packages/images/src/s3.ts";

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

const PREFIX = "vouchers/";
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
      if (item.Key && !item.Key.endsWith("/")) {
        keys.push(item.Key);
      }
    }
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

async function objectExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    const name =
      error && typeof error === "object" && "name" in error
        ? String((error as { name: unknown }).name)
        : "";
    const status =
      error && typeof error === "object" && "$metadata" in error
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
        : undefined;
    if (name === "NotFound" || name === "NoSuchKey" || status === 404) {
      return false;
    }
    throw error;
  }
}

async function copyKey(
  publicClient: S3Client,
  privateClient: S3Client,
  publicBucket: string,
  privateBucket: string,
  key: string,
): Promise<void> {
  const getResult = await publicClient.send(
    new GetObjectCommand({ Bucket: publicBucket, Key: key }),
  );
  if (!getResult.Body) {
    throw new Error(`Empty body for ${key}`);
  }
  const body = await getResult.Body.transformToByteArray();
  await privateClient.send(
    new PutObjectCommand({
      Bucket: privateBucket,
      Key: key,
      Body: body,
      ContentType: getResult.ContentType ?? "application/pdf",
    }),
  );
}

async function main(): Promise<void> {
  const publicEnv = readS3Env();
  const privateEnv = readPrivateS3Env();

  if (publicEnv.bucket === privateEnv.bucket) {
    throw new Error(`S3_BUCKET and S3_PRIVATE_BUCKET must differ (both are "${publicEnv.bucket}")`);
  }

  const publicClient = createS3Client(publicEnv);
  const privateClient = createPrivateS3Client(privateEnv);

  console.log(
    `${dryRun ? "[dry-run] " : ""}Backfill ${PREFIX}* from s3://${publicEnv.bucket} → s3://${privateEnv.bucket}`,
  );

  const keys = await listAllKeys(publicClient, publicEnv.bucket, PREFIX);
  console.log(`Found ${keys.length} key(s) under ${PREFIX} in public bucket`);

  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for (const key of keys) {
    try {
      const exists = await objectExists(privateClient, privateEnv.bucket, key);
      if (exists) {
        skipped += 1;
        console.log(`skip (exists) ${key}`);
        continue;
      }

      if (dryRun) {
        copied += 1;
        console.log(`[dry-run] copy ${key}`);
        continue;
      }

      await copyKey(publicClient, privateClient, publicEnv.bucket, privateEnv.bucket, key);
      copied += 1;
      console.log(`copied ${key}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`failed ${key}: ${message}`);
    }
  }

  console.log(`\nDone. copied=${copied} skipped=${skipped} failed=${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

await main();
