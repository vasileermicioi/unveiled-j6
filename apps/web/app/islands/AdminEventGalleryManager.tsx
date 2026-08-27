import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Link, Paragraph, Surface } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { AdminImageCreditField } from "../components/admin/AdminImageCreditField";
import { adminEventGalleryRemovePath } from "../components/admin/admin-tabs";
import { imageAltWithCredit, imageCreditTitle } from "../lib/image-credit";
import type { Locale } from "../lib/locale";

function stopDragGesture(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export type AdminGalleryManagerItem = {
  imageId: string;
  thumbnailUrl: string | null;
  label: string;
  selectLabel: string;
  credit: string | null;
};

export type AdminEventGalleryManagerCopy = {
  removeBulkAction: string;
  saveOrderAction: string;
  reorderHint: string;
  capacityLabel: string;
};

export type AdminEventGalleryManagerProps = {
  locale: Locale;
  eventId: string;
  reorderAction: string;
  items: AdminGalleryManagerItem[];
  copy: AdminEventGalleryManagerCopy;
};

type SortableTileProps = {
  item: AdminGalleryManagerItem;
  locale: Locale;
  selected: boolean;
  creditValue: string;
  onToggle: (imageId: string) => void;
  onCreditChange: (imageId: string, value: string) => void;
};

function orderKey(items: readonly AdminGalleryManagerItem[]): string {
  return items.map((item) => item.imageId).join("\0");
}

function creditsKey(items: readonly AdminGalleryManagerItem[]): string {
  return items.map((item) => `${item.imageId}:${item.credit ?? ""}`).join("\0");
}

function draftCreditsKey(
  items: readonly AdminGalleryManagerItem[],
  draft: Record<string, string>,
): string {
  return items.map((item) => `${item.imageId}:${draft[item.imageId] ?? ""}`).join("\0");
}

function SortableTile({
  item,
  locale,
  selected,
  creditValue,
  onToggle,
  onCreditChange,
}: SortableTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.imageId,
  });
  const creditTitle = imageCreditTitle(creditValue);

  return (
    <Surface
      className={`admin-event-gallery__tile${isDragging ? " admin-event-gallery__tile--dragging" : ""}${selected ? " admin-event-gallery__tile--selected" : ""}`}
      ref={setNodeRef}
      render={(domProps) => (
        <div {...domProps} {...attributes} {...listeners}>
          {domProps.children}
        </div>
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      variant="transparent"
    >
      <label
        className="admin-event-gallery__select"
        onMouseDown={stopDragGesture}
        onPointerDown={stopDragGesture}
        onTouchStart={stopDragGesture}
      >
        <input
          aria-label={item.selectLabel}
          checked={selected}
          className="admin-event-gallery__checkbox"
          onChange={() => onToggle(item.imageId)}
          onMouseDown={stopDragGesture}
          onPointerDown={stopDragGesture}
          type="checkbox"
        />
        <Surface aria-hidden className="admin-event-gallery__select-icon" variant="transparent">
          <Paragraph className="sr-only"> </Paragraph>
        </Surface>
      </label>
      {item.thumbnailUrl ? (
        <img
          alt={imageAltWithCredit(item.label, creditValue)}
          className="admin-event-gallery__thumb"
          draggable={false}
          src={item.thumbnailUrl}
          title={creditTitle}
        />
      ) : (
        <Surface
          className="admin-event-gallery__thumb admin-event-gallery__thumb--empty"
          variant="transparent"
        >
          <Paragraph size="sm">{item.label}</Paragraph>
        </Surface>
      )}
      <Surface
        className="admin-event-gallery__credit-field"
        title={creditTitle}
        variant="transparent"
      >
        <AdminImageCreditField
          compact
          defaultValue={creditValue}
          locale={locale}
          name={`image_credit_${item.imageId}`}
          onValueChange={(value) => onCreditChange(item.imageId, value)}
          stopDrag
          title={creditTitle}
        />
      </Surface>
    </Surface>
  );
}

/**
 * Admin gallery grid: drag-to-reorder (explicit Save order POST) + checkbox select → remove confirm.
 * The same POST also saves per-image credits.
 */
export default function AdminEventGalleryManager({
  locale,
  eventId,
  reorderAction,
  items: initialItems,
  copy,
}: AdminEventGalleryManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creditDraft, setCreditDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialItems.map((item) => [item.imageId, item.credit ?? ""])),
  );
  const baselineKey = useMemo(() => orderKey(initialItems), [initialItems]);
  const baselineCredits = useMemo(() => creditsKey(initialItems), [initialItems]);
  const isDirty =
    orderKey(items) !== baselineKey || draftCreditsKey(items, creditDraft) !== baselineCredits;

  useEffect(() => {
    setItems(initialItems);
    setCreditDraft(
      Object.fromEntries(initialItems.map((item) => [item.imageId, item.credit ?? ""])),
    );
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.imageId === active.id);
      const newIndex = current.findIndex((item) => item.imageId === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const toggleSelected = (imageId: string) => {
    setSelectedIds((current) =>
      current.includes(imageId) ? current.filter((id) => id !== imageId) : [...current, imageId],
    );
  };

  const removeHref =
    selectedIds.length > 0 ? adminEventGalleryRemovePath(locale, eventId, selectedIds) : undefined;

  return (
    <Surface className="admin-event-gallery" variant="transparent">
      <form action={reorderAction} className="admin-event-gallery__save-form" method="post">
        {items.map((item) => (
          <input key={item.imageId} name="imageIds" type="hidden" value={item.imageId} />
        ))}
        <Surface className="admin-event-gallery__intro" variant="transparent">
          <Paragraph className="admin-event-gallery__count" size="sm">
            {copy.capacityLabel}
          </Paragraph>
          <Paragraph className="admin-event-gallery__hint" size="sm">
            {copy.reorderHint}
          </Paragraph>
        </Surface>

        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
          <SortableContext items={items.map((item) => item.imageId)} strategy={rectSortingStrategy}>
            <Surface className="admin-event-gallery__grid" variant="transparent">
              {items.map((item) => (
                <SortableTile
                  creditValue={creditDraft[item.imageId] ?? item.credit ?? ""}
                  item={item}
                  key={item.imageId}
                  locale={locale}
                  onCreditChange={(imageId, value) => {
                    setCreditDraft((current) => ({ ...current, [imageId]: value }));
                  }}
                  onToggle={toggleSelected}
                  selected={selectedIds.includes(item.imageId)}
                />
              ))}
            </Surface>
          </SortableContext>
        </DndContext>

        <Surface className="admin-event-gallery__actions" variant="transparent">
          <Button className="button button--primary button--md" isDisabled={!isDirty} type="submit">
            {copy.saveOrderAction}
          </Button>
          {removeHref ? (
            <Link className="button button--secondary button--md" href={removeHref}>
              {copy.removeBulkAction}
            </Link>
          ) : (
            <Button className="button button--secondary button--md" isDisabled type="button">
              {copy.removeBulkAction}
            </Button>
          )}
        </Surface>
      </form>
    </Surface>
  );
}
