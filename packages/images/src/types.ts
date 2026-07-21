import type { VariantFilename } from "./constants";

export type ImageSource = "UPLOAD" | "REMOTE_URL";

export type ProcessedImageMetadata = {
  width: number;
  height: number;
  source: ImageSource;
  sourceUrl?: string | null;
};

export type ProcessedImageResult = {
  imageId: string;
  variants: Record<VariantFilename, Buffer>;
  metadata: ProcessedImageMetadata;
};
