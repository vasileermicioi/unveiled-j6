"use client";

import { Label, Surface } from "@heroui/react";
import type { ChangeEvent } from "react";

export type AdminFormSelectOption = {
  id: string;
  label: string;
};

export type AdminFormSelectProps = {
  name: string;
  label: string;
  options: AdminFormSelectOption[];
  isRequired?: boolean;
  placeholder?: string;
  /** Single-value only — multi-value fields use `CheckboxMultiSelect`. */
  selectionMode?: "single";
  defaultSelectedKey?: string;
  onSelectionChange?: (value: string) => void;
};

function selectIdForName(name: string): string {
  return `admin-select-${name}`;
}

export function AdminFormSelect({
  name,
  label,
  options,
  defaultSelectedKey,
  isRequired = false,
  placeholder,
  onSelectionChange,
}: AdminFormSelectProps) {
  const id = selectIdForName(name);
  const defaultValue = defaultSelectedKey ?? "";
  const showPlaceholder = Boolean(placeholder) && !options.some((option) => option.id === "");

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelectionChange?.(event.target.value);
  };

  return (
    <Surface className="flex w-full flex-col gap-1" variant="transparent">
      <Label htmlFor={id}>{label}</Label>
      <select
        className="admin-native-select"
        defaultValue={defaultValue}
        id={id}
        name={name}
        onChange={handleChange}
        required={isRequired}
      >
        {showPlaceholder ? (
          <option disabled={isRequired} value="">
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.id === "" ? "__empty__" : option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </Surface>
  );
}
