"use client";

import { Description, Input, Paragraph, Surface } from "@heroui/react";
import { ACCEPTED_IMAGE_FILE_ACCEPT } from "@unveiled/images/constants";
import { useEffect, useId, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminImageVariantFields } from "./AdminImageVariantFields";
import { AdminImageVariantGallery } from "./AdminImageVariantGallery";
import {
  hasCompleteVariants,
  mapClientImageError,
  type ProcessedAdminUpload,
  processAdminImageFiles,
} from "./admin-image-variants";

export type PartnerLogoUploadProps = {
  locale: Locale;
  isEdit?: boolean;
  /** @deprecated Prefer currentLogoImageId + imagePublicBaseUrl for the variant gallery. */
  currentLogoUrl?: string | null;
  currentLogoImageId?: string | null;
  imagePublicBaseUrl?: string | null;
  /** Reserved for featured-event-gallery reuse; partner logo stays single-file. */
  multiple?: boolean;
  inputName?: string;
};

function resolveNativeFileInput(host: HTMLElement | null): HTMLInputElement | null {
  if (!host) {
    return null;
  }
  if (host instanceof HTMLInputElement) {
    return host;
  }
  return host.querySelector<HTMLInputElement>('input[type="file"]');
}

export function PartnerLogoUpload({
  locale,
  isEdit = false,
  currentLogoUrl = null,
  currentLogoImageId = null,
  imagePublicBaseUrl = null,
  multiple = false,
  inputName = "logo",
}: PartnerLogoUploadProps) {
  const copy = getAdminCopy(locale);
  const fileInputId = useId();
  const [processed, setProcessed] = useState<ProcessedAdminUpload | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const processingRef = useRef(false);
  const processedRef = useRef<ProcessedAdminUpload | null>(null);
  const statusRef = useRef(status);

  useEffect(() => {
    processedRef.current = processed;
  }, [processed]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      if (!form.querySelector(`#${CSS.escape(fileInputId)}`)) {
        return;
      }

      const ready =
        processedRef.current && hasCompleteVariants(processedRef.current)
          ? processedRef.current
          : null;
      const nativeInput = resolveNativeFileInput(document.getElementById(fileInputId));
      const hasFile = Boolean(nativeInput?.files && nativeInput.files.length > 0);

      if (processingRef.current || statusRef.current === "processing") {
        event.preventDefault();
        setErrorMessage(copy.imageProcessingSubmitBlocked);
        return;
      }

      if (statusRef.current === "error" && hasFile) {
        event.preventDefault();
        setErrorMessage((prev) => prev ?? copy.imageProcessingError);
        return;
      }

      if (ready) {
        return;
      }

      if (processedRef.current && !ready) {
        event.preventDefault();
        setErrorMessage(copy.imageIncompleteVariantsError);
        setStatus("error");
        return;
      }

      // Create requires a processed logo; edit may omit (keep existing).
      if (!isEdit && !hasFile) {
        event.preventDefault();
        setErrorMessage(copy.logoRequiredError);
        setStatus("error");
        return;
      }

      if (!hasFile) {
        return;
      }

      event.preventDefault();
      setErrorMessage(copy.imageIncompleteVariantsError);
      setStatus("error");
    };

    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [
    copy.imageIncompleteVariantsError,
    copy.imageProcessingError,
    copy.imageProcessingSubmitBlocked,
    copy.logoRequiredError,
    fileInputId,
    isEdit,
  ]);

  async function handleFilesSelected(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) {
      setProcessed(null);
      setStatus("idle");
      setErrorMessage(null);
      setSelectedLabel(null);
      return;
    }

    processingRef.current = true;
    setStatus("processing");
    setErrorMessage(null);
    setProcessed(null);
    setSelectedLabel(copy.imageSelectedLabel(files[0]?.name ?? ""));

    try {
      const results = await processAdminImageFiles(files, { multiple });
      const first = results[0] ?? null;
      if (!first || !hasCompleteVariants(first)) {
        setProcessed(null);
        setStatus("error");
        setErrorMessage(copy.imageIncompleteVariantsError);
        return;
      }
      setProcessed(first);
      setStatus("ready");
      setErrorMessage(null);
    } catch (error) {
      setProcessed(null);
      setStatus("error");
      setErrorMessage(mapClientImageError(error, copy));
    } finally {
      processingRef.current = false;
    }
  }

  const showExistingGallery = Boolean(
    isEdit && currentLogoImageId && !processed && status !== "processing",
  );

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      <Paragraph className="onboarding-form__section-label">{copy.logoFileLabel}</Paragraph>
      <Description>{isEdit ? copy.logoUploadHintEdit : copy.logoUploadHint}</Description>

      {showExistingGallery ? (
        <AdminImageVariantGallery
          imageId={currentLogoImageId}
          imagePublicBaseUrl={imagePublicBaseUrl}
          locale={locale}
        />
      ) : null}

      {isEdit && !showExistingGallery && !processed && currentLogoUrl ? (
        <Surface className="admin-form__image-preview" variant="transparent">
          <img alt="" src={currentLogoUrl} />
        </Surface>
      ) : null}

      <Input
        accept={ACCEPTED_IMAGE_FILE_ACCEPT}
        id={fileInputId}
        multiple={multiple}
        name={processed ? undefined : inputName}
        onChange={(event) => {
          const native = event.currentTarget as unknown as HTMLInputElement;
          const files =
            "files" in native && native.files
              ? native.files
              : (resolveNativeFileInput(document.getElementById(fileInputId))?.files ?? null);
          void handleFilesSelected(files);
        }}
        type="file"
      />
      {status === "processing" ? <Description>{copy.imageProcessingInProgress}</Description> : null}
      {status === "ready" && selectedLabel ? <Description>{selectedLabel}</Description> : null}
      {errorMessage && status !== "ready" ? <Description>{errorMessage}</Description> : null}

      {processed ? (
        <>
          <AdminImageVariantGallery locale={locale} processed={processed} />
          <AdminImageVariantFields processed={processed} />
        </>
      ) : null}
    </Surface>
  );
}
