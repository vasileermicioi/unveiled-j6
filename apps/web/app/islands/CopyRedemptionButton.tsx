"use client";

import { Button } from "@heroui/react";
import { useState } from "react";

type CopyRedemptionButtonProps = {
  value: string;
  copyLabel: string;
  copiedLabel: string;
};

export default function CopyRedemptionButton({
  value,
  copyLabel,
  copiedLabel,
}: CopyRedemptionButtonProps) {
  const [copied, setCopied] = useState(false);

  const onPress = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button className="button button--secondary button--md" onPress={onPress} type="button">
      {copied ? copiedLabel : copyLabel}
    </Button>
  );
}
