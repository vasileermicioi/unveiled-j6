"use client";

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

import { adminFeaturedPartnersRemovePath } from "../components/admin/admin-tabs";
import type { Locale } from "../lib/locale";

export type AdminFeaturedPartnerManagerItem = {
  partnerId: string;
  name: string;
  thumbnailUrl: string | null;
  initial: string;
  selectLabel: string;
};

export type AdminFeaturedPartnersManagerCopy = {
  removeBulkAction: string;
  saveOrderAction: string;
  reorderHint: string;
};

export type AdminFeaturedPartnersManagerProps = {
  locale: Locale;
  reorderAction: string;
  items: AdminFeaturedPartnerManagerItem[];
  copy: AdminFeaturedPartnersManagerCopy;
};

type SortableTileProps = {
  item: AdminFeaturedPartnerManagerItem;
  selected: boolean;
  onToggle: (partnerId: string) => void;
};

function orderKey(items: readonly AdminFeaturedPartnerManagerItem[]): string {
  return items.map((item) => item.partnerId).join("\0");
}

function stopDragGesture(event: { stopPropagation: () => void; preventDefault?: () => void }) {
  event.stopPropagation();
}

function SortableTile({ item, selected, onToggle }: SortableTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.partnerId,
  });

  return (
    <Surface
      className={`admin-featured-partners__tile${isDragging ? " admin-featured-partners__tile--dragging" : ""}${selected ? " admin-featured-partners__tile--selected" : ""}`}
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
        className="admin-featured-partners__select"
        onMouseDown={stopDragGesture}
        onPointerDown={stopDragGesture}
        onTouchStart={stopDragGesture}
      >
        <input
          aria-label={item.selectLabel}
          checked={selected}
          className="admin-featured-partners__checkbox"
          onChange={() => onToggle(item.partnerId)}
          onMouseDown={stopDragGesture}
          onPointerDown={stopDragGesture}
          type="checkbox"
        />
        <Surface aria-hidden className="admin-featured-partners__select-icon" variant="transparent">
          <Paragraph className="sr-only"> </Paragraph>
        </Surface>
      </label>
      {item.thumbnailUrl ? (
        <img
          alt=""
          className="admin-featured-partners__thumb"
          draggable={false}
          src={item.thumbnailUrl}
        />
      ) : (
        <Surface
          className="admin-featured-partners__thumb admin-featured-partners__thumb--empty"
          variant="transparent"
        >
          <Paragraph aria-hidden className="admin-featured-partners__initial">
            {item.initial}
          </Paragraph>
        </Surface>
      )}
      <Paragraph className="admin-featured-partners__name">{item.name}</Paragraph>
    </Surface>
  );
}

/**
 * Featured partners grid: drag-to-reorder (explicit Save order POST) + checkbox select → remove confirm.
 */
export default function AdminFeaturedPartnersManager({
  locale,
  reorderAction,
  items: initialItems,
  copy,
}: AdminFeaturedPartnersManagerProps) {
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
      const oldIndex = current.findIndex((item) => item.partnerId === active.id);
      const newIndex = current.findIndex((item) => item.partnerId === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const toggleSelected = (partnerId: string) => {
    setSelectedIds((current) =>
      current.includes(partnerId)
        ? current.filter((id) => id !== partnerId)
        : [...current, partnerId],
    );
  };

  const removeHref =
    selectedIds.length > 0 ? adminFeaturedPartnersRemovePath(locale, selectedIds) : undefined;

  return (
    <Surface className="admin-featured-partners" variant="transparent">
      <Surface
        className="admin-featured-partners__toolbar flex flex-wrap items-center justify-between gap-3"
        variant="transparent"
      >
        <Paragraph className="admin-featured-partners__hint">{copy.reorderHint}</Paragraph>
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <form action={reorderAction} className="admin-featured-partners__save-form" method="post">
            {items.map((item) => (
              <input key={item.partnerId} name="partnerIds" type="hidden" value={item.partnerId} />
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
        <SortableContext items={items.map((item) => item.partnerId)} strategy={rectSortingStrategy}>
          <Surface className="admin-featured-partners__grid" variant="transparent">
            {items.map((item) => (
              <SortableTile
                item={item}
                key={item.partnerId}
                onToggle={toggleSelected}
                selected={selectedIds.includes(item.partnerId)}
              />
            ))}
          </Surface>
        </SortableContext>
      </DndContext>
    </Surface>
  );
}
