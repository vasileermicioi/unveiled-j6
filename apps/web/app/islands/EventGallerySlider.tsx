import { Button, Modal, Surface, useOverlayState } from "@heroui/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { EventDetailGalleryCopy } from "../lib/event-detail-gallery-copy";
import type { PublicEventGalleryImage } from "../lib/public-event-gallery";

export type EventGallerySliderProps = {
  images: PublicEventGalleryImage[];
  copy: EventDetailGalleryCopy;
};

/**
 * Thumbnail grid + lightbox. Wrap-around prev/next for galleries ≤12.
 * Read-only — no catalog mutations.
 */
export default function EventGallerySlider({ images, copy }: EventGallerySliderProps) {
  const modalState = useOverlayState();
  const [index, setIndex] = useState(0);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const wasOpenRef = useRef(false);

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

  return (
    <Surface className="event-detail-gallery__slider" variant="transparent">
      <Surface
        className="event-detail-gallery__grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        variant="transparent"
      >
        {images.map((image, imageIndex) => (
          <Button
            aria-label={copy.photoAlt(imageIndex + 1)}
            className="event-detail-gallery__thumb-button"
            key={image.imageId}
            onPress={() => openAt(imageIndex)}
            ref={(node) => {
              triggerRefs.current[imageIndex] = node;
            }}
          >
            <img
              alt={copy.photoAlt(imageIndex + 1)}
              className="event-detail-gallery__thumb"
              decoding="async"
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              src={image.thumbSrc}
              srcSet={image.thumbSrcSet}
            />
          </Button>
        ))}
      </Surface>

      <Modal state={modalState}>
        <Modal.Backdrop isDismissable variant="blur">
          <Modal.Container placement="center" size="cover">
            <Modal.Dialog aria-label={copy.sectionTitle} className="event-detail-gallery__dialog">
              <Modal.Header className="event-detail-gallery__dialog-header flex items-center justify-end">
                <Modal.CloseTrigger
                  aria-label={copy.closeLabel}
                  className="button button--secondary button--md"
                >
                  <X aria-hidden size={20} strokeWidth={2.25} />
                </Modal.CloseTrigger>
              </Modal.Header>
              <Modal.Body className="event-detail-gallery__dialog-body flex flex-col gap-4">
                <Surface className="event-detail-gallery__stage" variant="transparent">
                  <img
                    alt={copy.photoAlt(index + 1)}
                    className="event-detail-gallery__full"
                    decoding="async"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    src={active.fullSrc}
                    srcSet={active.fullSrcSet}
                  />
                </Surface>
                {images.length > 1 ? (
                  <Surface
                    className="event-detail-gallery__controls flex items-center justify-between gap-3"
                    variant="transparent"
                  >
                    <Button
                      aria-label={copy.previousLabel}
                      className="button button--secondary button--md"
                      onPress={() =>
                        setIndex((current) => (current - 1 + images.length) % images.length)
                      }
                    >
                      <ChevronLeft aria-hidden size={20} strokeWidth={2.25} />
                    </Button>
                    <Button
                      aria-label={copy.nextLabel}
                      className="button button--secondary button--md"
                      onPress={() => setIndex((current) => (current + 1) % images.length)}
                    >
                      <ChevronRight aria-hidden size={20} strokeWidth={2.25} />
                    </Button>
                  </Surface>
                ) : null}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Surface>
  );
}
