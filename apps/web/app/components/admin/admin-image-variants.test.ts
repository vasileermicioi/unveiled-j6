import { describe, expect, test } from "bun:test";
import { ImageValidationError } from "@unveiled/images/client";

import {
  classifyClientImageError,
  hasCompleteVariants,
  mapClientImageError,
  type ProcessedAdminUpload,
  processedGalleryUploadsFromDraftFields,
  processedUploadFromDraftFields,
  VARIANT_FILENAMES,
  variantBase64FieldName,
} from "./admin-image-variants";

const copy = {
  imageUndecodableError: "undecodable",
  imageWebpUnsupportedError: "webp",
  imageIncompleteVariantsError: "incomplete",
  imageProcessingError: "generic",
};

function emptyProcessed(): ProcessedAdminUpload {
  const variants = {} as ProcessedAdminUpload["variants"];
  const variantsBase64 = {} as ProcessedAdminUpload["variantsBase64"];
  for (const filename of VARIANT_FILENAMES) {
    variants[filename] = new Blob(["x"], { type: "image/webp" });
    variantsBase64[filename] = "eA==";
  }
  return {
    imageId: "img-1",
    claimedWidth: 100,
    claimedHeight: 50,
    variants,
    variantsBase64,
    sourceFileName: "a.png",
  };
}

describe("classifyClientImageError / mapClientImageError", () => {
  test("maps WebP unsupported", () => {
    const error = new ImageValidationError(
      "WebP encoding failed (WASM encoder unavailable or errored)",
    );
    expect(classifyClientImageError(error)).toBe("webp_unsupported");
    expect(mapClientImageError(error, copy)).toBe("webp");
  });

  test("maps undecodable sources", () => {
    const error = new ImageValidationError("Unable to read image dimensions or format");
    expect(classifyClientImageError(error)).toBe("undecodable");
    expect(mapClientImageError(error, copy)).toBe("undecodable");
  });

  test("maps incomplete variant messages", () => {
    const error = new ImageValidationError("Missing required variant: small-320.webp");
    expect(classifyClientImageError(error)).toBe("incomplete");
    expect(mapClientImageError(error, copy)).toBe("incomplete");
  });

  test("falls back to generic processing copy", () => {
    expect(mapClientImageError(new Error("boom"), copy)).toBe("generic");
  });
});

describe("hasCompleteVariants", () => {
  test("true when all five blobs present", () => {
    expect(hasCompleteVariants(emptyProcessed())).toBe(true);
  });

  test("false when a variant is missing or empty", () => {
    const processed = emptyProcessed();
    processed.variants["small-320.webp"] = new Blob([], { type: "image/webp" });
    expect(hasCompleteVariants(processed)).toBe(false);
  });
});

describe("processedUploadFromDraftFields", () => {
  test("rebuilds a complete hidden set", () => {
    const source = emptyProcessed();
    const fields: Record<string, string | string[]> = {
      imageId: source.imageId,
      claimedWidth: String(source.claimedWidth),
      claimedHeight: String(source.claimedHeight),
    };
    for (const filename of VARIANT_FILENAMES) {
      fields[variantBase64FieldName("", filename)] = source.variantsBase64[filename];
    }

    const restored = processedUploadFromDraftFields(fields);
    expect(restored?.imageId).toBe("img-1");
    expect(restored?.claimedWidth).toBe(100);
    expect(restored?.variantsBase64["small-320.webp"]).toBe("eA==");
    expect(restored?.variants["small-320.webp"] instanceof Blob).toBe(true);
  });

  test("returns null when a variant b64 is missing", () => {
    expect(
      processedUploadFromDraftFields({
        imageId: "img-1",
        claimedWidth: "100",
        claimedHeight: "50",
      }),
    ).toBeNull();
  });
});

describe("processedGalleryUploadsFromDraftFields", () => {
  test("rebuilds indexed gallery sets", () => {
    const source = emptyProcessed();
    const fields: Record<string, string | string[]> = {
      galleryCount: "1",
      "gallery[0].imageId": source.imageId,
      "gallery[0].claimedWidth": String(source.claimedWidth),
      "gallery[0].claimedHeight": String(source.claimedHeight),
    };
    for (const filename of VARIANT_FILENAMES) {
      fields[variantBase64FieldName("gallery[0].", filename)] = source.variantsBase64[filename];
    }
    const restored = processedGalleryUploadsFromDraftFields(fields);
    expect(restored).toHaveLength(1);
    expect(restored[0]?.imageId).toBe("img-1");
  });

  test("returns empty when any gallery item is incomplete", () => {
    expect(
      processedGalleryUploadsFromDraftFields({
        galleryCount: "2",
        "gallery[0].imageId": "img-1",
      }),
    ).toEqual([]);
  });
});
