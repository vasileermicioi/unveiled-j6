import { Label, Surface } from "@heroui/react";

type AdminFormNumberFieldProps = {
  name: string;
  label: string;
  defaultValue?: number;
  value?: number | string;
  onChange?: (value: string) => void;
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
  value,
  onChange,
  minValue = 1,
  maxValue,
  step = 1,
  isRequired = false,
}: AdminFormNumberFieldProps) {
  const id = numberIdForName(name);
  const controlled = onChange !== undefined;

  return (
    <Surface className="admin-form__native-field w-full" variant="transparent">
      <Label htmlFor={id}>{label}</Label>
      <input
        className="admin-native-number"
        defaultValue={controlled ? undefined : defaultValue}
        id={id}
        max={maxValue}
        min={minValue}
        name={name}
        onChange={controlled ? (event) => onChange(event.target.value) : undefined}
        required={isRequired}
        step={step}
        type="number"
        value={controlled ? value : undefined}
      />
    </Surface>
  );
}
