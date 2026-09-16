"use client";

import { toast } from "sonner";
import { PhonePreviewShell } from "@/components/shared/phone-preview-shell";
import type { RestaurantAppearance, RestaurantCategory, RestaurantProduct } from "@/lib/restaurant-theme";
import { RestaurantPublicView } from "./restaurant-public-view";

/**
 * Preview mobile de la carta. Usa el mismo marco exacto que MiseLink.
 */
export function CartaPhonePreview({
  slug,
  appearance,
  categories,
  products,
  currency,
  hours,
}: {
  slug?: string;
  appearance: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  currency?: string | null;
  hours?: string;
}) {
  const label = slug ? `miseby.com/menu/${slug}` : "miseby.com/menu";

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
    <PhonePreviewShell urlLabel={label} onShare={slug ? onShare : undefined} shareTitle="Copiar enlace de la carta">
      <RestaurantPublicView
        preview
        appearance={appearance}
        categories={categories}
        products={products}
        currency={currency}
        hours={hours}
      />
    </PhonePreviewShell>
  );
}
