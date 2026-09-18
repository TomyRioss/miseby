import Link from "next/link";
import { ArrowRight, Camera, FileText, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DishDatum = {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  hasPhoto: boolean;
  hasDescription: boolean;
};

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

export function AnalyticsTopDishes({ dishes, totalVisible }: { dishes: DishDatum[]; totalVisible: number }) {
  return (
    <section aria-labelledby="an-top" className="min-w-0 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="an-top" className="text-base font-semibold tracking-tight">
            Top platos
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {dishes.length > 0 ? "Tus visibles, con oportunidades para vender más" : "Los platos que más van a vender"}
          </p>
        </div>
        {dishes.length > 0 && (
          <Link href="/dashboard/productos" className="cursor-pointer inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground">
            Ver todos ({totalVisible})
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {dishes.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">Todavía no hay platos visibles</p>
          <p className="max-w-xs text-[13px] text-muted-foreground">
            Cargá tu primer plato con foto y precio: las cartas con fotos venden más.
          </p>
          <Link
            href="/dashboard/productos"
            className="cursor-pointer mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0A2540]/90"
          >
            Cargar mi primer plato
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <ol className="mt-4 space-y-2">
          {dishes.map((dish, i) => (
            <li
              key={dish.id}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/60"
            >
              <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{dish.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {dish.categoryName} · {formatPrice(dish.price)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {!dish.hasPhoto && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600" title="Sin foto">
                    <Camera className="mr-1 h-3 w-3" />
                    Sin foto
                  </Badge>
                )}
                {!dish.hasDescription && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600" title="Sin descripción">
                    <FileText className="mr-1 h-3 w-3" />
                    Sin texto
                  </Badge>
                )}
                {dish.hasPhoto && dish.hasDescription && (
                  <Badge variant="outline" className="border-emerald-600/30 text-emerald-600">
                    Listo
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
