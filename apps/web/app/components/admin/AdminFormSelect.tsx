"use client";

import { Input, Label, ListBox, Select } from "@heroui/react";
import type { Key, ReactNode } from "react";
import { useState } from "react";

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
  const [selectedKey, setSelectedKey] = useState(defaultSelectedKey ?? "");

  const handleChange = (key: Key | null) => {
    const next = key == null ? "" : String(key);
    setSelectedKey(next);
    onSelectionChange?.(next);
  };

  return (
    <AdminFormPopoverAnchor>
      {(portalContainer) => (
        <>
          {/* Hidden mirror: HeroUI Select may not re-emit name after remount (series confirm). */}
          <Input name={name} type="hidden" value={selectedKey} />
          <Select
            className="admin-form__select"
            defaultSelectedKey={defaultSelectedKey}
            fullWidth
            isRequired={isRequired}
            onChange={handleChange}
            selectionMode="single"
          >
            <AdminFormSelectContent
              label={label}
              options={options}
              placeholder={placeholder}
              portalContainer={portalContainer}
            />
          </Select>
        </>
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
  const [selectedKeys, setSelectedKeys] = useState<string[]>(defaultSelectedKeys);

  const handleChange = (keys: Key[]) => {
    const selected = keys.map(String);
    setSelectedKeys(selected);
    onSelectionChange?.(selected);
  };

  return (
    <AdminFormPopoverAnchor>
      {(portalContainer) => (
        <>
          {selectedKeys.map((key) => (
            <Input key={`${name}-${key}`} name={name} type="hidden" value={key} />
          ))}
          <Select
            className="admin-form__select"
            defaultValue={defaultSelectedKeys}
            fullWidth
            isRequired={isRequired}
            onChange={handleChange}
            selectionMode="multiple"
          >
            <AdminFormSelectContent
              label={label}
              options={options}
              placeholder={placeholder}
              portalContainer={portalContainer}
            />
          </Select>
        </>
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
