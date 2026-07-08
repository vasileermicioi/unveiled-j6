"use client";

import { Label, NumberField } from "@heroui/react";

type AdminFormNumberFieldProps = {
  name: string;
  label: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  isRequired?: boolean;
};

export function AdminFormNumberField({
  name,
  label,
  defaultValue,
  minValue = 1,
  maxValue,
  isRequired = false,
}: AdminFormNumberFieldProps) {
  return (
    <NumberField
      className="admin-form__number-field"
      defaultValue={defaultValue}
      fullWidth
      isRequired={isRequired}
      maxValue={maxValue}
      minValue={minValue}
      name={name}
      variant="secondary"
    >
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton>-</NumberField.DecrementButton>
        <NumberField.Input />
        <NumberField.IncrementButton>+</NumberField.IncrementButton>
      </NumberField.Group>
    </NumberField>
  );
}
