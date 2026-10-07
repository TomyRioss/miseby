import { Hourglass } from "lucide-react";

export function OrganizationUnavailable({ businessName }: { businessName?: string }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f3f6f8] px-5 py-12 sm:px-8">
      <section className="w-full max-w-xl border-y border-amber-300 bg-background px-6 py-8 sm:px-10 sm:py-10">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
          <Hourglass className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="font-display max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {businessName || "Este negocio"} está en revisión
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Estamos verificando la información de este negocio. Volvé en unos minutos, pronto va a
          estar disponible.
        </p>
      </section>
    </main>
  );
}
