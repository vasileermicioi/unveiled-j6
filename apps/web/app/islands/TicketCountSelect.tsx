"use client";

import { Input, Label, ListBox, Select } from "@heroui/react";
import type { Key } from "react";
import { useState } from "react";

const TICKET_OPTIONS = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
];

type TicketCountSelectProps = {
  name: string;
  label: string;
  defaultValue?: string;
};

export default function TicketCountSelect({
  name,
  label,
  defaultValue = "1",
}: TicketCountSelectProps) {
  const [selectedKey, setSelectedKey] = useState(defaultValue);

  const handleChange = (key: Key | null) => {
    setSelectedKey(key == null ? "1" : String(key));
  };

  return (
    <>
      <Input name={name} type="hidden" value={selectedKey} />
      <Select
        defaultSelectedKey={defaultValue}
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
            {TICKET_OPTIONS.map((option) => (
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
