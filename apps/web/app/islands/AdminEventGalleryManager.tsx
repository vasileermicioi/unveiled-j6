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
import { Button, Label, Link, Paragraph, Surface } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";

import { adminEventGalleryRemovePath } from "../components/admin/admin-tabs";
import type { Locale } from "../lib/locale";

export type AdminGalleryManagerItem = {
  imageId: string;
  thumbnailUrl: string | null;
  label: string;
  selectLabel: string;
};

export type AdminEventGalleryManagerCopy = {
  removeBulkAction: string;
  saveOrderAction: string;
  reorderHint: string;
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
  selected: boolean;
  onToggle: (imageId: string) => void;
};

function orderKey(items: readonly AdminGalleryManagerItem[]): string {
  return items.map((item) => item.imageId).join("\0");
}

function SortableTile({ item, selected, onToggle }: SortableTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.imageId,
  });

  return (
    <Surface
      className={`admin-event-gallery__tile${isDragging ? " admin-event-gallery__tile--dragging" : ""}${selected ? " admin-event-gallery__tile--selected" : ""}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      variant="transparent"
      {...attributes}
      {...listeners}
    >
      <Label className="admin-event-gallery__select">
        <input
          aria-label={item.selectLabel}
          checked={selected}
          className="admin-event-gallery__checkbox"
          onChange={() => onToggle(item.imageId)}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          type="checkbox"
        />
        <Surface aria-hidden className="admin-event-gallery__select-icon" variant="transparent">
          <Paragraph className="sr-only"> </Paragraph>
        </Surface>
      </Label>
      {item.thumbnailUrl ? (
        <img
          alt={item.label}
          className="admin-event-gallery__thumb"
          draggable={false}
          src={item.thumbnailUrl}
        />
      ) : (
        <Surface
          className="admin-event-gallery__thumb admin-event-gallery__thumb--empty"
          variant="transparent"
        >
          <Paragraph size="sm">{item.label}</Paragraph>
        </Surface>
      )}
    </Surface>
  );
}

/**
 * Admin gallery grid: drag-to-reorder (explicit Save order POST) + checkbox select → remove confirm.
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
  const baselineKey = useMemo(() => orderKey(initialItems), [initialItems]);
  const isDirty = orderKey(items) !== baselineKey;

  useEffect(() => {
    setItems(initialItems);
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
      <Surface
        className="admin-event-gallery__toolbar flex flex-wrap items-center justify-between gap-3"
        variant="transparent"
      >
        <Paragraph className="admin-event-gallery__hint">{copy.reorderHint}</Paragraph>
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <form action={reorderAction} className="admin-event-gallery__save-form" method="post">
            {items.map((item) => (
              <input key={item.imageId} name="imageIds" type="hidden" value={item.imageId} />
            ))}
            <Button
              className="button button--primary button--md"
              isDisabled={!isDirty}
              type="submit"
            >
              {copy.saveOrderAction}
            </Button>
          </form>
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
      </Surface>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
        <SortableContext items={items.map((item) => item.imageId)} strategy={rectSortingStrategy}>
          <Surface className="admin-event-gallery__grid" variant="transparent">
            {items.map((item) => (
              <SortableTile
                item={item}
                key={item.imageId}
                onToggle={toggleSelected}
                selected={selectedIds.includes(item.imageId)}
              />
            ))}
          </Surface>
        </SortableContext>
      </DndContext>
    </Surface>
  );
}
