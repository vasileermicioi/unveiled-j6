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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Link, Paragraph, Surface } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";

import { adminFeaturedRemovePath } from "../components/admin/admin-tabs";
import type { Locale } from "../lib/locale";

export type AdminFeaturedEventManagerItem = {
  eventId: string;
  title: string;
  partnerName: string;
  dateLabel: string;
  thumbnailUrl: string | null;
  selectLabel: string;
};

export type AdminFeaturedEventsManagerCopy = {
  reorderHint: string;
  saveOrderAction: string;
  removeBulkAction: string;
  listLabel: string;
  tableLogo: string;
  tableTitle: string;
  tablePartner: string;
  tableDate: string;
  imagePlaceholderLabel: string;
};

export type AdminFeaturedEventsManagerProps = {
  locale: Locale;
  reorderAction: string;
  items: AdminFeaturedEventManagerItem[];
  copy: AdminFeaturedEventsManagerCopy;
};

type SortableRowProps = {
  item: AdminFeaturedEventManagerItem;
  selected: boolean;
  imagePlaceholderLabel: string;
  onToggle: (eventId: string) => void;
};

function orderKey(items: readonly AdminFeaturedEventManagerItem[]): string {
  return items.map((item) => item.eventId).join("\0");
}

function stopDragGesture(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function SortableRow({ item, selected, imagePlaceholderLabel, onToggle }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.eventId,
  });

  return (
    <Surface
      className={`admin-featured-events__row${isDragging ? " admin-featured-events__row--dragging" : ""}${selected ? " admin-featured-events__row--selected" : ""}`}
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
      {/* Native label: keep select outside dnd-kit pointer capture (HeroUI Label is React Aria). */}
      <label
        className="admin-featured-events__select"
        onMouseDown={stopDragGesture}
        onPointerDown={stopDragGesture}
        onTouchStart={stopDragGesture}
      >
        <input
          aria-label={item.selectLabel}
          checked={selected}
          className="admin-featured-events__checkbox"
          onChange={() => onToggle(item.eventId)}
          onMouseDown={stopDragGesture}
          onPointerDown={stopDragGesture}
          type="checkbox"
        />
      </label>
      {item.thumbnailUrl ? (
        <Surface className="admin-table__logo" variant="transparent">
          <img alt="" draggable={false} src={item.thumbnailUrl} />
        </Surface>
      ) : (
        <Surface
          aria-hidden
          className="admin-table__logo admin-table__logo--placeholder"
          variant="transparent"
        >
          <Paragraph color="muted" size="sm">
            {imagePlaceholderLabel}
          </Paragraph>
        </Surface>
      )}
      <Paragraph className="admin-featured-events__cell-title">{item.title}</Paragraph>
      <Paragraph className="admin-featured-events__cell">{item.partnerName}</Paragraph>
      <Paragraph className="admin-featured-events__cell">{item.dateLabel}</Paragraph>
    </Surface>
  );
}

/**
 * Featured events table: drag-to-reorder (explicit Save order POST) + checkbox select → remove confirm.
 */
export default function AdminFeaturedEventsManager({
  locale,
  reorderAction,
  items: initialItems,
  copy,
}: AdminFeaturedEventsManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const baselineKey = useMemo(() => orderKey(initialItems), [initialItems]);
  const isDirty = orderKey(items) !== baselineKey;

  useEffect(() => {
    setItems(initialItems);
    setSelectedIds([]);
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.eventId === active.id);
      const newIndex = current.findIndex((item) => item.eventId === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const toggleSelected = (eventId: string) => {
    setSelectedIds((current) =>
      current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId],
    );
  };

  const removeHref =
    selectedIds.length > 0 ? adminFeaturedRemovePath(locale, selectedIds) : undefined;

  return (
    <Surface aria-label={copy.listLabel} className="admin-featured-events" variant="transparent">
      <Surface
        className="admin-featured-events__toolbar flex flex-wrap items-center justify-between gap-3"
        variant="transparent"
      >
        <Paragraph className="admin-featured-events__hint">{copy.reorderHint}</Paragraph>
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <form action={reorderAction} className="admin-featured-events__save-form" method="post">
            {items.map((item) => (
              <input key={item.eventId} name="eventIds" type="hidden" value={item.eventId} />
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
        <SortableContext
          items={items.map((item) => item.eventId)}
          strategy={verticalListSortingStrategy}
        >
          <Surface className="admin-featured-events__list" variant="transparent">
            <Surface className="admin-featured-events__header" variant="transparent">
              <Surface className="admin-featured-events__select-header" variant="transparent">
                <Paragraph className="sr-only"> </Paragraph>
              </Surface>
              <Paragraph className="admin-featured-events__header-cell">{copy.tableLogo}</Paragraph>
              <Paragraph className="admin-featured-events__header-cell">
                {copy.tableTitle}
              </Paragraph>
              <Paragraph className="admin-featured-events__header-cell">
                {copy.tablePartner}
              </Paragraph>
              <Paragraph className="admin-featured-events__header-cell">{copy.tableDate}</Paragraph>
            </Surface>
            {items.map((item) => (
              <SortableRow
                imagePlaceholderLabel={copy.imagePlaceholderLabel}
                item={item}
                key={item.eventId}
                onToggle={toggleSelected}
                selected={selectedIds.includes(item.eventId)}
              />
            ))}
          </Surface>
        </SortableContext>
      </DndContext>
    </Surface>
  );
}
