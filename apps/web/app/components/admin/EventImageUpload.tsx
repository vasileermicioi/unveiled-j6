"use client";

import { Description, Input, Label, Paragraph, Surface } from "@heroui/react";
import { ACCEPTED_IMAGE_FILE_ACCEPT } from "@unveiled/images/constants";
import { useEffect, useId, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminGalleryImageVariantFields, AdminImageVariantFields } from "./AdminImageVariantFields";
import {
  mapClientImageError,
  type ProcessedAdminUpload,
  processAdminImageFiles,
} from "./admin-image-variants";

export type EventImageUploadProps = {
  locale: Locale;
  isEdit?: boolean;
  currentImageUrl?: string | null;
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

      if (processedListRef.current.length > 0) {
        return;
      }

      const nativeInput = resolveNativeFileInput(document.getElementById(fileInputId));
      const hasFile = Boolean(nativeInput?.files && nativeInput.files.length > 0);

      if (!hasFile) {
        return;
      }

      if (processingRef.current || statusRef.current === "processing") {
        event.preventDefault();
        return;
      }

      // File supplied but variants not ready — block submit.
      event.preventDefault();
      setErrorMessage(copy.imageProcessingError);
      setStatus("error");
    };

    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [copy.imageProcessingError, fileInputId]);

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
      setProcessedList(results);
      setStatus(results.length > 0 ? "ready" : "idle");
      if (multiple && results.length > 0) {
        setSelectedLabel(copy.gallerySelectedFilesLabel(results.length));
      }
    } catch (error) {
      setProcessedList([]);
      setStatus("error");
      setErrorMessage(mapClientImageError(error, copy.imageProcessingError));
    } finally {
      processingRef.current = false;
    }
  }

  const resolvedSectionLabel = sectionLabel ?? copy.imageSectionLabel;
  const resolvedHint = uploadHint ?? (isEdit ? copy.imageUploadHintEdit : copy.imageUploadHint);
  const singleProcessed = !multiple ? (processedList[0] ?? null) : null;

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      <Paragraph className="onboarding-form__section-label">{resolvedSectionLabel}</Paragraph>
      <Description>{resolvedHint}</Description>

      {isEdit && currentImageUrl ? (
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
        <AdminGalleryImageVariantFields processed={processedList} />
      ) : null}
      {!multiple && singleProcessed ? (
        <AdminImageVariantFields processed={singleProcessed} />
      ) : null}
    </Surface>
  );
}
