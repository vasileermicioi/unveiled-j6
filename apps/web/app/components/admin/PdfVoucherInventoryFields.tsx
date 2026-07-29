"use client";

import { Description, Label, Paragraph, Surface } from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { NativePreferenceOption } from "../onboarding/NativePreferenceOption";

export type StagedVoucherPdf = {
  objectKey: string;
  originalFilename?: string | null;
  pageLabel?: string | null;
};

type TicketPreview = {
  index: number;
  startPage: number;
  endPage: number;
  pageLabel: string;
};

export function buildTicketPreviews(
  pageCount: number,
  skip: number,
  pagesPerTicket: number,
): TicketPreview[] {
  if (pageCount <= 0 || pagesPerTicket < 1 || skip < 0 || skip >= pageCount) {
    return [];
  }

  const remaining = pageCount - skip;
  const ticketCount = Math.floor(remaining / pagesPerTicket);
  const previews: TicketPreview[] = [];

  for (let index = 0; index < ticketCount; index += 1) {
    const startPage = skip + index * pagesPerTicket + 1;
    const endPage = startPage + pagesPerTicket - 1;
    previews.push({
      index,
      startPage,
      endPage,
      pageLabel: startPage === endPage ? `p.${startPage}` : `p.${startPage}-${endPage}`,
    });
  }

  return previews;
}

type PdfVoucherInventoryFieldsProps = {
  locale: Locale;
  isEdit?: boolean;
  eventId?: string | null;
  inventoryCounts?: { available: number; allocated: number } | null;
  uploadPath: string;
};

