"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL = 30_000;

export function LiveRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    if (document.visibilityState === "hidden" || isPending) return;

    setLastCheck(new Date());
    startTransition(() => router.refresh());
  }, [isPending, router]);

  useEffect(() => {
    const interval = window.setInterval(refresh, REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const time = lastCheck?.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
        Actualización automática cada 30 s
      </span>
      {time && (
        <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          Última consulta {time}
        </span>
      )}
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Actualizando…" : "Actualizar ahora"}
      </button>
    </div>
  );
}
