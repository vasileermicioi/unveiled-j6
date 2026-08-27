import { Button, Label, Surface } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

type RevealSecretIslandProps = {
  value: string;
  copyLabel: string;
  copiedLabel: string;
  showLabel: string;
  hideLabel: string;
  /** Optional accessible name for the code field. */
  codeLabel?: string;
};

export default function RevealSecretIsland({
  value,
  copyLabel,
  copiedLabel,
  showLabel,
  hideLabel,
  codeLabel,
}: RevealSecretIslandProps) {
  const inputId = useId();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      {codeLabel ? <Label htmlFor={inputId}>{codeLabel}</Label> : null}
      <Surface className="flex flex-wrap items-center gap-2" variant="transparent">
        <input
          autoComplete="off"
          className="admin-native-number min-w-0 flex-1"
          id={inputId}
          readOnly
          spellCheck={false}
          type={revealed ? "text" : "password"}
          value={value}
        />
        <Button
          aria-label={revealed ? hideLabel : showLabel}
          className="button button--secondary button--md"
          onPress={() => setRevealed((prev) => !prev)}
          type="button"
        >
          {revealed ? (
            <EyeOff
              aria-hidden
              className="site-nav-icon-button__icon"
              size={18}
              strokeWidth={2.25}
            />
          ) : (
            <Eye aria-hidden className="site-nav-icon-button__icon" size={18} strokeWidth={2.25} />
          )}
        </Button>
        <Button className="button button--secondary button--md" onPress={onCopy} type="button">
          {copied ? copiedLabel : copyLabel}
        </Button>
      </Surface>
    </Surface>
  );
}
