"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function DesignRow({
  icon,
  label,
  value,
  onOpen,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-muted/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
        {icon}
      </span>
      <span className="flex-1 text-[15px] font-medium text-foreground">{label}</span>
      {value ? <span className="text-sm capitalize text-muted-foreground">{value}</span> : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
