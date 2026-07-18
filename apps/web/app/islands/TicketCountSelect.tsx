"use client";

import { Input, Label, ListBox, Select } from "@heroui/react";
import type { Key } from "react";
import { useState } from "react";

type TicketCountSelectProps = {
  name: string;
  label: string;
  defaultValue?: string;
  /** Inclusive upper bound for Select options (1..maxQty). Defaults to 3. */
  maxQty?: number;
};

function buildTicketOptions(maxQty: number): { id: string; label: string }[] {
  const upper = Math.max(1, Math.trunc(maxQty));
  return Array.from({ length: upper }, (_, index) => {
    const value = String(index + 1);
    return { id: value, label: value };
  });
}

function clampDefaultValue(defaultValue: string, maxQty: number): string {
  const n = Number.parseInt(defaultValue, 10);
  const upper = Math.max(1, Math.trunc(maxQty));
  if (!Number.isFinite(n) || n < 1) {
    return "1";
  }
  return String(Math.min(n, upper));
}

export default function TicketCountSelect({
  name,
  label,
  defaultValue = "1",
  maxQty = 3,
}: TicketCountSelectProps) {
  const options = buildTicketOptions(maxQty);
  const initial = clampDefaultValue(defaultValue, maxQty);
  const [selectedKey, setSelectedKey] = useState(initial);

  const handleChange = (key: Key | null) => {
    setSelectedKey(key == null ? "1" : String(key));
  };

  return (
    <>
      <Input name={name} type="hidden" value={selectedKey} />
      <Select
        defaultSelectedKey={initial}
        fullWidth
        isRequired
        onChange={handleChange}
        selectionMode="single"
      >
        <Label>{label}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover placement="bottom start">
          <ListBox>
            {options.map((option) => (
              <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                {option.label}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </>
  );
}
