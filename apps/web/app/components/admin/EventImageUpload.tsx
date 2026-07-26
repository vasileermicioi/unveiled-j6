"use client";

import { Description, Input, Label, Paragraph, Surface } from "@heroui/react";
import { ACCEPTED_IMAGE_FILE_ACCEPT } from "@unveiled/images/constants";
import { useEffect, useId, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminGalleryImageVariantFields, AdminImageVariantFields } from "./AdminImageVariantFields";
import {
  AdminImageVariantGallery,
  AdminImageVariantGallerySummary,
} from "./AdminImageVariantGallery";
import {
  hasCompleteVariants,
  mapClientImageError,
  type ProcessedAdminUpload,
  processAdminImageFiles,
} from "./admin-image-variants";

export type EventImageUploadProps = {
  locale: Locale;
  isEdit?: boolean;
  /** @deprecated Prefer currentImageId + imagePublicBaseUrl for the variant gallery. */
  currentImageUrl?: string | null;
  currentImageId?: string | null;
  imagePublicBaseUrl?: string | null;
  /** When true, process/emit all selected files as indexed gallery prebuilt sets. */
  multiple?: boolean;
  inputName?: string;
  sectionLabel?: string;
  uploadHint?: string;
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

export function EventImageUpload({
  locale,
  isEdit = false,
  currentImageUrl = null,
  currentImageId = null,
  imagePublicBaseUrl = null,
  multiple = false,
  inputName = "image",
  sectionLabel,
  uploadHint,
}: EventImageUploadProps) {
  const copy = getAdminCopy(locale);
  const fileInputId = useId();
  const [processedList, setProcessedList] = useState<ProcessedAdminUpload[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const processingRef = useRef(false);
  const processedListRef = useRef<ProcessedAdminUpload[]>([]);
  const statusRef = useRef(status);

  useEffect(() => {
    processedListRef.current = processedList;
  }, [processedList]);

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

      const readyList = processedListRef.current.filter(hasCompleteVariants);
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

      if (readyList.length > 0) {
        if (readyList.length !== processedListRef.current.length) {
          event.preventDefault();
          setErrorMessage(copy.imageIncompleteVariantsError);
          setStatus("error");
        }
        return;
      }

      if (!hasFile) {
        if (!isEdit && !multiple) {
          event.preventDefault();
          setErrorMessage(copy.imageRequiredError);
          setStatus("error");
          return;
        }
        if (multiple) {
          event.preventDefault();
          setErrorMessage(copy.galleryAddRequired);
          setStatus("error");
        }
        return;
      }

      // File supplied but variants not ready — block submit.
      event.preventDefault();
      setErrorMessage(copy.imageIncompleteVariantsError);
      setStatus("error");
    };

    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [
    copy.galleryAddRequired,
    copy.imageIncompleteVariantsError,
    copy.imageProcessingError,
    copy.imageProcessingSubmitBlocked,
    copy.imageRequiredError,
    fileInputId,
    isEdit,
    multiple,
  ]);

  async function handleFilesSelected(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) {
      setProcessedList([]);
      setStatus("idle");
      setErrorMessage(null);
      setSelectedLabel(null);
      return;
    }

    processingRef.current = true;
    setStatus("processing");
    setErrorMessage(null);
    setProcessedList([]);
    setSelectedLabel(
      multiple
        ? copy.gallerySelectedFilesLabel(files.length)
        : copy.imageSelectedLabel(files[0]?.name ?? ""),
    );

    try {
      const results = await processAdminImageFiles(files, { multiple });
      const complete = results.filter(hasCompleteVariants);
      if (complete.length === 0) {
        setProcessedList([]);
        setStatus("error");
        setErrorMessage(copy.imageIncompleteVariantsError);
        return;
      }
      if (complete.length !== results.length) {
        setProcessedList(complete);
        setStatus("error");
        setErrorMessage(copy.imageIncompleteVariantsError);
        return;
      }
      setProcessedList(complete);
      setStatus("ready");
      if (multiple) {
        setSelectedLabel(copy.gallerySelectedFilesLabel(complete.length));
      }
    } catch (error) {
      setProcessedList([]);
      setStatus("error");
      setErrorMessage(mapClientImageError(error, copy));
    } finally {
      processingRef.current = false;
    }
  }

  const resolvedSectionLabel = sectionLabel ?? copy.imageSectionLabel;
  const resolvedHint = uploadHint ?? (isEdit ? copy.imageUploadHintEdit : copy.imageUploadHint);
  const singleProcessed = !multiple ? (processedList[0] ?? null) : null;
  const showExistingGallery = Boolean(
    isEdit &&
      currentImageId &&
      !singleProcessed &&
      processedList.length === 0 &&
      status !== "processing",
  );

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      <Paragraph className="onboarding-form__section-label">{resolvedSectionLabel}</Paragraph>
      <Description>{resolvedHint}</Description>

      {showExistingGallery ? (
        <AdminImageVariantGallery
          imageId={currentImageId}
          imagePublicBaseUrl={imagePublicBaseUrl}
          locale={locale}
        />
      ) : null}

      {/* Fallback single thumb only when gallery cannot resolve (no imageId/base). */}
      {isEdit && !showExistingGallery && !singleProcessed && currentImageUrl ? (
        <Surface className="admin-form__image-preview" variant="transparent">
          <img alt="" src={currentImageUrl} />
        </Surface>
      ) : null}

      <Surface className="flex flex-col gap-2" variant="transparent">
        <Label htmlFor={fileInputId}>{copy.imageFileLabel}</Label>
        <Input
          accept={ACCEPTED_IMAGE_FILE_ACCEPT}
          id={fileInputId}
          multiple={multiple}
          name={processedList.length > 0 ? undefined : inputName}
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
        {status === "processing" ? (
          <Description>{copy.imageProcessingInProgress}</Description>
        ) : null}
        {status === "ready" && selectedLabel ? <Description>{selectedLabel}</Description> : null}
        {errorMessage ? <Description>{errorMessage}</Description> : null}
      </Surface>

      {multiple && processedList.length > 0 ? (
        <>
          <AdminImageVariantGallerySummary locale={locale} processedList={processedList} />
          <AdminGalleryImageVariantFields processed={processedList} />
        </>
      ) : null}
      {!multiple && singleProcessed ? (
        <>
          <AdminImageVariantGallery locale={locale} processed={singleProcessed} />
          <AdminImageVariantFields processed={singleProcessed} />
        </>
      ) : null}
    </Surface>
  );
}
