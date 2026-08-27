import { Button, Form, Input, Label, Link, Surface, TextField } from "@heroui/react";
import type { ReactNode } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

type AdminSearchFormProps = {
  locale: Locale;
  action: string;
  defaultQuery?: string;
  /** Overrides the default events-oriented search placeholder/label. */
  placeholder?: string;
  /** Overrides the default Search / Suchen submit label. */
  submitLabel?: string;
  /** Hidden GET fields preserved across search submit (e.g. sort/dir). */
  preserveParams?: Record<string, string>;
  /** Clears search + sort when present (shown beside submit). */
  resetHref?: string;
  children?: ReactNode;
};

export function AdminSearchForm({
  locale,
  action,
  defaultQuery = "",
  placeholder,
  submitLabel,
  preserveParams,
  resetHref,
  children,
}: AdminSearchFormProps) {
  const copy = getAdminCopy(locale);
  const label = placeholder ?? copy.searchPlaceholder;

  return (
    <Form
      action={action}
      className="admin-list-filters flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-end"
      method="get"
    >
      {preserveParams
        ? Object.entries(preserveParams).map(([name, value]) => (
            <Input key={name} name={name} type="hidden" value={value} />
          ))
        : null}
      <TextField
        className="w-full lg:min-w-0 lg:max-w-xs lg:flex-1"
        defaultValue={defaultQuery}
        fullWidth
        name="q"
      >
        <Label htmlFor="admin-search">{label}</Label>
        <Input id="admin-search" placeholder={label} type="search" />
      </TextField>
      {children}
      <Surface className="flex shrink-0 flex-wrap gap-2" variant="transparent">
        <Button className="button button--secondary button--md shrink-0" type="submit">
          {submitLabel ?? copy.searchSubmit}
        </Button>
        {resetHref ? (
          <Link className="button button--secondary button--md shrink-0" href={resetHref}>
            {copy.resetFilters}
          </Link>
        ) : null}
      </Surface>
    </Form>
  );
}
