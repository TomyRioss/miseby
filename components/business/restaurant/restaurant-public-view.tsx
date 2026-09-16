"use client";

import { formatPrice, productMinPrice, type RestaurantAppearance, type RestaurantCategory, type RestaurantProduct } from "@/lib/restaurant-theme";

function titleCls(font: RestaurantAppearance["titleFont"]) {
  if (font === "serif") return "font-serif";
  if (font === "mono") return "font-mono uppercase";
  return "";
}

function bodyCls(font: RestaurantAppearance["bodyFont"]) {
  if (font === "serif") return "font-serif";
  if (font === "mono") return "font-mono";
  return "";
}

/**
 * Vista mobile pura de la carta. Vive dentro del teléfono.
 * Misma data que la carta pública: apariencia + categorías + productos.
 */
export function RestaurantPublicView({
  appearance: ap,
  categories = [],
  products = [],
  currency = "COP",
  hours,
  preview = true,
}: {
  appearance: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  currency?: string | null;
  hours?: string;
  preview?: boolean;
}) {
  const cats = [...(categories ?? [])].sort((a, b) => a.order - b.order);
  const available = (products ?? []).filter((p) => p.available);
  const byCat = (id: string) => available.filter((p) => p.categoryId === id);

  return (
    <main
      style={{ background: ap.background, color: ap.text }}
      className={`mx-auto flex w-full max-w-[580px] flex-col ${preview ? "min-h-full" : "min-h-[100dvh] flex-1"} ${bodyCls(ap.bodyFont)}`}
    >
      <div className="flex items-start justify-between gap-3 p-5 pb-4" style={{ borderBottom: `3px solid ${ap.primary}` }}>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Carta</p>
          <p className={`mt-0.5 text-xl font-bold tracking-tight ${titleCls(ap.titleFont)}`} style={{ color: ap.primary }}>
            Para compartir en mesa
          </p>
          {hours ? <p className="mt-1 text-[11px] opacity-60">{hours}</p> : null}
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums"
          style={{ background: `${ap.secondary}1A`, color: ap.secondary }}
        >
          {available.length} platos
        </span>
      </div>

      <div className="space-y-6 p-5">
        {cats.map((c) => {
          const prods = byCat(c.id);
          if (prods.length === 0) return null;
          return (
            <div key={c.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: ap.secondary }}>
                  {c.name}
                </p>
                <span className="text-[11px] tabular-nums opacity-50">{prods.length}</span>
              </div>
              <div className="mt-1 divide-y" style={{ borderColor: `${ap.primary}22` }}>
                {prods.map((p) => {
                  const multi = (p.variants?.length ?? 0) > 1;
                  return (
                  <div key={p.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {ap.showImages && p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      ) : null}
                      <div className="min-w-0">
                        <p className={`text-[15px] font-semibold leading-snug ${titleCls(ap.titleFont)}`}>{p.name}</p>
                        {ap.showDescriptions && p.description ? (
                          <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed opacity-70">{p.description}</p>
                        ) : null}
                        {multi ? <p className="mt-0.5 text-[11px] opacity-50">{p.variants!.length} opciones</p> : null}
                      </div>
                    </div>
                    {ap.showPrices ? (
                      <span
                        className="mt-0.5 shrink-0 rounded-full px-3 py-1 text-xs font-bold tabular-nums text-white"
                        style={{ background: ap.secondary }}
                      >
                        {multi ? `Desde ${formatPrice(productMinPrice(p), currency ?? "COP")}` : formatPrice(productMinPrice(p), currency ?? "COP")}
                      </span>
                    ) : null}
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {available.length === 0 && (
          <div>
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: `${ap.primary}30` }}>
              <div className="p-4" style={{ background: `${ap.primary}0D` }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Plato de la casa</p>
                <p className={`mt-1 text-xl font-bold tracking-tight ${titleCls(ap.titleFont)}`} style={{ color: ap.primary }}>
                  Bandeja paisa
                </p>
                {ap.showDescriptions && (
                  <p className="mt-1 text-[13px] leading-relaxed opacity-80">Fríjoles, arroz, chicharrón, huevo y aguacate.</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {ap.showPrices && (
                    <span className="rounded-full px-3 py-1 text-xs font-bold tabular-nums text-white" style={{ background: ap.secondary }}>
                      $32.000
                    </span>
                  )}
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: ap.primary, color: ap.primary }}>
                    Pedir por WhatsApp
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-[11px]" style={{ background: ap.background }}>
                <span className="opacity-60">{hours || "Lun–Dom · 12–22h"}</span>
                <span className="font-semibold" style={{ color: ap.secondary }}>
                  Ver carta completa
                </span>
              </div>
            </div>
            <p className="mt-3 text-center text-xs opacity-60">Agregá secciones y platos: acá aparecen tal cual los verá el cliente.</p>
          </div>
        )}
      </div>
    </main>
  );
}
