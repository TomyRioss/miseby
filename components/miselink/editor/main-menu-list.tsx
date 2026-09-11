"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MiseLinkItem } from "@prisma/client";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";
import { LinkCard } from "./link-card";

type State = ReturnType<typeof useMiseLinkState>;

function SortableLinkCard({ item, state }: { item: MiseLinkItem; state: State }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <LinkCard
        item={item}
        onEdit={(input) => state.editLink(item.id, input)}
        onRemove={() => state.removeLink(item.id)}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function MainMenuList({ state }: { state: State }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = state.items.map((i) => i.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    void state.reorder(next);
  };

  if (state.items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        Todavía no agregaste nada. Tocá “Agregar” para empezar.
      </p>
    );
  }

  return (
    <DndContext
      id="miselink-links-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={state.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {state.items.map((item) => (
            <SortableLinkCard key={item.id} item={item} state={state} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
