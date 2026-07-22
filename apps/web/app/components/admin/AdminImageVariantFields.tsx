"use client";

import { Input } from "@heroui/react";
import { useEffect, useId } from "react";

import {
  assignBlobToFileInput,
  type ProcessedAdminUpload,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "./admin-image-variants";

type VariantFileFieldProps = {
  filename: VariantFilename;
  blob: Blob;
  fieldName: string;
};

function VariantFileField({ filename, blob, fieldName }: VariantFileFieldProps) {
  const inputId = useId();

  useEffect(() => {
    const host = document.getElementById(inputId);
    const input =
      host instanceof HTMLInputElement
        ? host
        : host?.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      return;
    }
    assignBlobToFileInput(input, filename, blob);
  }, [blob, filename, inputId]);

  return (
    <Input
      accept="image/jpeg"
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
  /** When set, field names become `${fieldPrefix}imageId`, `${fieldPrefix}original.jpg`, … */
  fieldPrefix?: string;
};

/** Hidden multipart fields for a client-built six-variant set (step 02 field names). */
export function AdminImageVariantFields({
  processed,
  fieldPrefix = "",
}: AdminImageVariantFieldsProps) {
  return (
    <>
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
        <VariantFileField
          blob={processed.variants[filename]}
          fieldName={`${fieldPrefix}${filename}`}
          filename={filename}
          key={filename}
        />
      ))}
    </>
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
