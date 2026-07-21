import { Label } from "@heroui/react";

type NativePreferenceOptionProps = {
  type: "checkbox" | "radio";
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
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
  defaultChecked = false,
}: NativePreferenceOptionProps) {
  const id = optionId(name, value);

  return (
    <Label className="onboarding-form__option" htmlFor={id}>
      <input
        className="onboarding-form__native-control"
        defaultChecked={defaultChecked}
        id={id}
        name={name}
        type={type}
        value={value}
      />
      <span className="onboarding-form__option-text">{label}</span>
    </Label>
  );
}