export function PdfVoucherInventoryFields({
  locale,
  isEdit = false,
  eventId = null,
  inventoryCounts = null,
  uploadPath,
}: PdfVoucherInventoryFieldsProps) {
  const copy = getAdminCopy(locale);
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<File | null>(null);
  const previewsRef = useRef<TicketPreview[]>([]);
  const stagedRef = useRef<StagedVoucherPdf[]>([]);
  const submittingRef = useRef(false);
  const [formEl, setFormEl] = useState<HTMLFormElement | null>(null);

  const [pageCount, setPageCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [pagesPerTicket, setPagesPerTicket] = useState(1);
  const [hasFile, setHasFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputId = "voucher-pdf-file";
  const skipId = "voucher-pdf-skip";
  const pagesId = "voucher-pdf-pages-per-ticket";

  const previews = useMemo(
    () => buildTicketPreviews(pageCount, skip, pagesPerTicket),
    [pageCount, skip, pagesPerTicket],
  );

  useEffect(() => {
    previewsRef.current = previews;
    stagedRef.current = [];
    if (hiddenRef.current) {
      hiddenRef.current.value = "[]";
    }
  }, [previews]);

  const ensureStagedUploads = useCallback(async (): Promise<StagedVoucherPdf[]> => {
    const file = fileRef.current;
    const currentPreviews = previewsRef.current;
    if (!file) {
      return [];
    }
    if (currentPreviews.length === 0) {
      throw new Error(copy.voucherPdfZeroTickets);
    }
    if (stagedRef.current.length === currentPreviews.length) {
      return stagedRef.current;
    }

    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const sourceBytes = await file.arrayBuffer();
      const source = await PDFDocument.load(sourceBytes);
      const uploaded: StagedVoucherPdf[] = [];

      for (const preview of currentPreviews) {
        const ticketDoc = await PDFDocument.create();
        const pageIndexes = Array.from(
          { length: preview.endPage - preview.startPage + 1 },
          (_, offset) => preview.startPage - 1 + offset,
        );
        const copied = await ticketDoc.copyPages(source, pageIndexes);
        for (const page of copied) {
          ticketDoc.addPage(page);
        }
        const ticketBytes = await ticketDoc.save();
        const blob = new Blob([Uint8Array.from(ticketBytes)], { type: "application/pdf" });
        const formData = new FormData();
        formData.append(
          "file",
          new File([blob], `${file.name.replace(/\.pdf$/i, "")}-${preview.pageLabel}.pdf`, {
            type: "application/pdf",
          }),
        );
        formData.append("pageLabel", preview.pageLabel);
        formData.append("originalFilename", file.name);
        if (eventId) {
          formData.append("eventId", eventId);
        }

        const response = await fetch(uploadPath, {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? copy.voucherPdfUploadError);
        }
        const json = (await response.json()) as StagedVoucherPdf;
        uploaded.push({
          objectKey: json.objectKey,
          originalFilename: json.originalFilename ?? file.name,
          pageLabel: json.pageLabel ?? preview.pageLabel,
        });
      }

      stagedRef.current = uploaded;
      if (hiddenRef.current) {
        hiddenRef.current.value = JSON.stringify(uploaded);
      }
      return uploaded;
    } finally {
      setBusy(false);
    }
  }, [copy.voucherPdfUploadError, copy.voucherPdfZeroTickets, eventId, uploadPath]);

  useEffect(() => {
    if (!formEl) {
      return;
    }

    const form = formEl;

    async function onSubmit(event: Event) {
      if (submittingRef.current) {
        return;
      }
      if (!fileRef.current) {
        return;
      }
      if (previewsRef.current.length === 0) {
        event.preventDefault();
        window.alert(copy.voucherPdfZeroTickets);
        return;
      }
      event.preventDefault();
      try {
        await ensureStagedUploads();
        submittingRef.current = true;
        form.requestSubmit();
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : copy.voucherPdfUploadError);
      }
    }

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [copy.voucherPdfUploadError, copy.voucherPdfZeroTickets, ensureStagedUploads, formEl]);

  async function loadPdf(next: File) {
    setError(null);
    setBusy(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await next.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      fileRef.current = next;
      setHasFile(true);
      setPageCount(doc.getPageCount());
    } catch {
      fileRef.current = null;
      setHasFile(false);
      setPageCount(0);
      setError(copy.voucherPdfLoadError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      {isEdit && inventoryCounts ? (
        <Paragraph>
          {copy.voucherInventorySummary(inventoryCounts.available, inventoryCounts.allocated)}
        </Paragraph>
      ) : null}

      <Surface className="flex flex-col gap-1" variant="transparent">
        <Label htmlFor={fileInputId}>{copy.voucherPdfFileLabel}</Label>
        <input
          accept="application/pdf,.pdf"
          className="admin-native-file"
          id={fileInputId}
          onChange={(event) => {
            const next = event.currentTarget.files?.[0];
            if (next) {
              void loadPdf(next);
            }
          }}
          type="file"
        />
        <Description>{copy.voucherPdfFileHint}</Description>
      </Surface>

      <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
        <Surface className="flex w-full flex-col gap-1" variant="transparent">
          <Label htmlFor={skipId}>{copy.voucherPdfSkipLabel}</Label>
          <input
            className="admin-native-number"
            id={skipId}
            min={0}
            onChange={(event) => setSkip(Math.max(0, Number(event.currentTarget.value) || 0))}
            step={1}
            type="number"
            value={skip}
          />
        </Surface>
        <Surface className="flex w-full flex-col gap-1" variant="transparent">
          <Label htmlFor={pagesId}>{copy.voucherPdfPagesPerTicketLabel}</Label>
          <input
            className="admin-native-number"
            id={pagesId}
            min={1}
            onChange={(event) =>
              setPagesPerTicket(Math.max(1, Number(event.currentTarget.value) || 1))
            }
            step={1}
            type="number"
            value={pagesPerTicket}
          />
        </Surface>
      </Surface>

      {pageCount > 0 ? <Description>{copy.voucherPdfPageCount(pageCount)}</Description> : null}

      {previews.length > 0 ? (
        <Surface className="flex flex-col gap-1" variant="transparent">
          <Paragraph>{copy.voucherPdfPreviewCount(previews.length)}</Paragraph>
          <Paragraph>{previews.map((preview) => preview.pageLabel).join(", ")}</Paragraph>
        </Surface>
      ) : hasFile ? (
        <Description>{copy.voucherPdfZeroTickets}</Description>
      ) : null}

      {error ? <Paragraph>{error}</Paragraph> : null}
      {busy ? <Description>{copy.voucherPdfBusy}</Description> : null}

      <input
        ref={(node) => {
          hiddenRef.current = node;
          setFormEl(node?.form ?? null);
        }}
        defaultValue="[]"
        name="voucher_pdfs_json"
        type="hidden"
      />

      {isEdit ? (
        <Surface className="flex flex-col gap-1" variant="transparent">
          <Surface className="onboarding-form__options" variant="transparent">
            <NativePreferenceOption
              label={copy.replaceUnusedInventoryLabel}
              name="replace_unused_inventory"
              type="checkbox"
              value="on"
            />
          </Surface>
          <Description>{copy.replaceUnusedInventoryHint}</Description>
        </Surface>
      ) : null}
    </Surface>
  );
}
