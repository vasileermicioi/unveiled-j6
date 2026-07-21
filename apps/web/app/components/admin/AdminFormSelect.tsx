"use client";

import { Label, Surface } from "@heroui/react";
import type { ChangeEvent } from "react";

export type AdminFormSelectOption = {
  id: string;
  label: string;
};

type AdminFormSelectBaseProps = {
  name: string;
  label: string;
  options: AdminFormSelectOption[];
  isRequired?: boolean;
  placeholder?: string;
};

type AdminFormSelectSingleProps = AdminFormSelectBaseProps & {
  selectionMode?: "single";
  defaultSelectedKey?: string;
  defaultSelectedKeys?: never;
  onSelectionChange?: (value: string) => void;
};

type AdminFormSelectMultipleProps = AdminFormSelectBaseProps & {
  selectionMode: "multiple";
  defaultSelectedKeys?: string[];
  defaultSelectedKey?: never;
  onSelectionChange?: (value: string[]) => void;
};

export type AdminFormSelectProps = AdminFormSelectSingleProps | AdminFormSelectMultipleProps;

function selectIdForName(name: string): string {
  return `admin-select-${name}`;
}

function AdminFormSelectSingle({
  name,
  label,
  options,
  defaultSelectedKey,
  isRequired = false,
  placeholder,
  onSelectionChange,
}: AdminFormSelectSingleProps) {
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

function AdminFormSelectMultiple({
  name,
  label,
  options,
  defaultSelectedKeys = [],
  isRequired = false,
  onSelectionChange,
}: AdminFormSelectMultipleProps) {
  const id = selectIdForName(name);
  const size = Math.min(Math.max(options.length, 3), 8);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions, (option) => option.value);
    onSelectionChange?.(selected);
  };

  return (
    <Surface className="flex w-full flex-col gap-1" variant="transparent">
      <Label htmlFor={id}>{label}</Label>
      <select
        className="admin-native-select admin-native-select--multiple"
        defaultValue={defaultSelectedKeys}
        id={id}
        multiple
        name={name}
        onChange={handleChange}
        required={isRequired}
        size={size}
      >
        {options.map((option) => (
          <option key={option.id === "" ? "__empty__" : option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </Surface>
  );
}

export function AdminFormSelect(props: AdminFormSelectProps) {
  if (props.selectionMode === "multiple") {
    return <AdminFormSelectMultiple {...props} />;
  }

  return <AdminFormSelectSingle {...props} />;
}
