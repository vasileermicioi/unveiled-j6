import type { VariantFilename } from "./constants";
import { resolveRuntimeEnv } from "./resolve-runtime-env";

export function readImagePublicBaseUrl(env: NodeJS.ProcessEnv = resolveRuntimeEnv()): string {
  const baseUrl = env.IMAGE_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("IMAGE_PUBLIC_BASE_URL is required");
  }
  return baseUrl.replace(/\/$/, "");
}

export function buildVariantUrl(
  imageId: string,
  variantFilename: VariantFilename,
  env: NodeJS.ProcessEnv = resolveRuntimeEnv(),
): string {
  const baseUrl = readImagePublicBaseUrl(env);
  return `${baseUrl}/images/${imageId}/${variantFilename}`;
}
