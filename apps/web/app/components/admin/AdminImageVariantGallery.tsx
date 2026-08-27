import { Button, Description, Modal, Paragraph, Surface, useOverlayState } from "@heroui/react";
import { buildVariantUrl } from "@unveiled/images/urls";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import { imageAltWithCredit, imageCreditTitle } from "../../lib/image-credit";
import type { Locale } from "../../lib/locale";

import { ImageCreditNote } from "../ImageCreditNote";
import { AdminImageCreditField } from "./AdminImageCreditField";

import {
  type ProcessedAdminUpload,
  VARIANT_FILENAMES,
  type VariantFilename,
  variantSizeLabel,
} from "./admin-image-variants";

export type AdminImageVariantGalleryProps = {
  locale: Locale;
  /** Newly processed upload — blob previews. */
  processed?: ProcessedAdminUpload | null;
  /** Existing attached image id — public CDN URLs. */
  imageId?: string | null;
  /** Public base (no trailing slash); required with `imageId` on the client. */
  imagePublicBaseUrl?: string | null;
  /** Optional heading override. */
  label?: string;
  /**
   * When true, show a single representative thumb in the grid; the lightbox still
   * pages through all size variants. Used for multi-file gallery upload previews.
   */
  compact?: boolean;
  /** Stored `images.credit` — thumbnail `title` + lightbox `alt`/`title` + footer. */
  credit?: string | null;
};

type GalleryTile = {
  filename: VariantFilename;
  src: string;
  label: string;
};

function resolvePublicUrl(
  imageId: string,
  filename: VariantFilename,
  imagePublicBaseUrl: string | null | undefined,
): string | null {
  if (imagePublicBaseUrl && imagePublicBaseUrl.trim().length > 0) {
    const base = imagePublicBaseUrl.replace(/\/$/, "");
    return `${base}/images/${imageId}/${filename}`;
  }
  try {
    return buildVariantUrl(imageId, filename);
  } catch {
    return null;
  }
}

const COMPACT_PREVIEW_FILENAME: VariantFilename = "medium-640.webp";

