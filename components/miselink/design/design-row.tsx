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
      className="cursor-pointer flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-[#0A2540] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-slate-100 text-[#0A2540]">
        {icon}
      </span>
      <span className="flex-1 text-[15px] font-medium text-[#0A2540]">{label}</span>
      {value ? <span className="text-sm capitalize text-muted-foreground">{value}</span> : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
