import { Description, Label, Paragraph, Surface } from "@heroui/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import { resubmitFormWithSubmitter } from "../../lib/admin-event-wizard";
import type { InventoryPreviewChange } from "../../lib/admin-voucher-inventory";
import {
  draftFieldValue,
  FORM_DRAFT_APPLIED_EVENT,
  type FormDraftAppliedDetail,
} from "../../lib/form-draft";
import type { Locale } from "../../lib/locale";
import { NativePreferenceOption } from "../onboarding/NativePreferenceOption";

export type StagedVoucherPdf = {
  objectKey: string;
  originalFilename?: string | null;
  pageLabel?: string | null;
};

export type PdfImportMode = "split" | "files";

function parseStagedVoucherPdfs(raw: string): StagedVoucherPdf[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    const items: StagedVoucherPdf[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as {
        objectKey?: unknown;
        originalFilename?: unknown;
        pageLabel?: unknown;
      };
      if (typeof record.objectKey !== "string" || !record.objectKey.trim()) {
        return null;
      }
      items.push({
        objectKey: record.objectKey,
        originalFilename:
          typeof record.originalFilename === "string" ? record.originalFilename : null,
        pageLabel: typeof record.pageLabel === "string" ? record.pageLabel : null,
      });
    }
    return items;
  } catch {
    return null;
  }
}

type TicketPreview = {
  index: number;
  /** 1-based page numbers included in this ticket, in order. */
  pages: number[];
  pageLabel: string;
};

export type ParseSkipPageSpecResult =
  | { ok: true; pages: Set<number> }
  | { ok: false; error: "invalid" };

/**
 * Parse comma-separated pages and inclusive ranges (e.g. `"1-3,7,9-10"`).
 * Empty / whitespace-only → no pages skipped.
 */
export function parseSkipPageSpec(spec: string): ParseSkipPageSpecResult {
  const trimmed = spec.trim();
  if (!trimmed) {
    return { ok: true, pages: new Set() };
  }

  const pages = new Set<number>();
  for (const rawToken of trimmed.split(",")) {
    const token = rawToken.trim();
    if (!token) {
      return { ok: false, error: "invalid" };
    }

    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
        return { ok: false, error: "invalid" };
      }
      for (let page = start; page <= end; page += 1) {
        pages.add(page);
      }
      continue;
    }

    if (!/^\d+$/.test(token)) {
      return { ok: false, error: "invalid" };
    }
    const page = Number(token);
    if (!Number.isInteger(page) || page < 1) {
      return { ok: false, error: "invalid" };
    }
    pages.add(page);
  }

  return { ok: true, pages };
}

export function formatPageLabel(pages: readonly number[]): string {
  const first = pages[0];
  if (first === undefined) {
    return "";
  }

  const parts: string[] = [];
  let runStart = first;
  let runEnd = first;

  const flush = () => {
    parts.push(runStart === runEnd ? `${runStart}` : `${runStart}-${runEnd}`);
  };

  for (let i = 1; i < pages.length; i += 1) {
    const page = pages[i];
    if (page === undefined) {
      continue;
    }
    if (page === runEnd + 1) {
      runEnd = page;
      continue;
    }
    flush();
    runStart = page;
    runEnd = page;
  }
  flush();

  return `p.${parts.join(",")}`;
}

