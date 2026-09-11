"use client";

import { useState } from "react";
import {
  FaGripVertical,
  FaPencil,
  FaChartSimple,
  FaShareNodes,
  FaTrash,
  FaCheck,
} from "react-icons/fa6";
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
import { cn } from "@/lib/utils";
import { readLinkData } from "./link-data";

type EditInput = Partial<{
  title: string;
  url: string;
  active: boolean;
  data: { thumbnail?: string; highlight?: boolean; locked?: boolean };
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
}>;

export function LinkCard({
  item,
  onEdit,
  onRemove,
  dragHandleProps,
}: {
  item: MiseLinkItem;
  onEdit: (input: EditInput) => void;
  onRemove: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const isCollection = item.type === "collection";
  const data = readLinkData(item);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [copied, setCopied] = useState(false);

  const commitTitle = () => {
    if (title.trim() && title !== item.title) onEdit({ title: title.trim() });
  };
  const commitUrl = () => {
    if (url !== (item.url ?? "")) onEdit({ url: url.trim() });
  };

  const share = async () => {
    if (!item.url) return;
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("No se pudo copiar el enlace", e);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm",
        data.highlight ? "border-emerald-300" : "border-border",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Reordenar"
          className="mt-1 cursor-grab touch-none text-muted-foreground"
          {...dragHandleProps}
        >
          <FaGripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                placeholder="Título"
                className="h-8 rounded-lg"
                autoFocus
              />
              {!isCollection && (
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={commitUrl}
                  placeholder="https://..."
                  inputMode="url"
                  className="h-8 rounded-lg text-xs"
                />
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="group flex items-center gap-2 text-left"
            >
              <span className="truncate text-sm font-semibold text-foreground">
                {item.title || "Sin título"}
              </span>
              <FaPencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          {!editing && !isCollection && item.url && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.url}</p>
          )}
          {isCollection && (
            <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Colección
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={share}
            disabled={!item.url}
            aria-label="Compartir enlace"
            title="Compartir enlace"
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            {copied ? (
              <FaCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <FaShareNodes className="h-4 w-4" />
            )}
          </button>
          <Switch
            checked={item.active}
            onCheckedChange={(v) => onEdit({ active: v })}
            aria-label="Activar enlace"
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-border/60 pt-2">
        <span className="ml-1 flex items-center gap-1 text-xs text-muted-foreground">
          <FaChartSimple className="h-3.5 w-3.5" />
          {item.clickCount} clics
        </span>

        <AlertDialog>
          <AlertDialogTrigger
            aria-label="Eliminar enlace"
            className="ml-auto text-muted-foreground transition-colors hover:text-red-600"
          >
            <FaTrash className="h-4 w-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este elemento?</AlertDialogTitle>
              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onRemove}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
