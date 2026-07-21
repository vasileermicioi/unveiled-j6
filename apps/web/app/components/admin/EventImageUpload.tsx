"use client";

import { Button, Description, Input, Label, Paragraph, Surface, TextField } from "@heroui/react";
import { ACCEPTED_IMAGE_FILE_ACCEPT } from "@unveiled/images/constants";
import { useEffect, useId, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminImageVariantFields } from "./AdminImageVariantFields";
import {
  mapClientImageError,
  type ProcessedAdminUpload,
  processAdminImageBlob,
  processAdminImageFiles,
} from "./admin-image-variants";

export type EventImageUploadProps = {
  locale: Locale;
  isEdit?: boolean;
  currentImageUrl?: string | null;
  /** Reserved for featured-event-gallery; primary event image stays single-file. */
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

function imageProxyPath(locale: Locale): string {
  return `/${locale}/admin/image-proxy`;
}

export function EventImageUpload({
  locale,
  isEdit = false,
  currentImageUrl = null,
  multiple = false,
  inputName = "image",
}: EventImageUploadProps) {
  const copy = getAdminCopy(locale);
  const fileInputId = useId();
  const urlInputId = useId();
  const [processed, setProcessed] = useState<ProcessedAdminUpload | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [imageUrlValue, setImageUrlValue] = useState("");
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

      if (processedRef.current) {
        return;
      }

      const nativeInput = resolveNativeFileInput(document.getElementById(fileInputId));
      const hasFile = Boolean(nativeInput?.files && nativeInput.files.length > 0);
      const urlInput = form.querySelector<HTMLInputElement>(`#${CSS.escape(urlInputId)}`);
      const hasUrl = Boolean(urlInput?.value?.trim());

      if (!hasFile && !hasUrl) {
        return;
      }

      if (processingRef.current || statusRef.current === "processing") {
        event.preventDefault();
        return;
      }

      // File or URL supplied but variants not ready — block submit.
      event.preventDefault();
      setErrorMessage(copy.imageProcessingError);
      setStatus("error");
    };

    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [copy.imageProcessingError, fileInputId, urlInputId]);

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
    setImageUrlValue("");

    try {
      const results = await processAdminImageFiles(files, { multiple });
      const first = results[0] ?? null;
      setProcessed(first);
      setStatus(first ? "ready" : "idle");
    } catch (error) {
      setProcessed(null);
      setStatus("error");
      setErrorMessage(mapClientImageError(error, copy.imageProcessingError));
    } finally {
      processingRef.current = false;
    }
  }

  async function handleProcessUrl() {
    const url = imageUrlValue.trim();
    if (!url) {
      return;
    }

    processingRef.current = true;
    setStatus("processing");
    setErrorMessage(null);
    setProcessed(null);
    setSelectedLabel(copy.imageSelectedLabel(url));

    const native = resolveNativeFileInput(document.getElementById(fileInputId));
    if (native) {
      native.value = "";
    }

    try {
      const response = await fetch(imageProxyPath(locale), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json,image/*" },
        body: JSON.stringify({ url }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        let message = copy.imageUrlFetchError;
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error?.trim()) {
            message = payload.error;
          }
        } catch {
          // keep localized fallback
        }
        throw new Error(message);
      }

      const contentType = response.headers.get("content-type") ?? "image/jpeg";
      const bytes = await response.arrayBuffer();
      const blob = new Blob([bytes], { type: contentType.split(";")[0]?.trim() || "image/jpeg" });
      const result = await processAdminImageBlob(blob, {
        source: "REMOTE_URL",
        sourceUrl: url,
        sourceFileName: "remote-image",
      });
      setProcessed(result);
      setStatus("ready");
    } catch (error) {
      setProcessed(null);
      setStatus("error");
      setErrorMessage(mapClientImageError(error, copy.imageUrlFetchError));
    } finally {
      processingRef.current = false;
    }
  }

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      <Paragraph className="onboarding-form__section-label">{copy.imageSectionLabel}</Paragraph>
      <Description>{isEdit ? copy.imageUploadHintEdit : copy.imageUploadHint}</Description>

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
        {status === "processing" ? (
          <Description>{copy.imageProcessingInProgress}</Description>
        ) : null}
        {status === "ready" && selectedLabel ? <Description>{selectedLabel}</Description> : null}
        {errorMessage ? <Description>{errorMessage}</Description> : null}
      </Surface>

      {processed ? <AdminImageVariantFields processed={processed} /> : null}

      <TextField fullWidth name="image_url" value={imageUrlValue}>
        <Label htmlFor={urlInputId}>{copy.imageUrlLabel}</Label>
        <Input
          id={urlInputId}
          onChange={(event) => {
            const native = event.currentTarget as unknown as HTMLInputElement;
            const next = "value" in native ? String(native.value) : "";
            setImageUrlValue(next);
            const fileNative = resolveNativeFileInput(document.getElementById(fileInputId));
            if (fileNative) {
              fileNative.value = "";
            }
            setProcessed(null);
            setStatus("idle");
            setErrorMessage(null);
            setSelectedLabel(null);
          }}
          placeholder={copy.imageUrlPlaceholder}
          type="url"
        />
        <Description>{copy.imageUrlHint}</Description>
      </TextField>

      <Button
        className="button button--secondary"
        isDisabled={status === "processing" || imageUrlValue.trim().length === 0}
        onPress={() => {
          void handleProcessUrl();
        }}
        type="button"
      >
        {copy.imageUrlProcessButton}
      </Button>
    </Surface>
  );
}
