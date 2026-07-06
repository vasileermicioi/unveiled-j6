import sharp from "sharp";

import {
  HERO_MAX_WIDTH,
  HERO_QUALITY,
  LARGE_MAX_WIDTH,
  LARGE_QUALITY,
  MEDIUM_MAX_WIDTH,
  MEDIUM_QUALITY,
  OG_HEIGHT,
  OG_QUALITY,
  OG_WIDTH,
  ORIGINAL_MAX_EDGE,
  ORIGINAL_QUALITY,
  SMALL_MAX_WIDTH,
  SMALL_QUALITY,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "./constants";
import { validateImageBuffer } from "./validation";

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

export type GenerateVariantsOptions = {
  source: ImageSource;
  sourceUrl?: string | null;
  imageId?: string;
};

async function createOriginalVariant(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: ORIGINAL_MAX_EDGE,
      height: ORIGINAL_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: ORIGINAL_QUALITY })
    .toBuffer();
}

async function createMaxWidthVariant(
  input: Buffer,
  maxWidth: number,
  quality: number,
): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

async function createOgVariant(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: OG_QUALITY })
    .toBuffer();
}

export async function generateImageVariants(
  buffer: Buffer,
  options: GenerateVariantsOptions,
): Promise<ProcessedImageResult> {
  const validated = await validateImageBuffer(buffer);
  const oriented = await sharp(buffer).rotate().toBuffer();
  const imageId = options.imageId ?? crypto.randomUUID();

  const [original, hero1920, large1280, medium640, small320, og1200x630] = await Promise.all([
    createOriginalVariant(oriented),
    createMaxWidthVariant(oriented, HERO_MAX_WIDTH, HERO_QUALITY),
    createMaxWidthVariant(oriented, LARGE_MAX_WIDTH, LARGE_QUALITY),
    createMaxWidthVariant(oriented, MEDIUM_MAX_WIDTH, MEDIUM_QUALITY),
    createMaxWidthVariant(oriented, SMALL_MAX_WIDTH, SMALL_QUALITY),
    createOgVariant(oriented),
  ]);

  const variants = {
    "original.webp": original,
    "hero-1920.webp": hero1920,
    "large-1280.webp": large1280,
    "medium-640.webp": medium640,
    "small-320.webp": small320,
    "og-1200x630.webp": og1200x630,
  } satisfies Record<VariantFilename, Buffer>;

  for (const filename of VARIANT_FILENAMES) {
    if (!variants[filename]) {
      throw new Error(`Missing generated variant: ${filename}`);
    }
  }

  return {
    imageId,
    variants,
    metadata: {
      width: validated.width,
      height: validated.height,
      source: options.source,
      sourceUrl: options.sourceUrl ?? null,
    },
  };
}

export async function getVariantDimensions(
  variants: Record<VariantFilename, Buffer>,
): Promise<Record<VariantFilename, { width: number; height: number }>> {
  const entries = await Promise.all(
    VARIANT_FILENAMES.map(async (filename) => {
      const metadata = await sharp(variants[filename]).metadata();
      return [
        filename,
        {
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<VariantFilename, { width: number; height: number }>;
}
