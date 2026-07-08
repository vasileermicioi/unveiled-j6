"use client";

import { Label, ListBox, Select } from "@heroui/react";
import type { Key, ReactNode } from "react";

import { AdminFormPopoverAnchor } from "./AdminFormPopoverAnchor";

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

function AdminFormSelectContent({
  label,
  options,
  placeholder,
  portalContainer,
}: {
  label: string;
  options: AdminFormSelectOption[];
  placeholder?: string;
  portalContainer: HTMLElement | null;
}): ReactNode {
  return (
    <>
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value>
          {placeholder
            ? ({ isPlaceholder, selectedText }) => (isPlaceholder ? placeholder : selectedText)
            : undefined}
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover
        UNSTABLE_portalContainer={portalContainer ?? undefined}
        className="admin-form__select-popover"
        placement="bottom start"
      >
        <ListBox>
          {options.map((option) => (
            <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </>
  );
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
  const handleSingleSelectionChange = (key: Key | null) => {
    if (!onSelectionChange) {
      return;
    }

    onSelectionChange(key == null ? "" : String(key));
  };

  return (
    <AdminFormPopoverAnchor>
      {(portalContainer) => (
        <Select
          className="admin-form__select"
          defaultSelectedKey={defaultSelectedKey}
          fullWidth
          isRequired={isRequired}
          name={name}
          onSelectionChange={onSelectionChange ? handleSingleSelectionChange : undefined}
          selectionMode="single"
        >
          <AdminFormSelectContent
            label={label}
            options={options}
            placeholder={placeholder}
            portalContainer={portalContainer}
          />
        </Select>
      )}
    </AdminFormPopoverAnchor>
  );
}

function AdminFormSelectMultiple({
  name,
  label,
  options,
  defaultSelectedKeys = [],
  isRequired = false,
  placeholder,
  onSelectionChange,
}: AdminFormSelectMultipleProps) {
  const handleMultipleSelectionChange = (keys: Key | "all" | Set<Key> | null) => {
    if (!onSelectionChange) {
      return;
    }

    const selected =
      keys === "all"
        ? options.map((option) => option.id)
        : keys instanceof Set
          ? [...keys].map(String)
          : [];
    onSelectionChange(selected);
  };

  return (
    <AdminFormPopoverAnchor>
      {(portalContainer) => (
        <Select
          className="admin-form__select"
          defaultValue={defaultSelectedKeys}
          fullWidth
          isRequired={isRequired}
          name={name}
          onSelectionChange={onSelectionChange ? handleMultipleSelectionChange : undefined}
          selectionMode="multiple"
        >
          <AdminFormSelectContent
            label={label}
            options={options}
            placeholder={placeholder}
            portalContainer={portalContainer}
          />
        </Select>
      )}
    </AdminFormPopoverAnchor>
  );
}

export function AdminFormSelect(props: AdminFormSelectProps) {
  if (props.selectionMode === "multiple") {
    return <AdminFormSelectMultiple {...props} />;
  }

  return <AdminFormSelectSingle {...props} />;
}
