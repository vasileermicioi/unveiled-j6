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
};

function VariantFileField({ filename, blob }: VariantFileFieldProps) {
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
      name={filename}
      tabIndex={-1}
      type="file"
    />
  );
}

type AdminImageVariantFieldsProps = {
  processed: ProcessedAdminUpload;
};

/** Hidden multipart fields for a client-built six-variant set (step 02 field names). */
export function AdminImageVariantFields({ processed }: AdminImageVariantFieldsProps) {
  return (
    <>
      <Input name="imageId" type="hidden" value={processed.imageId} />
      <Input name="claimedWidth" type="hidden" value={String(processed.claimedWidth)} />
      <Input name="claimedHeight" type="hidden" value={String(processed.claimedHeight)} />
      {VARIANT_FILENAMES.map((filename) => (
        <VariantFileField blob={processed.variants[filename]} filename={filename} key={filename} />
      ))}
    </>
  );
}
