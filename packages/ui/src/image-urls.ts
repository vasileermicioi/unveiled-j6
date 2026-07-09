import { buildVariantUrl } from "@unveiled/images/urls";

export function buildCardImageSrc(imageId: string): string {
  return buildVariantUrl(imageId, "medium-640.jpg");
}

export function buildCardImageSrcSet(imageId: string): string {
  const medium = buildVariantUrl(imageId, "medium-640.jpg");
  const small = buildVariantUrl(imageId, "small-320.jpg");
  return `${small} 320w, ${medium} 640w`;
}

export function buildDetailHeroSrc(imageId: string): string {
  return buildVariantUrl(imageId, "hero-1920.jpg");
}

export function buildDetailHeroSrcSet(imageId: string): string {
  const hero = buildVariantUrl(imageId, "hero-1920.jpg");
  const large = buildVariantUrl(imageId, "large-1280.jpg");
  const medium = buildVariantUrl(imageId, "medium-640.jpg");
  const small = buildVariantUrl(imageId, "small-320.jpg");
  return `${small} 320w, ${medium} 640w, ${large} 1280w, ${hero} 1920w`;
}
