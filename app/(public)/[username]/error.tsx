"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MiseMark } from "@/components/brand/mise-mark";

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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#edf5fb] px-5 py-12 text-center sm:px-8">
      <div className="w-full max-w-lg bg-background px-6 py-10 sm:px-10 sm:py-12">
      <MiseMark />
      <h1 className="font-display mt-8 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        No pudimos cargar esta página
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Probá de nuevo en un momento.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="cursor-pointer min-h-11 rounded-xl border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Reintentar
        </button>
        <Link href="/" className="cursor-pointer inline-flex min-h-11 items-center justify-center rounded-xl bg-[#075296] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0E88E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075296] focus-visible:ring-offset-2">
          Ir al inicio
        </Link>
      </div>
      </div>
    </main>
  );
}
