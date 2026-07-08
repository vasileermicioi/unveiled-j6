import { buildVariantUrl } from "@unveiled/images/urls";

export function buildCardImageSrc(imageId: string): string {
  return buildVariantUrl(imageId, "medium-640.webp");
}

export function buildCardImageSrcSet(imageId: string): string {
  const medium = buildVariantUrl(imageId, "medium-640.webp");
  const small = buildVariantUrl(imageId, "small-320.webp");
  return `${small} 320w, ${medium} 640w`;
}

export function buildDetailHeroSrc(imageId: string): string {
  return buildVariantUrl(imageId, "hero-1920.webp");
}

export function buildDetailHeroSrcSet(imageId: string): string {
  const hero = buildVariantUrl(imageId, "hero-1920.webp");
  const large = buildVariantUrl(imageId, "large-1280.webp");
  const medium = buildVariantUrl(imageId, "medium-640.webp");
  const small = buildVariantUrl(imageId, "small-320.webp");
  return `${small} 320w, ${medium} 640w, ${large} 1280w, ${hero} 1920w`;
}
