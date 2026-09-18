"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, MousePointerClick, Tags } from "lucide-react";

type Props = {
  categories: number;
  products: number;
  available: number;
  linkClicks: number;
  menuPublished: boolean;
  planName?: string;
};

export function AnalyticsCards({ categories, products, available, linkClicks, menuPublished, planName }: Props) {
  const paused = products - available;
  const fill = products > 0 ? Math.round((available / products) * 100) : 0;
  const steps = [
    { done: categories > 0, label: "1 sección mínima", href: "/dashboard/categorias" },
    { done: available > 0, label: "1 plato visible", href: "/dashboard/productos" },
    { done: menuPublished, label: "Carta publicada", href: "/dashboard/catalogo" },
  ];
  const next = steps.find((s) => !s.done);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-5">
      <section aria-labelledby="an-salud" className="rounded-2xl border border-border bg-card p-6 lg:col-span-3">
        <h2 id="an-salud" className="mt-1 text-base font-semibold tracking-tight">Salud de tu carta</h2>
        <p className="mb-4 mt-1 text-[13px] text-muted-foreground">{planName ?? "mise-restaurant"} · {menuPublished ? "visible para clientes" : "en borrador"}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold tabular-nums tracking-tight">{fill}<span className="text-lg text-muted-foreground">%</span></p>
          <p className="text-[13px] text-muted-foreground">de tus {products} platos están visibles</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={fill} aria-valuemin={0} aria-valuemax={100} aria-label="Platos visibles">
          <div className="h-full rounded-full bg-[#6D28D9] transition-all" style={{ width: `${fill}%` }} />
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted p-3"><dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Tags className="h-3.5 w-3.5" />Secciones</dt><dd className="mt-1 text-xl font-bold tabular-nums">{categories}</dd></div>
          <div className="rounded-xl bg-muted p-3"><dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><BookOpenCheck className="h-3.5 w-3.5" />Visibles</dt><dd className="mt-1 text-xl font-bold tabular-nums text-emerald-600">{available}</dd></div>
          <div className="rounded-xl bg-muted p-3"><dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><MousePointerClick className="h-3.5 w-3.5" />Clicks</dt><dd className="mt-1 text-xl font-bold tabular-nums">{linkClicks}</dd></div>
        </dl>
        {paused > 0 && <p className="mt-3 text-xs text-muted-foreground">{paused} pausados (agotados u ocultos). Reactivalos en Productos.</p>}
      </section>

      <section aria-labelledby="an-next" className="rounded-2xl border border-[#0A2540]/20 bg-[#0A2540] p-6 text-white lg:col-span-2">
        <h2 id="an-next" className="mt-1 text-base font-semibold tracking-tight">Siguiente paso</h2>
        {next ? (
          <>
            <p className="mb-4 mt-1 text-[13px] leading-relaxed text-white/70">Te falta <strong className="text-white">{next.label}</strong> para tener la carta vendiendo.</p>
            <Link href={next.href} className="cursor-pointer inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0A2540] transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Completarlo<ArrowRight className="h-4 w-4" /></Link>
          </>
        ) : (
          <>
            <p className="mb-4 mt-1 text-[13px] leading-relaxed text-white/70">Carta completa y publicada. El siguiente nivel: medir visitas por día y plato top.</p>
            <p className="text-[13px] text-white/70">Eso requiere tabla de analytics en DB. Te lo armo cuando quieras, con tu aprobación.</p>
          </>
        )}
      </section>
    </div>
  );
}
