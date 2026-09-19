"use client";

import { ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { RestaurantAppearance, RestaurantCategory, RestaurantProduct, WeekSchedule } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { RestaurantPublicView } from "./restaurant-public-view";

/**
 * Preview mobile de la carta (TOM-162).
 * Header único "Vista previa en vivo" + teléfono limpio +
 * dos botones debajo: Visitar página y Compartir.
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
}: {
  slug?: string;
  appearance: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  currency?: string | null;
  hours?: string;
  restaurantName?: string;
  schedule?: WeekSchedule;
}) {
  const publicHref = slug ? `/menu/${slug}` : undefined;

  function onShare() {
    try {
      const url = slug ? `${window.location.origin}/menu/${slug}` : window.location.href;
      navigator.clipboard
        .writeText(url)
        .then(
          () => toast.success("Enlace de la carta copiado."),
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
        <div className="h-full overflow-hidden">
          <RestaurantPublicView
            preview
            appearance={appearance}
            categories={categories}
            products={products}
            currency={currency}
            hours={hours}
            restaurantName={restaurantName}
            slug={slug}
            schedule={schedule}
          />
        </div>
      </div>
      <div className="flex gap-2">
        {publicHref ? (
          <Button variant="outline" asChild className="min-h-10 flex-1">
            <a href={publicHref} target="_blank" rel="noreferrer" aria-label="Visitar página de la carta">
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
        <Button variant="outline" onClick={onShare} disabled={!slug} className="min-h-10 flex-1" aria-label="Compartir carta">
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </div>
    </div>
  );
}
