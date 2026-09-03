"use client";

import { useState } from "react";
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
import { Plus } from "lucide-react";
import type { MiseLinkItem } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";
import { LinkRow } from "./link-row";
import { SocialsTabSection } from "./socials-tab-section";

type State = ReturnType<typeof useMiseLinkState>;

function SortableLinkRow({ item, state }: { item: MiseLinkItem; state: State }) {
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
      <LinkRow
        item={item}
        onEdit={(input) => state.editLink(item.id, input)}
        onRemove={() => state.removeLink(item.id)}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function LinksTab({ state }: { state: State }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = state.items.map((i) => i.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    void state.reorder(next);
  };

  const submit = async () => {
    if (!title.trim() || !url.trim()) return;
    setAdding(true);
    const ok = await state.addLink({ title: title.trim(), url: url.trim() });
    setAdding(false);
    if (ok) {
      setTitle("");
      setUrl("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="rounded-2xl border border-dashed border-border p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del enlace"
              className="rounded-lg"
            />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              inputMode="url"
              className="rounded-lg"
            />
            <Button
              onClick={submit}
              disabled={adding || !title.trim() || !url.trim()}
              className="shrink-0 gap-1 rounded-lg"
            >
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
        </div>

        {state.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Todavía no agregaste enlaces.
          </p>
        ) : (
          <DndContext
            id="miselink-links-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={state.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {state.items.map((item) => (
                  <SortableLinkRow key={item.id} item={item} state={state} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <SocialsTabSection state={state} />
    </div>
  );
}
