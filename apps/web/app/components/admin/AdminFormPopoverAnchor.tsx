"use client";

import { Surface } from "@heroui/react";
import { type ReactNode, useCallback, useState } from "react";

type AdminFormPopoverAnchorProps = {
  children: (portalContainer: HTMLElement | null) => ReactNode;
  className?: string;
};

export function AdminFormPopoverAnchor({
  children,
  className = "admin-form__popover-anchor w-full",
}: AdminFormPopoverAnchorProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const setAnchorRef = useCallback((node: HTMLElement | null) => {
    setPortalContainer(node);
  }, []);

  return (
    <Surface ref={setAnchorRef} className={className} variant="transparent">
      {children(portalContainer)}
    </Surface>
  );
}