export function AdminImageVariantGallery({
  locale,
  processed = null,
  imageId = null,
  imagePublicBaseUrl = null,
  label,
  compact = false,
  credit = null,
}: AdminImageVariantGalleryProps) {
  const copy = getAdminCopy(locale);
  const modalState = useOverlayState();
  const [index, setIndex] = useState(0);
  const [blobUrls, setBlobUrls] = useState<Partial<Record<VariantFilename, string>>>({});
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const wasOpenRef = useRef(false);
  const dismissHintId = useId();

  useEffect(() => {
    if (!processed) {
      setBlobUrls({});
      return;
    }

    const next: Partial<Record<VariantFilename, string>> = {};
    const created: string[] = [];
    for (const filename of VARIANT_FILENAMES) {
      const blob = processed.variants[filename];
      if (!(blob instanceof Blob) || blob.size === 0) {
        continue;
      }
      const url = URL.createObjectURL(blob);
      next[filename] = url;
      created.push(url);
    }
    setBlobUrls(next);

    return () => {
      for (const url of created) {
        URL.revokeObjectURL(url);
      }
    };
  }, [processed]);

  const tiles = useMemo((): GalleryTile[] => {
    const mapped = (() => {
      if (processed) {
        return VARIANT_FILENAMES.map((filename) => ({
          filename,
          src: blobUrls[filename] ?? null,
          label: variantSizeLabel(filename),
        }));
      }

      if (imageId) {
        return VARIANT_FILENAMES.map((filename) => ({
          filename,
          src: resolvePublicUrl(imageId, filename, imagePublicBaseUrl),
          label: variantSizeLabel(filename),
        }));
      }

      return [];
    })();

    return mapped.filter((tile): tile is GalleryTile => Boolean(tile.src));
  }, [blobUrls, imageId, imagePublicBaseUrl, processed]);

  const gridTiles = useMemo((): GalleryTile[] => {
    if (!compact || tiles.length === 0) {
      return tiles;
    }
    const preferred =
      tiles.find((tile) => tile.filename === COMPACT_PREVIEW_FILENAME) ?? tiles[0] ?? null;
    return preferred ? [preferred] : [];
  }, [compact, tiles]);

  const openAt = (nextIndex: number) => {
    setIndex(nextIndex);
    modalState.open();
  };

  const openCompact = () => {
    const preferredIndex = tiles.findIndex((tile) => tile.filename === COMPACT_PREVIEW_FILENAME);
    openAt(preferredIndex >= 0 ? preferredIndex : 0);
  };

  useEffect(() => {
    if (!modalState.isOpen || tiles.length === 0) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => (current - 1 + tiles.length) % tiles.length);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => (current + 1) % tiles.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalState.isOpen, tiles.length]);

  useEffect(() => {
    if (wasOpenRef.current && !modalState.isOpen) {
      triggerRefs.current[compact ? 0 : index]?.focus();
    }
    wasOpenRef.current = modalState.isOpen;
  }, [modalState.isOpen, index, compact]);

  if (tiles.length === 0 || gridTiles.length === 0) {
    return null;
  }

  const active = tiles[index] ?? tiles[0];
  if (!active) {
    return null;
  }

  const showNav = tiles.length > 1;
  const heading = label ?? copy.imageVariantGalleryLabel;

  return (
    <Surface className="admin-image-variant-gallery flex flex-col gap-3" variant="transparent">
      {compact ? null : (
        <Paragraph className="admin-image-variant-gallery__heading">{heading}</Paragraph>
      )}
      <Surface
        className={
          compact
            ? "admin-image-variant-gallery__grid admin-image-variant-gallery__grid--compact"
            : "admin-image-variant-gallery__grid"
        }
        variant="transparent"
      >
        {gridTiles.map((tile, tileIndex) => (
          <Surface
            className="admin-image-variant-gallery__tile"
            key={tile.filename}
            variant="transparent"
          >
            <Button
              aria-label={
                compact
                  ? copy.imageVariantOpenLabel(heading)
                  : copy.imageVariantOpenLabel(tile.label)
              }
              className="admin-image-variant-gallery__thumb-button"
              onPress={() => (compact ? openCompact() : openAt(tileIndex))}
              ref={(node) => {
                triggerRefs.current[tileIndex] = node;
              }}
              type="button"
            >
              <img
                alt=""
                className="admin-image-variant-gallery__img"
                src={tile.src}
                title={imageCreditTitle(credit)}
              />
            </Button>
            <Description className="admin-image-variant-gallery__label">
              {compact ? heading : tile.label}
            </Description>
          </Surface>
        ))}
      </Surface>

      <Modal state={modalState}>
        <Modal.Backdrop className="event-detail-gallery__backdrop" isDismissable variant="opaque">
          <Modal.Container placement="center" size="cover">
            <Modal.Dialog
              aria-describedby={dismissHintId}
              aria-label={heading}
              className="event-detail-gallery__dialog"
            >
              <Modal.Body className="event-detail-gallery__dialog-body">
                <Paragraph className="sr-only" id={dismissHintId}>
                  {copy.imageVariantCloseHint}
                </Paragraph>
                <Surface className="event-detail-gallery__stage" variant="transparent">
                  <Surface
                    className="image-credit-photo event-detail-gallery__photo"
                    variant="transparent"
                  >
                    <img
                      alt={imageAltWithCredit(active.label, credit)}
                      className="event-detail-gallery__full"
                      decoding="async"
                      src={active.src}
                      title={imageCreditTitle(credit)}
                    />
                    <ImageCreditNote className="event-detail-gallery__credit" credit={credit} />
                  </Surface>
                </Surface>
                <Surface
                  className="event-detail-gallery__pager flex items-center justify-center gap-6"
                  variant="transparent"
                >
                  {showNav ? (
                    <Button
                      aria-label={copy.imageVariantPreviousLabel}
                      className="event-detail-gallery__pager-link"
                      onPress={() =>
                        setIndex((current) => (current - 1 + tiles.length) % tiles.length)
                      }
                      type="button"
                    >
                      <ChevronLeft aria-hidden size={16} strokeWidth={2.5} />
                      {copy.imageVariantPreviousLabel}
                    </Button>
                  ) : null}
                  <Paragraph className="event-detail-gallery__counter">
                    {active.label} · {index + 1} / {tiles.length}
                  </Paragraph>
                  {showNav ? (
                    <Button
                      aria-label={copy.imageVariantNextLabel}
                      className="event-detail-gallery__pager-link"
                      onPress={() => setIndex((current) => (current + 1) % tiles.length)}
                      type="button"
                    >
                      {copy.imageVariantNextLabel}
                      <ChevronRight aria-hidden size={16} strokeWidth={2.5} />
                    </Button>
                  ) : null}
                </Surface>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Surface>
  );
}

/** Multi-file summary: one preview thumb per photo; single file keeps the size ladder. */
export function AdminImageVariantGallerySummary({
  locale,
  processedList,
  includeCreditFields = false,
  creditDefaults,
}: {
  locale: Locale;
  processedList: ProcessedAdminUpload[];
  /** Gallery add: one `image_credit_{index}` field per processed file. */
  includeCreditFields?: boolean;
  creditDefaults?: readonly (string | undefined)[];
}) {
  const copy = getAdminCopy(locale);
  if (processedList.length === 0) {
    return null;
  }

  if (processedList.length === 1) {
    const only = processedList[0];
    if (!only) {
      return null;
    }
    return (
      <Surface className="flex flex-col gap-3" variant="transparent">
        <AdminImageVariantGallery locale={locale} processed={only} />
        {includeCreditFields ? (
          <AdminImageCreditField
            defaultValue={creditDefaults?.[0] ?? ""}
            locale={locale}
            name="image_credit_0"
          />
        ) : null}
      </Surface>
    );
  }

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      <Description>{copy.gallerySelectedFilesLabel(processedList.length)}</Description>
      <Surface className="admin-gallery-multi-preview__grid" variant="transparent">
        {processedList.map((item, index) => (
          <Surface className="flex flex-col gap-2" key={item.imageId} variant="transparent">
            <AdminImageVariantGallery
              compact
              label={copy.galleryPhotoLabel(index + 1)}
              locale={locale}
              processed={item}
            />
            {includeCreditFields ? (
              <AdminImageCreditField
                defaultValue={creditDefaults?.[index] ?? ""}
                locale={locale}
                name={`image_credit_${index}`}
              />
            ) : null}
          </Surface>
        ))}
      </Surface>
    </Surface>
  );
}
