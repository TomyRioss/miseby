"use client";

import { useState } from "react";
import { ExternalLink, RotateCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { RestaurantAppearance, RestaurantCategory, RestaurantProduct, WeekSchedule } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { RestaurantPublicView } from "./restaurant-public-view";

/**
 * Preview mobile en vivo (TOM-162 + TOM-160).
 * Header único "Vista previa en vivo" + teléfono limpio +
 * botones debajo: Recargar, Visitar página y Compartir.
 * Generalizado por linkBase/menuNounCap/variant (restaurant vs catálogo).
 *
 * Variant restaurant: iframe a la página pública real /menu/[slug]
 * (píxel a píxel lo que ve el cliente; muestra lo GUARDADO).
 * Variant catalog: iframe a la página pública real /catalogo/[slug]
 * (igual que restaurant; muestra lo GUARDADO).
 */
export function CartaPhonePreview({
  slug,
  appearance,
  categories,
  products,
  currency,
  hours,
  restaurantName,
  schedule,
  linkBase = "menu",
  menuNounCap = "Carta",
  variant = "restaurant",
  fallbackName,
  reloadSignal,
  draft = false,
}: {
  slug?: string;
  appearance: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  currency?: string | null;
  hours?: string;
  restaurantName?: string;
  schedule?: WeekSchedule;
  linkBase?: string;
  menuNounCap?: string;
  variant?: "restaurant" | "catalog";
  /** Nombre comercial del local: mismo fallback que la página pública
   *  (ap.restaurantName || organization.commercialName). */
  fallbackName?: string;
  /** Cada cambio recarga el iframe (el editor lo sube tras cada guardado). */
  reloadSignal?: number;
  /** Con cambios sin guardar muestra el borrador local en vivo en vez del iframe. */
  draft?: boolean;
}) {
  const publicHref = slug ? `/${linkBase}/${slug}` : undefined;
  const noun = menuNounCap.toLowerCase();
  // Ambas variantes (restaurant y catalog) previsualizan con iframe a su
  // página pública real (/menu/[slug] o /catalogo/[slug]):
  // píxel a píxel lo que ve el cliente (muestra lo guardado, no borradores).
  const showRealMenu = !!slug;
  const [frameKey, setFrameKey] = useState(0);
  // Con borrador se renderiza la vista local con los datos del editor
  // (tiempo real); si no, el iframe a la página pública (lo guardado).
  const showDraft = draft || !showRealMenu;
  // El iframe recarga solo tras cada guardado (reloadSignal) o con el botón.
  // El query ?v= evita que el navegador sirva el documento cacheado (banner/logo viejos).
  const iframeKey = `${frameKey}-${reloadSignal ?? 0}`;
  const iframeSrc = publicHref ? `${publicHref}?v=${reloadSignal ?? 0}-${frameKey}` : undefined;
  // Mismo orden de fallback que la página pública para el nombre.
  const effectiveName = restaurantName || appearance.restaurantName || fallbackName || "";

  function onShare() {
    try {
      const url = slug ? `${window.location.origin}/${linkBase}/${slug}` : window.location.href;
      navigator.clipboard
        .writeText(url)
        .then(
          () => toast.success(`Enlace de ${noun} copiado.`),
          () => toast.error("No se pudo copiar."),
        )
        .catch((e) => console.error("[carta share]", e));
    } catch (e) {
      console.error("[carta share]", e);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <p className="text-center text-sm font-semibold tracking-tight">Vista previa en vivo</p>
      <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-border bg-background shadow-sm">
        <div className={`h-full ${showRealMenu && !showDraft ? "overflow-y-auto" : "overflow-hidden"}`}>
          {showDraft ? (
            <div className="relative h-full overflow-y-auto">
              {draft && showRealMenu ? (
                <p className="absolute left-1/2 top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0A2540] px-3 py-1 text-[11px] font-bold text-white shadow">
                  Borrador sin guardar
                </p>
              ) : null}
              <RestaurantPublicView
                preview
                appearance={appearance}
                categories={categories}
                products={products}
                currency={currency}
                hours={hours}
                restaurantName={effectiveName}
                slug={slug}
                schedule={schedule}
                variant={variant}
                linkBase={linkBase}
              />
            </div>
          ) : (
            <iframe
              key={iframeKey}
              src={iframeSrc}
              title={`Vista previa de la ${noun}`}
              className="h-full w-full border-0"
              loading="lazy"
            />
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {showRealMenu && !showDraft ? (
          <Button variant="outline" onClick={() => setFrameKey((k) => k + 1)} className="min-h-10 shrink-0" aria-label="Recargar vista previa">
            <RotateCw className="h-4 w-4" />
          </Button>
        ) : null}
        {publicHref ? (
          <Button variant="outline" asChild className="min-h-10 flex-1">
            <a href={publicHref} target="_blank" rel="noreferrer" aria-label={`Visitar página de la ${noun}`}>
              <ExternalLink className="h-4 w-4" />
              Visitar página
            </a>
          </Button>
        ) : (
          <Button variant="outline" disabled className="min-h-10 flex-1">
            <ExternalLink className="h-4 w-4" />
            Visitar página
          </Button>
        )}
        <Button variant="outline" onClick={onShare} disabled={!slug} className="min-h-10 flex-1" aria-label={`Compartir ${noun}`}>
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </div>
    </div>
  );
}
