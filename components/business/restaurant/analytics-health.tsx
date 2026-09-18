import Link from "next/link";
import { ArrowRight, BookOpenCheck, MousePointerClick, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  categories: number;
  products: number;
  available: number;
  linkClicks: number;
  menuPublished: boolean;
  planName?: string;
};

export function AnalyticsHealth({ categories, products, available, linkClicks, menuPublished, planName }: Props) {
  const paused = products - available;
  const fill = products > 0 ? Math.round((available / products) * 100) : 0;

  return (
    <section aria-labelledby="an-salud" className="min-w-0 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{planName ?? "mise-restaurant"}</Badge>
        <Badge variant={menuPublished ? "default" : "outline"}>{menuPublished ? "Visible para clientes" : "En borrador"}</Badge>
      </div>
      <h2 id="an-salud" className="mt-3 text-base font-semibold tracking-tight">
        Salud de tu carta
      </h2>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-4xl font-bold tabular-nums tracking-tight">
          {fill}
          <span className="text-lg font-semibold text-muted-foreground">%</span>
        </p>
        <p className="text-[13px] text-muted-foreground">
          de tus {products} {products === 1 ? "plato" : "platos"} {products === 1 ? "está" : "están"} visible
          {products === 1 ? "" : "s"}
        </p>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={fill}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Platos visibles"
      >
        <div className="h-full rounded-full bg-[#6D28D9] transition-all" style={{ width: `${fill}%` }} />
      </div>
      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-border bg-muted/60 p-3">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0A2540]/10">
              <Tags className="h-3.5 w-3.5 text-[#0A2540]" />
            </span>
            Secciones
          </dt>
          <dd className="mt-1.5 text-2xl font-bold tabular-nums">{categories}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-emerald-600/20 bg-emerald-50 p-3 dark:bg-emerald-950/30">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600/10">
              <BookOpenCheck className="h-3.5 w-3.5 text-emerald-600" />
            </span>
            Visibles
          </dt>
          <dd className="mt-1.5 text-2xl font-bold tabular-nums text-emerald-600">{available}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-muted/60 p-3">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#6D28D9]/10">
              <MousePointerClick className="h-3.5 w-3.5 text-[#6D28D9]" />
            </span>
            Clicks en enlaces
          </dt>
          <dd className="mt-1.5 text-2xl font-bold tabular-nums">{linkClicks}</dd>
        </div>
      </dl>
      {paused > 0 ? (
        <p className="mt-4 text-[13px] text-muted-foreground">
          {paused} {paused === 1 ? "pausado (agotado u oculto)" : "pausados (agotados u ocultos)"}.{" "}
          <Link href="/dashboard/productos" className="cursor-pointer font-medium text-foreground underline underline-offset-2 hover:opacity-80">
            Reactivalos en Productos
            <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
          </Link>
        </p>
      ) : (
        products > 0 && (
          <p className="mt-4 text-[13px] text-emerald-600">Todo tu menú está visible. Buen trabajo.</p>
        )
      )}
    </section>
  );
}
