"use client";

import { Input, Surface } from "@heroui/react";
import { useEffect, useId } from "react";

import {
  assignBlobToFileInput,
  type ProcessedAdminUpload,
  VARIANT_FILENAMES,
  type VariantFilename,
  variantBase64FieldName,
} from "./admin-image-variants";

export { variantBase64FieldName };

type VariantFileFieldProps = {
  filename: VariantFilename;
  blob: Blob;
  fieldName: string;
};

function VariantFileField({ filename, blob, fieldName }: VariantFileFieldProps) {
  const inputId = useId();

  useEffect(() => {
    const input = document.getElementById(inputId);
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    assignBlobToFileInput(input, filename, blob);
  }, [blob, filename, inputId]);

  // Native file input (AGENTS §14) — HeroUI Input + DataTransfer is unreliable on some platforms.
  return (
    <input
      accept="image/webp"
      aria-hidden
      className="sr-only"
      id={inputId}
      name={fieldName}
      tabIndex={-1}
      type="file"
    />
  );
}

type AdminImageVariantFieldsProps = {
  processed: ProcessedAdminUpload;
  /** When set, field names become `${fieldPrefix}imageId`, `${fieldPrefix}hero-1920.webp`, … */
  fieldPrefix?: string;
};

/** Hidden multipart fields for a client-built five-variant WebP set. */
export function AdminImageVariantFields({
  processed,
  fieldPrefix = "",
}: AdminImageVariantFieldsProps) {
  return (
    <Surface className="contents" variant="transparent">
      <Input name={`${fieldPrefix}imageId`} type="hidden" value={processed.imageId} />
      <Input
        name={`${fieldPrefix}claimedWidth`}
        type="hidden"
        value={String(processed.claimedWidth)}
      />
      <Input
        name={`${fieldPrefix}claimedHeight`}
        type="hidden"
        value={String(processed.claimedHeight)}
      />
      {VARIANT_FILENAMES.map((filename) => (
        <Surface className="contents" key={filename} variant="transparent">
          <VariantFileField
            blob={processed.variants[filename]}
            fieldName={`${fieldPrefix}${filename}`}
            filename={filename}
          />
          <Input
            name={variantBase64FieldName(fieldPrefix, filename)}
            type="hidden"
            value={processed.variantsBase64[filename]}
          />
        </Surface>
      ))}
    </Surface>
  );
}

type AdminGalleryImageVariantFieldsProps = {
  processed: ProcessedAdminUpload[];
};

/** Indexed multipart fields for N gallery prebuilt sets (`galleryCount` + `gallery[i].…`). */
export function AdminGalleryImageVariantFields({ processed }: AdminGalleryImageVariantFieldsProps) {
  return (
    <>
      <Input name="galleryCount" type="hidden" value={String(processed.length)} />
      {processed.map((item, index) => (
        <AdminImageVariantFields
          fieldPrefix={`gallery[${index}].`}
          key={item.imageId}
          processed={item}
        />
      ))}
    </>
  );
}
