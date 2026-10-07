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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.52 : 1,
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = state.items.map((item) => item.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    void state.reorder(next);
  };

  if (state.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#94A3B8] bg-white/55 px-5 py-10 text-center">
        <p className="font-display text-lg font-semibold text-[#0A2540]">
          Tu corriente empieza acá
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-[#475569]">
          Agregá tu primer destino para que tus clientes encuentren lo que buscan.
        </p>
      </div>
    );
  }

  let activePosition = 0;

  return (
    <DndContext
      id="miselink-links-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={state.items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="relative flex flex-col gap-3 pl-9 sm:pl-10">
          <span
            aria-hidden="true"
            className="absolute bottom-5 left-[13px] top-5 w-px bg-[#94A3B8]"
          />
          {state.items.map((item) => {
            const isPublicDestination = item.active && item.type !== "collection";
            const position = isPublicDestination ? ++activePosition : null;
            return (
              <div key={item.id} className="relative min-w-0">
                <span
                  aria-hidden="true"
                    className={`absolute -left-9 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-none border font-mono text-[10px] font-semibold tabular-nums shadow-[0_1px_2px_rgba(10,37,64,0.08)] sm:-left-10 ${
                    position
                      ? "border-[#0A2540] bg-[#0A2540] text-white"
                      : "border-[#E2E8F0] bg-[#FFFFFF] text-[#475569]"
                  }`}
                >
                  {position ? String(position).padStart(2, "0") : "—"}
                </span>
                <SortableLinkCard item={item} state={state} />
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
