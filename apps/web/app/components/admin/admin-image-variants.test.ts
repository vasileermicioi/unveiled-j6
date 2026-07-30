import { describe, expect, test } from "bun:test";
import { ImageValidationError } from "@unveiled/images/client";

import {
  classifyClientImageError,
  hasCompleteVariants,
  mapClientImageError,
  type ProcessedAdminUpload,
  VARIANT_FILENAMES,
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
