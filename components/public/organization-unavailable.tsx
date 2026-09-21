import { Hourglass } from "lucide-react";

export function OrganizationUnavailable({ businessName }: { businessName?: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
          <Hourglass className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          En revisión
        </p>
        <h1 className="font-display text-2xl font-semibold">
          {businessName || "Este negocio"} está en revisión
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Estamos verificando la información de este negocio. Volvé en unos minutos, pronto va a
          estar disponible.
        </p>
      </div>
    </div>
  );
}
