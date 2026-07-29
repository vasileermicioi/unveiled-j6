"use client";

import { Description, Label, Paragraph, Surface } from "@heroui/react";
import { useMemo, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { NativePreferenceOption } from "../onboarding/NativePreferenceOption";

const PREVIEW_SAMPLE_LIMIT = 10;

export function parsePromoCodeLines(text: string): string[] {
  const codes: string[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const code = line.trim();
    if (!code || seen.has(code)) {
      continue;
    }
    seen.add(code);
    codes.push(code);
  }
  return codes;
}

type PromoCodeInventoryFieldsProps = {
  locale: Locale;
  isEdit?: boolean;
  inventoryCounts?: { available: number; allocated: number } | null;
};

export function PromoCodeInventoryFields({
  locale,
  isEdit = false,
  inventoryCounts = null,
}: PromoCodeInventoryFieldsProps) {
  const copy = getAdminCopy(locale);
  const [codes, setCodes] = useState<string[]>([]);
  const fileInputId = "promo-codes-file";
  const pasteId = "promo-codes-paste";

  const sample = useMemo(() => codes.slice(0, PREVIEW_SAMPLE_LIMIT), [codes]);

  function applyText(text: string) {
    setCodes(parsePromoCodeLines(text));
  }

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      {isEdit && inventoryCounts ? (
        <Paragraph>
          {copy.voucherInventorySummary(inventoryCounts.available, inventoryCounts.allocated)}
        </Paragraph>
      ) : null}

      <Surface className="flex flex-col gap-1" variant="transparent">
        <Label htmlFor={fileInputId}>{copy.promoCodesFileLabel}</Label>
        <input
          accept=".txt,.csv,text/plain,text/csv"
          className="admin-native-file"
          id={fileInputId}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) {
              return;
            }
            void file.text().then((text) => {
              const paste = document.getElementById(pasteId);
              if (paste instanceof HTMLTextAreaElement) {
                paste.value = text;
              }
              applyText(text);
            });
          }}
          type="file"
        />
        <Description>{copy.promoCodesFileHint}</Description>
      </Surface>

      <Surface className="flex flex-col gap-1" variant="transparent">
        <Label htmlFor={pasteId}>{copy.promoCodesPasteLabel}</Label>
        <textarea
          className="admin-native-textarea"
          id={pasteId}
          name="promo_codes_paste"
          onChange={(event) => applyText(event.currentTarget.value)}
          rows={4}
        />
        <Description>{copy.promoCodesPasteHint}</Description>
      </Surface>

      <input name="promo_codes_json" type="hidden" value={JSON.stringify(codes)} />

      {codes.length > 0 ? (
        <Surface className="flex flex-col gap-1" variant="transparent">
          <Paragraph>{copy.promoCodesPreviewCount(codes.length)}</Paragraph>
          <Paragraph>{sample.join(", ")}</Paragraph>
          {codes.length > PREVIEW_SAMPLE_LIMIT ? (
            <Description>
              {copy.promoCodesPreviewMore(codes.length - PREVIEW_SAMPLE_LIMIT)}
            </Description>
          ) : null}
        </Surface>
      ) : (
        <Description>{copy.promoCodesPreviewEmpty}</Description>
      )}

      {isEdit ? (
        <Surface className="flex flex-col gap-1" variant="transparent">
          <Surface className="onboarding-form__options" variant="transparent">
            <NativePreferenceOption
              label={copy.replaceUnusedInventoryLabel}
              name="replace_unused_inventory"
              type="checkbox"
              value="on"
            />
          </Surface>
          <Description>{copy.replaceUnusedInventoryHint}</Description>
        </Surface>
      ) : null}
    </Surface>
  );
}
