import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";

export type SectionDatum = {
  id: string;
  name: string;
  total: number;
  visible: number;
};

export function AnalyticsSectionsStatus({ sections }: { sections: SectionDatum[] }) {
  return (
    <section aria-labelledby="an-sec" className="min-w-0 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="an-sec" className="text-base font-semibold tracking-tight">
            Estado por sección
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {sections.length > 0 ? "Qué tan completa está cada parte de tu carta" : "Organizá tu carta por secciones"}
          </p>
        </div>
        {sections.length > 0 && (
          <Link href="/dashboard/categorias" className="cursor-pointer inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground">
            Editar secciones
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {sections.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">Todavía no creaste secciones</p>
          <p className="max-w-xs text-[13px] text-muted-foreground">
            Empezá con Entradas, Principales y Postres: una carta ordenada se lee más rápido.
          </p>
          <Link
            href="/dashboard/categorias"
            className="cursor-pointer mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0A2540]/90"
          >
            Crear mi primera sección
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {sections.map((section) => {
            const fill = section.total > 0 ? Math.round((section.visible / section.total) * 100) : 0;
            const paused = section.total - section.visible;
            const dot = fill === 100 ? "bg-emerald-500" : fill > 0 ? "bg-amber-500" : "bg-muted-foreground/40";
            return (
              <li key={section.id} className="min-w-0">
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-2 truncate text-sm font-medium">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
                    <span className="truncate">{section.name}</span>
                  </p>
                  <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {section.visible}/{section.total} visibles
                  </p>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={fill}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${section.name}: ${fill}% visible`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${fill === 100 ? "bg-emerald-500" : "bg-[#6D28D9]"}`}
                    style={{ width: `${fill}%` }}
                  />
                </div>
                {paused > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paused} {paused === 1 ? "pausado" : "pausados"} ·{" "}
                    <Link href="/dashboard/productos" className="cursor-pointer font-medium underline underline-offset-2 hover:text-foreground">
                      revisar
                    </Link>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