export function buildTicketPreviews(
  pageCount: number,
  skipPages: ReadonlySet<number>,
  pagesPerTicket: number,
): TicketPreview[] {
  if (pageCount <= 0 || pagesPerTicket < 1) {
    return [];
  }

  const included: number[] = [];
  for (let page = 1; page <= pageCount; page += 1) {
    if (!skipPages.has(page)) {
      included.push(page);
    }
  }

  const ticketCount = Math.floor(included.length / pagesPerTicket);
  const previews: TicketPreview[] = [];

  for (let index = 0; index < ticketCount; index += 1) {
    const pages = included.slice(index * pagesPerTicket, (index + 1) * pagesPerTicket);
    previews.push({
      index,
      pages,
      pageLabel: formatPageLabel(pages),
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
  onInventoryPreviewChange?: (state: InventoryPreviewChange) => void;
  /** Posted / error-retry tickets so Next/Create keep inventory after a remount. */
  initialStaged?: StagedVoucherPdf[];
};

export function PdfVoucherInventoryFields({
  locale,
  isEdit = false,
  eventId = null,
  inventoryCounts = null,
  uploadPath,
  onInventoryPreviewChange,
  initialStaged,
}: PdfVoucherInventoryFieldsProps) {
  const copy = getAdminCopy(locale);
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const masterFileRef = useRef<File | null>(null);
  const multiFilesRef = useRef<File[]>([]);
  const previewsRef = useRef<TicketPreview[]>([]);
  const stagedRef = useRef<StagedVoucherPdf[]>(initialStaged ?? []);
  const modeRef = useRef<PdfImportMode>("split");
  const submittingRef = useRef(false);

  const [mode, setMode] = useState<PdfImportMode>("split");
  const [pageCount, setPageCount] = useState(0);
  const [skipSpec, setSkipSpec] = useState("");
  const [pagesPerTicket, setPagesPerTicket] = useState(1);
  const [hasMasterFile, setHasMasterFile] = useState(false);
  const [multiFileCount, setMultiFileCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replaceUnused, setReplaceUnused] = useState(false);
  const [restoredStagedCount, setRestoredStagedCount] = useState(initialStaged?.length ?? 0);
  const skipPreviewClearOnMount = useRef(true);

  const writeStaged = useCallback((items: StagedVoucherPdf[]) => {
    stagedRef.current = items;
    setRestoredStagedCount(items.length);
    if (hiddenRef.current) {
      hiddenRef.current.value = JSON.stringify(items);
      hiddenRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, []);

  const modeId = "voucher-pdf-import-mode";
  const fileInputId = "voucher-pdf-file";
  const multiFileInputId = "voucher-pdf-files";
  const skipId = "voucher-pdf-skip";
  const pagesId = "voucher-pdf-pages-per-ticket";

  modeRef.current = mode;

  const skipParsed = useMemo(() => parseSkipPageSpec(skipSpec), [skipSpec]);

  const previews = useMemo(() => {
    if (!skipParsed.ok) {
      return [];
    }
    return buildTicketPreviews(pageCount, skipParsed.pages, pagesPerTicket);
  }, [pageCount, pagesPerTicket, skipParsed]);

  useEffect(() => {
    previewsRef.current = previews;
    if (skipPreviewClearOnMount.current) {
      skipPreviewClearOnMount.current = false;
      return;
    }
    // Remount / step change has no local File — keep server- or draft-staged tickets.
    if (!masterFileRef.current && multiFilesRef.current.length === 0) {
      return;
    }
    writeStaged([]);
  }, [previews, writeStaged]);

  const clearStaged = useCallback(() => {
    writeStaged([]);
  }, [writeStaged]);

  const resetImportState = useCallback(() => {
    masterFileRef.current = null;
    multiFilesRef.current = [];
    setHasMasterFile(false);
    setMultiFileCount(0);
    setPageCount(0);
    setSkipSpec("");
    setPagesPerTicket(1);
    setError(null);
    clearStaged();
  }, [clearStaged]);

  useLayoutEffect(() => {
    function onApplied(event: Event) {
      const detail = (event as CustomEvent<FormDraftAppliedDetail>).detail;
      if (!detail?.fields) {
        return;
      }
      const raw = draftFieldValue(detail.fields, "voucher_pdfs_json");
      if (!raw) {
        return;
      }
      const staged = parseStagedVoucherPdfs(raw);
      if (staged && staged.length > 0) {
        writeStaged(staged);
        return;
      }
      if (stagedRef.current.length > 0 && hiddenRef.current) {
        hiddenRef.current.value = JSON.stringify(stagedRef.current);
      }
    }

    document.addEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    return () => {
      document.removeEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    };
  }, [writeStaged]);

  const uploadBlob = useCallback(
    async (
      blob: Blob,
      filename: string,
      pageLabel: string,
      originalFilename: string,
    ): Promise<StagedVoucherPdf> => {
      const formData = new FormData();
      formData.append("file", new File([blob], filename, { type: "application/pdf" }));
      formData.append("pageLabel", pageLabel);
      formData.append("originalFilename", originalFilename);
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
      return {
        objectKey: json.objectKey,
        originalFilename: json.originalFilename ?? originalFilename,
        pageLabel: json.pageLabel ?? pageLabel,
      };
    },
    [copy.voucherPdfUploadError, eventId, uploadPath],
  );

  const ensureStagedUploads = useCallback(async (): Promise<StagedVoucherPdf[]> => {
    if (modeRef.current === "files") {
      const files = multiFilesRef.current;
      if (files.length === 0) {
        return stagedRef.current;
      }
      if (stagedRef.current.length === files.length) {
        return stagedRef.current;
      }

      setBusy(true);
      setError(null);
      try {
        const uploaded: StagedVoucherPdf[] = [];
        for (const [index, file] of files.entries()) {
          const pageLabel = `file.${index + 1}`;
          const staged = await uploadBlob(file, file.name, pageLabel, file.name);
          uploaded.push(staged);
        }
        writeStaged(uploaded);
        return uploaded;
      } finally {
        setBusy(false);
      }
    }

    const file = masterFileRef.current;
    const currentPreviews = previewsRef.current;
    if (!file) {
      return stagedRef.current;
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
        const pageIndexes = preview.pages.map((page) => page - 1);
        const copied = await ticketDoc.copyPages(source, pageIndexes);
        for (const page of copied) {
          ticketDoc.addPage(page);
        }
        const ticketBytes = await ticketDoc.save();
        const blob = new Blob([Uint8Array.from(ticketBytes)], { type: "application/pdf" });
        const staged = await uploadBlob(
          blob,
          `${file.name.replace(/\.pdf$/i, "")}-${preview.pageLabel}.pdf`,
          preview.pageLabel,
          file.name,
        );
        uploaded.push(staged);
      }

      writeStaged(uploaded);
      return uploaded;
    } finally {
      setBusy(false);
    }
  }, [copy.voucherPdfZeroTickets, uploadBlob, writeStaged]);

  useEffect(() => {
    async function onSubmit(event: Event) {
      if (submittingRef.current) {
        return;
      }
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      const hidden = hiddenRef.current;
      if (!hidden || !form.contains(hidden)) {
        return;
      }

      if (modeRef.current === "files") {
        if (multiFilesRef.current.length === 0) {
          return;
        }
        event.preventDefault();
        try {
          await ensureStagedUploads();
          submittingRef.current = true;
          resubmitFormWithSubmitter(form, event);
        } catch (uploadError) {
          setError(uploadError instanceof Error ? uploadError.message : copy.voucherPdfUploadError);
        }
        return;
      }

      if (!masterFileRef.current) {
        return;
      }
      if (!skipParsed.ok) {
        event.preventDefault();
        setError(copy.voucherPdfSkipInvalid);
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
        resubmitFormWithSubmitter(form, event);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : copy.voucherPdfUploadError);
      }
    }

    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [
    copy.voucherPdfSkipInvalid,
    copy.voucherPdfUploadError,
    copy.voucherPdfZeroTickets,
    ensureStagedUploads,
    skipParsed.ok,
  ]);

  async function loadMasterPdf(next: File) {
    setError(null);
    setBusy(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await next.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      masterFileRef.current = next;
      setHasMasterFile(true);
      setPageCount(doc.getPageCount());
      clearStaged();
    } catch {
      masterFileRef.current = null;
      setHasMasterFile(false);
      setPageCount(0);
      setError(copy.voucherPdfLoadError);
    } finally {
      setBusy(false);
    }
  }

  function loadMultiFiles(fileList: FileList | null) {
    setError(null);
    const files = fileList ? Array.from(fileList).filter((file) => /\.pdf$/i.test(file.name)) : [];
    multiFilesRef.current = files;
    setMultiFileCount(files.length);
    clearStaged();
    if (fileList && fileList.length > 0 && files.length === 0) {
      setError(copy.voucherPdfLoadError);
    }
  }

  const ticketCount =
    restoredStagedCount > 0
      ? restoredStagedCount
      : mode === "files"
        ? multiFileCount
        : previews.length;
  const showZeroTickets =
    mode === "split" && hasMasterFile && skipParsed.ok && previews.length === 0;

  useEffect(() => {
    onInventoryPreviewChange?.({ incomingCount: ticketCount, replaceUnused });
  }, [onInventoryPreviewChange, replaceUnused, ticketCount]);

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      {isEdit && inventoryCounts ? (
        <Paragraph>
          {copy.voucherInventorySummary(inventoryCounts.available, inventoryCounts.allocated)}
        </Paragraph>
      ) : null}

      <Surface className="flex w-full flex-col gap-1" variant="transparent">
        <Label htmlFor={modeId}>{copy.voucherPdfModeLabel}</Label>
        <select
          className="admin-native-select"
          id={modeId}
          onChange={(event) => {
            const next = event.currentTarget.value === "files" ? "files" : "split";
            setMode(next);
            resetImportState();
          }}
          value={mode}
        >
          <option value="split">{copy.voucherPdfModeSplit}</option>
          <option value="files">{copy.voucherPdfModeFiles}</option>
        </select>
        <Description>
          {mode === "split" ? copy.voucherPdfModeSplitHint : copy.voucherPdfModeFilesHint}
        </Description>
      </Surface>

      {mode === "split" ? (
        <>
          <Surface className="flex flex-col gap-1" variant="transparent">
            <Label htmlFor={fileInputId}>{copy.voucherPdfFileLabel}</Label>
            <input
              accept="application/pdf,.pdf"
              className="admin-native-file"
              id={fileInputId}
              onChange={(event) => {
                const next = event.currentTarget.files?.[0];
                if (next) {
                  void loadMasterPdf(next);
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
                onChange={(event) => setSkipSpec(event.currentTarget.value)}
                placeholder={copy.voucherPdfSkipPlaceholder}
                type="text"
                value={skipSpec}
              />
              <Description>{copy.voucherPdfSkipHint}</Description>
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
          {!skipParsed.ok ? <Paragraph>{copy.voucherPdfSkipInvalid}</Paragraph> : null}
        </>
      ) : (
        <Surface className="flex flex-col gap-1" variant="transparent">
          <Label htmlFor={multiFileInputId}>{copy.voucherPdfFilesLabel}</Label>
          <input
            accept="application/pdf,.pdf"
            className="admin-native-file"
            id={multiFileInputId}
            multiple
            onChange={(event) => loadMultiFiles(event.currentTarget.files)}
            type="file"
          />
          <Description>{copy.voucherPdfFilesHint}</Description>
        </Surface>
      )}

      {ticketCount > 0 ? (
        <Paragraph>
          {mode === "files"
            ? copy.voucherPdfFilesPreviewCount(ticketCount)
            : copy.voucherPdfPreviewCount(ticketCount)}
        </Paragraph>
      ) : showZeroTickets ? (
        <Description>{copy.voucherPdfZeroTickets}</Description>
      ) : null}

      {error ? <Paragraph>{error}</Paragraph> : null}
      {busy ? <Description>{copy.voucherPdfBusy}</Description> : null}

      <input
        ref={hiddenRef}
        defaultValue={JSON.stringify(initialStaged ?? [])}
        name="voucher_pdfs_json"
        type="hidden"
      />

      {isEdit ? (
        <Surface className="flex flex-col gap-1" variant="transparent">
          <Surface className="onboarding-form__options" variant="transparent">
            <NativePreferenceOption
              label={copy.replaceUnusedInventoryLabel}
              name="replace_unused_inventory"
              onChange={(event) => setReplaceUnused(event.target.checked)}
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
