import { Button, Modal, Paragraph, Surface, useOverlayState } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { type EventDetailGalleryCopy, galleryPhotoAlt } from "../lib/event-detail-gallery-copy";
import type { PublicEventGalleryImage } from "../lib/public-event-gallery";

export type EventGallerySliderProps = {
  images: PublicEventGalleryImage[];
  copy: EventDetailGalleryCopy;
};

/**
 * Thumbnail grid + lightbox. Wrap-around prev/next for galleries ≤12.
 * Dismiss via backdrop click or Escape (no close control).
 * Read-only — no catalog mutations.
 */
export default function EventGallerySlider({ images, copy }: EventGallerySliderProps) {
  const modalState = useOverlayState();
  const [index, setIndex] = useState(0);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const wasOpenRef = useRef(false);
  const dismissHintId = useId();

  const openAt = (nextIndex: number) => {
    setIndex(nextIndex);
    modalState.open();
  };

  useEffect(() => {
    if (!modalState.isOpen || images.length === 0) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => (current - 1 + images.length) % images.length);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => (current + 1) % images.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalState.isOpen, images.length]);

  useEffect(() => {
    if (wasOpenRef.current && !modalState.isOpen) {
      triggerRefs.current[index]?.focus();
    }
    wasOpenRef.current = modalState.isOpen;
  }, [modalState.isOpen, index]);

  if (images.length === 0) {
    return null;
  }

  const active = images[index] ?? images[0];
  if (!active) {
    return null;
  }

  const showNav = images.length > 1;

  return (
    <Surface className="event-detail-gallery__slider" variant="transparent">
      <Surface
        className="event-detail-gallery__grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        variant="transparent"
      >
        {images.map((image, imageIndex) => {
          const alt = galleryPhotoAlt(copy, imageIndex + 1);
          return (
            <Button
              aria-label={alt}
              className="event-detail-gallery__thumb-button"
              key={image.imageId}
              onPress={() => openAt(imageIndex)}
              ref={(node) => {
                triggerRefs.current[imageIndex] = node;
              }}
            >
              <img
                alt={alt}
                className="event-detail-gallery__thumb"
                decoding="async"
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                src={image.thumbSrc}
                srcSet={image.thumbSrcSet}
              />
            </Button>
          );
        })}
      </Surface>

      <Modal state={modalState}>
        <Modal.Backdrop className="event-detail-gallery__backdrop" isDismissable variant="opaque">
          <Modal.Container placement="center" size="cover">
            <Modal.Dialog
              aria-describedby={dismissHintId}
              aria-label={copy.sectionTitle}
              className="event-detail-gallery__dialog"
            >
              <Modal.Body className="event-detail-gallery__dialog-body">
                <Paragraph className="sr-only" id={dismissHintId}>
                  {copy.closeLabel}
                </Paragraph>
                <Surface className="event-detail-gallery__stage" variant="transparent">
                  <img
                    alt={galleryPhotoAlt(copy, index + 1)}
                    className="event-detail-gallery__full"
                    decoding="async"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    src={active.fullSrc}
                    srcSet={active.fullSrcSet}
                  />
                </Surface>
                <Surface
                  className="event-detail-gallery__pager flex items-center justify-center gap-6"
                  variant="transparent"
                >
                  {showNav ? (
                    <Button
                      aria-label={copy.previousLabel}
                      className="event-detail-gallery__pager-link"
                      onPress={() =>
                        setIndex((current) => (current - 1 + images.length) % images.length)
                      }
                    >
                      <ChevronLeft aria-hidden size={16} strokeWidth={2.5} />
                      {copy.previousLabel}
                    </Button>
                  ) : null}
                  <Paragraph className="event-detail-gallery__counter">
                    {index + 1} / {images.length}
                  </Paragraph>
                  {showNav ? (
                    <Button
                      aria-label={copy.nextLabel}
                      className="event-detail-gallery__pager-link"
                      onPress={() => setIndex((current) => (current + 1) % images.length)}
                    >
                      {copy.nextLabel}
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
