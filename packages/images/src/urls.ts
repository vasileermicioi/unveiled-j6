import type { VariantFilename } from "./constants";

export function readImagePublicBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const baseUrl = env.IMAGE_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("IMAGE_PUBLIC_BASE_URL is required");
  }
  return baseUrl.replace(/\/$/, "");
}

export function buildVariantUrl(
  imageId: string,
  variantFilename: VariantFilename,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const baseUrl = readImagePublicBaseUrl(env);
  return `${baseUrl}/images/${imageId}/${variantFilename}`;
}
