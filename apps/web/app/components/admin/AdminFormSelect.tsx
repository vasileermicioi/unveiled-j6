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
  /** When > 1, renders a native list box (`size`) instead of a dropdown. */
  listSize?: number;
  /** Single-value only — multi-value fields use `CheckboxMultiSelect`. */
  selectionMode?: "single";
  defaultSelectedKey?: string;
  onSelectionChange?: (value: string) => void;
  /** Layout-only Tailwind classes for the wrapper (e.g. toolbar width). */
  className?: string;
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
  listSize,
  onSelectionChange,
  className,
}: AdminFormSelectProps) {
  const id = selectIdForName(name);
  const defaultValue = defaultSelectedKey ?? "";
  const showPlaceholder = Boolean(placeholder) && !options.some((option) => option.id === "");
  const useListBox = typeof listSize === "number" && listSize > 1;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelectionChange?.(event.target.value);
  };

  return (
    <Surface
      className={["flex w-full flex-col gap-1", className].filter(Boolean).join(" ")}
      variant="transparent"
    >
      <Label htmlFor={id}>{label}</Label>
      <select
        className={
          useListBox ? "admin-native-select admin-native-select--multiple" : "admin-native-select"
        }
        data-option-count={options.length}
        defaultValue={defaultValue}
        id={id}
        name={name}
        onChange={handleChange}
        required={isRequired}
        size={useListBox ? listSize : undefined}
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
