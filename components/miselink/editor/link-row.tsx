"use client";

import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import type { MiseLinkItem } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function LinkRow({
  item,
  onEdit,
  onRemove,
  dragHandleProps,
}: {
  item: MiseLinkItem;
  onEdit: (input: Partial<{ title: string; url: string; active: boolean }>) => void;
  onRemove: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [url, setUrl] = useState(item.url ?? "");

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
      <button
        type="button"
        aria-label="Reordenar"
        className="cursor-grab touch-none text-muted-foreground"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex flex-1 flex-col gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== item.title && title.trim() && onEdit({ title: title.trim() })}
          placeholder="Título"
          className="h-8 rounded-lg"
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => url !== item.url && url.trim() && onEdit({ url: url.trim() })}
          placeholder="https://..."
          inputMode="url"
          className="h-8 rounded-lg text-xs"
        />
      </div>

      <Switch
        checked={item.active}
        onCheckedChange={(v) => onEdit({ active: v })}
        aria-label="Activar enlace"
      />

      <AlertDialog>
        <AlertDialogTrigger
          aria-label="Eliminar enlace"
          className="text-muted-foreground hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este enlace?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
