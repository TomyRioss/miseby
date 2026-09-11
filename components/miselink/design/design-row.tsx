"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function DesignRow({
  icon,
  label,
  value,
  children,
  defaultOpen = false,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-foreground">
          {icon}
        </span>
        <span className="flex-1 text-[15px] font-medium text-foreground">{label}</span>
        {value ? <span className="text-sm text-muted-foreground">{value}</span> : null}
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open ? <div className="border-t border-border px-4 py-4">{children}</div> : null}
    </div>
  );
}
