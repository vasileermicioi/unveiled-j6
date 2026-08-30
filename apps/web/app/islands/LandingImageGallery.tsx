import { Button, Surface } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import type { LandingGalleryImage } from "../components/marketing/landing/assets";

export type LandingImageGalleryProps = {
  images: LandingGalleryImage[];
  alt: string;
  autoplayMs?: number;
  showNav?: boolean;
  previousLabel: string;
  nextLabel: string;
};

export default function LandingImageGallery({
  images,
  alt,
  autoplayMs = 0,
  showNav = false,
  previousLabel,
  nextLabel,
}: LandingImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const active = images[index] ?? images[0];

  useEffect(() => {
    if (count <= 1 || autoplayMs <= 0) {
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplayMs, count]);

  if (!active) {
    return null;
  }

  const showControls = count > 1;

  return (
    <Surface className="landing-gallery" variant="transparent">
      {images.map((image, imageIndex) => {
        const isActive = imageIndex === index;
        const className = [
          "landing-gallery__img",
          image.contain ? "landing-gallery__img--contain" : "",
          isActive ? "landing-gallery__img--active" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <img
            alt={isActive ? alt : ""}
            aria-hidden={isActive ? undefined : true}
            className={className}
            decoding="async"
            key={image.src}
            loading={imageIndex === 0 ? "eager" : "lazy"}
            src={image.src}
            style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
          />
        );
      })}
      {showControls && showNav ? (
        <>
          <Button
            aria-label={previousLabel}
            className="landing-gallery__nav landing-gallery__nav--prev"
            onPress={() => setIndex((current) => (current - 1 + count) % count)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ChevronLeft aria-hidden size={18} strokeWidth={2.5} />
          </Button>
          <Button
            aria-label={nextLabel}
            className="landing-gallery__nav landing-gallery__nav--next"
            onPress={() => setIndex((current) => (current + 1) % count)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ChevronRight aria-hidden size={18} strokeWidth={2.5} />
          </Button>
        </>
      ) : null}
      {showControls ? (
        <Surface className="landing-gallery__dots" variant="transparent">
          {images.map((image, imageIndex) => (
            <Button
              aria-current={imageIndex === index ? "true" : undefined}
              aria-label={`${imageIndex + 1} / ${count}`}
              className={
                imageIndex === index
                  ? "landing-gallery__dot landing-gallery__dot--active"
                  : "landing-gallery__dot"
              }
              key={`${image.src}-dot`}
              onPress={() => setIndex(imageIndex)}
              size="sm"
              type="button"
            />
          ))}
        </Surface>
      ) : null}
    </Surface>
  );
}
