"use client";

import { FiShare } from "react-icons/fi";

/**
 * Marco teléfono único. Mismo exacto en MiseLink y Carta.
 * Pill URL + teléfono sin scroll (overflow-hidden).
 * El padre define la altura (el marco ocupa h-full).
 */
export function PhonePreviewShell({
  urlLabel,
  onShare,
  shareTitle = "Compartir enlace",
  children,
}: {
  urlLabel: string;
  onShare?: () => void;
  shareTitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <button
        type="button"
        onClick={onShare}
        disabled={!onShare}
        title={onShare ? shareTitle : undefined}
        className={`flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 ${onShare ? "transition-colors hover:bg-muted" : "cursor-default"}`}
      >
        <span className="flex-1 truncate text-center text-sm text-muted-foreground">{urlLabel}</span>
        <FiShare className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-border bg-background shadow-sm">
        <div className="h-full overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
