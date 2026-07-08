"use client";

import { Button, Form, Input, Label, TextField } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

type AdminSearchFormProps = {
  locale: Locale;
  action: string;
  defaultQuery?: string;
};

export function AdminSearchForm({ locale, action, defaultQuery = "" }: AdminSearchFormProps) {
  const copy = getAdminCopy(locale);

  return (
    <Form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
      <TextField className="w-full sm:max-w-md" defaultValue={defaultQuery} fullWidth name="q">
        <Label htmlFor="admin-search">{copy.searchPlaceholder}</Label>
        <Input id="admin-search" placeholder={copy.searchPlaceholder} type="search" />
      </TextField>
      <Button className="button button--secondary button--md" type="submit">
        {copy.searchSubmit}
      </Button>
    </Form>
  );
}
