import { Label, Surface } from "@heroui/react";

type TicketCountSelectProps = {
  name: string;
  label: string;
  defaultValue?: string;
  /** Inclusive upper bound for select options (1..maxQty). Defaults to 3. */
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

/** Native ticket quantity select for book/waitlist SSR forms (Discover filter precedent). */
export default function TicketCountSelect({
  name,
  label,
  defaultValue = "1",
  maxQty = 3,
}: TicketCountSelectProps) {
  const options = buildTicketOptions(maxQty);
  const initial = clampDefaultValue(defaultValue, maxQty);
  const id = `ticket-count-${name}`;

  return (
    <Surface className="flex w-full flex-col gap-1" variant="transparent">
      <Label htmlFor={id}>{label}</Label>
      <select
        className="event-feed-filters__select"
        defaultValue={initial}
        id={id}
        name={name}
        required
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </Surface>
  );
}
