"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MiseLinkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[miselink public]", error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-sm text-muted-foreground">
        No pudimos cargar esta página. Probá de nuevo en un momento.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Reintentar
        </button>
        <Link href="/" className="cursor-pointer rounded-xl bg-[#075296] px-4 py-2 text-sm font-medium text-white">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
