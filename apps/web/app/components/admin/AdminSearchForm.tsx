"use client";

import { Button, Form, Input, Label, Surface } from "@heroui/react";

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
      <Surface className="flex w-full flex-col gap-2 sm:max-w-md" variant="transparent">
        <Label htmlFor="admin-search">{copy.searchPlaceholder}</Label>
        <Input
          defaultValue={defaultQuery}
          id="admin-search"
          name="q"
          placeholder={copy.searchPlaceholder}
          type="search"
        />
      </Surface>
      <Button className="button button--secondary button--md" type="submit">
        {copy.searchSubmit}
      </Button>
    </Form>
  );
}
