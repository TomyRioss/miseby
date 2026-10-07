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
import { toast } from "sonner";
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
      console.error("[miselink] No se pudo copiar el enlace", e);
      toast.error("No se pudo copiar el enlace. Probá de nuevo.");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(10,37,64,0.04)] transition-colors motion-reduce:transition-none",
        data.highlight ? "border-[#0A2540]/50" : "border-[#E2E8F0] hover:border-[#94A3B8]",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Reordenar"
          className="mt-1 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-[#475569] transition-colors hover:bg-[#F1F5F9] hover:text-[#0A2540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] active:cursor-grabbing"
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
              className="cursor-pointer group flex items-center gap-2 text-left"
            >
              <span className="truncate text-sm font-semibold text-[#0A2540]">
                {item.title || "Sin título"}
              </span>
              <FaPencil className="h-3 w-3 shrink-0 text-[#0A2540] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>
          )}
          {!editing && !isCollection && item.url && (
            <p className="mt-1 truncate font-mono text-[11px] text-[#475569]">{item.url}</p>
          )}
          {isCollection && (
            <span className="mt-1 inline-block rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#475569]">
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
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-[#475569] transition-colors hover:bg-[#F1F5F9] hover:text-[#0A2540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {copied ? (
              <FaCheck className="h-4 w-4 text-[#0A2540]" />
            ) : (
              <FaShareNodes className="h-4 w-4" />
            )}
          </button>
          <Switch
            checked={item.active}
            onCheckedChange={(v) => onEdit({ active: v })}
            aria-label="Activar enlace"
            className="data-[state=checked]:bg-[#0A2540] focus-visible:ring-[#0A2540]"
          />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1">
        <span className="ml-1 flex items-center gap-1.5 text-[11px] tabular-nums text-[#475569]">
          <FaChartSimple className="h-3 w-3" />
          {item.clickCount} clics
        </span>

        <AlertDialog>
          <AlertDialogTrigger
            aria-label="Eliminar enlace"
            className="ml-auto flex size-8 cursor-pointer items-center justify-center rounded-lg text-[#475569] transition-colors hover:bg-[#FFF0EC] hover:text-[#B34634] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F17A60]"
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
