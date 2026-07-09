import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";

import { VARIANT_FILENAMES, type VariantFilename } from "./constants";
import { resolveRuntimeEnv } from "./resolve-runtime-env";

export type S3Env = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function readS3Env(env: NodeJS.ProcessEnv = resolveRuntimeEnv()): S3Env {
  const endpoint = env.S3_ENDPOINT;
  const region = env.S3_REGION;
  const bucket = env.S3_BUCKET;
  const accessKeyId = env.S3_ACCESS_KEY_ID;
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY are required",
    );
  }

  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}

export function createS3Client(config: S3Env): S3Client {
  const clientConfig: S3ClientConfig = {
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  };

  return new S3Client(clientConfig);
}

function objectKey(imageId: string, variantFilename: VariantFilename): string {
  return `images/${imageId}/${variantFilename}`;
}

export async function uploadImageVariants(
  imageId: string,
  variants: Record<VariantFilename, Buffer>,
  client: S3Client,
  bucket: string,
): Promise<void> {
  await Promise.all(
    VARIANT_FILENAMES.map((filename) =>
      client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey(imageId, filename),
          Body: variants[filename],
          ContentType: "image/jpeg",
        }),
      ),
    ),
  );
}

export async function imageObjectsExist(
  imageId: string,
  client?: S3Client,
  bucket?: string,
): Promise<boolean> {
  const env = readS3Env();
  const resolvedClient = client ?? createS3Client(env);
  const resolvedBucket = bucket ?? env.bucket;

  const result = await resolvedClient.send(
    new ListObjectsV2Command({
      Bucket: resolvedBucket,
      Prefix: objectKey(imageId, VARIANT_FILENAMES[0]),
      MaxKeys: 1,
    }),
  );

  return (result.Contents?.length ?? 0) > 0;
}

export async function deleteImageObjects(
  imageId: string,
  client?: S3Client,
  bucket?: string,
): Promise<void> {
  const env = readS3Env();
  const resolvedClient = client ?? createS3Client(env);
  const resolvedBucket = bucket ?? env.bucket;

  await resolvedClient.send(
    new DeleteObjectsCommand({
      Bucket: resolvedBucket,
      Delete: {
        Objects: VARIANT_FILENAMES.map((filename) => ({
          Key: objectKey(imageId, filename),
        })),
      },
    }),
  );
}
