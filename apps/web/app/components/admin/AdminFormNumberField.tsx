import { Label, Surface } from "@heroui/react";

type AdminFormNumberFieldProps = {
  name: string;
  label: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  isRequired?: boolean;
};

function numberIdForName(name: string): string {
  return `admin-number-${name}`;
}

export function AdminFormNumberField({
  name,
  label,
  defaultValue,
  minValue = 1,
  maxValue,
  step = 1,
  isRequired = false,
}: AdminFormNumberFieldProps) {
  const id = numberIdForName(name);

  return (
    <Surface className="flex w-full flex-col gap-1" variant="transparent">
      <Label htmlFor={id}>{label}</Label>
      <input
        className="admin-native-number"
        defaultValue={defaultValue}
        id={id}
        max={maxValue}
        min={minValue}
        name={name}
        required={isRequired}
        step={step}
        type="number"
      />
    </Surface>
  );
}
