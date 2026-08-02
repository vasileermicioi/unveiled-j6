import { Label } from "@heroui/react";
import type { ChangeEventHandler } from "react";

type NativePreferenceOptionProps = {
  type: "checkbox" | "radio";
  name: string;
  value: string;
  /** Visible option text (e.g. Yes). */
  label: string;
  /** Accessible name when the visible label is generic (e.g. field title). */
  inputLabel?: string;
  defaultChecked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

function optionId(name: string, value: string): string {
  return `${name}-${value}`.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

/** Native checkbox/radio row for onboarding + profile preferences (AGENTS §14 exception). */
export function NativePreferenceOption({
  type,
  name,
  value,
  label,
  inputLabel,
  defaultChecked = false,
  onChange,
}: NativePreferenceOptionProps) {
  const id = optionId(name, value);

  return (
    <Label className="onboarding-form__option" htmlFor={id}>
      <input
        aria-label={inputLabel}
        className="onboarding-form__native-control"
        defaultChecked={defaultChecked}
        id={id}
        name={name}
        onChange={onChange}
        type={type}
        value={value}
      />
      <span className="onboarding-form__option-text">{label}</span>
    </Label>
  );
}
