import { Description, Input, Label, Paragraph, Surface } from "@heroui/react";
import { ACCEPTED_IMAGE_FILE_ACCEPT } from "@unveiled/images/constants";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import { isWizardAdvanceSubmit } from "../../lib/admin-event-wizard";
import {
  draftFieldValue,
  FORM_DRAFT_APPLIED_EVENT,
  type FormDraftAppliedDetail,
} from "../../lib/form-draft";
import { imageAltWithCredit, imageCreditTitle } from "../../lib/image-credit";
import type { Locale } from "../../lib/locale";

import { AdminImageCreditField } from "./AdminImageCreditField";
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
  processedGalleryUploadsFromDraftFields,
  processedUploadFromDraftFields,
} from "./admin-image-variants";

export type EventImageUploadProps = {
  locale: Locale;
  isEdit?: boolean;
  /** @deprecated Prefer currentImageId + imagePublicBaseUrl for the variant gallery. */
  currentImageUrl?: string | null;
  currentImageId?: string | null;
  /** Existing credit when keeping the current file; ignored once a new file is processed. */
  currentCredit?: string | null;
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
  currentCredit = null,
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
  const [restoredCredits, setRestoredCredits] = useState<string[]>([]);
  const processingRef = useRef(false);
  const processedListRef = useRef<ProcessedAdminUpload[]>([]);
  const statusRef = useRef(status);
  const currentImageIdRef = useRef(currentImageId);
  const multipleRef = useRef(multiple);

  useEffect(() => {
    processedListRef.current = processedList;
  }, [processedList]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    currentImageIdRef.current = currentImageId;
  }, [currentImageId]);

  useEffect(() => {
    multipleRef.current = multiple;
  }, [multiple]);

  useLayoutEffect(() => {
    function onApplied(event: Event) {
      const detail = (event as CustomEvent<FormDraftAppliedDetail>).detail;
      const form = document.getElementById(fileInputId)?.closest("form") ?? null;
      if (!detail?.fields || !form || detail.form !== form) {
        return;
      }
      if (multipleRef.current) {
        const list = processedGalleryUploadsFromDraftFields(detail.fields).filter(
          hasCompleteVariants,
        );
        if (list.length === 0) {
          return;
        }
        setProcessedList(list);
        setStatus("ready");
        setErrorMessage(null);
        setSelectedLabel(copy.gallerySelectedFilesLabel(list.length));
        setRestoredCredits(
          list.map((_, index) => draftFieldValue(detail.fields, `image_credit_${index}`) ?? ""),
        );
        return;
      }
      const single = processedUploadFromDraftFields(detail.fields);
      if (!single || !hasCompleteVariants(single)) {
        return;
      }
      setProcessedList([single]);
      setStatus("ready");
      setErrorMessage(null);
      setRestoredCredits([draftFieldValue(detail.fields, "image_credit") ?? ""]);
    }

    document.addEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    return () => {
      document.removeEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    };
  }, [copy.gallerySelectedFilesLabel, fileInputId]);

  useEffect(() => {
    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      if (!form.querySelector(`#${CSS.escape(fileInputId)}`)) {
        return;
      }

      if (isWizardAdvanceSubmit(event)) {
        return;
      }

      const readyList = processedListRef.current.filter(hasCompleteVariants);
      const nativeInput = resolveNativeFileInput(document.getElementById(fileInputId));
      const hasFile = Boolean(nativeInput?.files && nativeInput.files.length > 0);
      const hasStagedOrExistingImage = Boolean(currentImageIdRef.current);

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
        // Create/series with a staged id (error retry) satisfies required image like edit.
        if (!multiple && (isEdit || hasStagedOrExistingImage)) {
          return;
        }
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
      setErrorMessage(null);
      setRestoredCredits([]);
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
  const stagedOrExistingImageId = currentImageId?.trim() || null;
  // Create/series staged id uses the same gallery path as edit's existing image.
  const showExistingGallery = Boolean(
    stagedOrExistingImageId &&
      !singleProcessed &&
      processedList.length === 0 &&
      status !== "processing",
  );

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      <Paragraph className="onboarding-form__section-label">{resolvedSectionLabel}</Paragraph>
      <Description>{resolvedHint}</Description>

      {showExistingGallery && stagedOrExistingImageId ? (
        <>
          <AdminImageVariantGallery
            credit={currentCredit}
            imageId={stagedOrExistingImageId}
            imagePublicBaseUrl={imagePublicBaseUrl}
            locale={locale}
          />
          {/* Resubmit without re-upload: bare imageId is parsed as stagedImageId. */}
          <Input name="imageId" type="hidden" value={stagedOrExistingImageId} />
        </>
      ) : null}

      {/* Fallback single thumb only when gallery cannot resolve (no imageId/base). */}
      {!showExistingGallery && !singleProcessed && currentImageUrl ? (
        <Surface className="admin-form__image-preview" variant="transparent">
          <img
            alt={imageAltWithCredit("", currentCredit)}
            src={currentImageUrl}
            title={imageCreditTitle(currentCredit)}
          />
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
        {errorMessage && status !== "ready" ? <Description>{errorMessage}</Description> : null}
      </Surface>

      {multiple && processedList.length > 0 ? (
        <>
          <AdminImageVariantGallerySummary
            creditDefaults={restoredCredits}
            includeCreditFields
            locale={locale}
            processedList={processedList}
          />
          <AdminGalleryImageVariantFields processed={processedList} />
        </>
      ) : null}
      {!multiple && singleProcessed ? (
        <>
          <AdminImageVariantGallery locale={locale} processed={singleProcessed} />
          <AdminImageVariantFields processed={singleProcessed} />
        </>
      ) : null}
      {!multiple ? (
        <AdminImageCreditField
          defaultValue={singleProcessed ? (restoredCredits[0] ?? "") : (currentCredit ?? "")}
          key={
            singleProcessed
              ? `new-${singleProcessed.imageId}`
              : (stagedOrExistingImageId ?? "empty")
          }
          locale={locale}
          name="image_credit"
        />
      ) : null}
    </Surface>
  );
}
