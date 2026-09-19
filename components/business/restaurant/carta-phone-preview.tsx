"use client";

import { toast } from "sonner";
import { PhonePreviewShell } from "@/components/shared/phone-preview-shell";
import type { RestaurantAppearance, RestaurantCategory, RestaurantProduct, WeekSchedule } from "@/lib/restaurant-theme";
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
  restaurantName,
  schedule,
  linkBase = "menu",
  menuNounCap = "Carta",
  variant = "restaurant",
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
}) {
  const label = slug ? `miseby.com/${linkBase}/${slug}` : `miseby.com/${linkBase}`;

  function onShare() {
    try {
      const url = slug ? `${window.location.origin}/${linkBase}/${slug}` : window.location.href;
      navigator.clipboard
        .writeText(url)
        .then(
          () => toast.success(`Enlace de ${menuNounCap.toLowerCase()} copiado.`),
          () => toast.error("No se pudo copiar."),
        )
        .catch((e) => console.error("[carta share]", e));
    } catch (e) {
      console.error("[carta share]", e);
    }
  }

  return (
    <PhonePreviewShell urlLabel={label} onShare={slug ? onShare : undefined} shareTitle={`Copiar enlace de ${menuNounCap.toLowerCase()}`}>
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
        variant={variant}
        linkBase={linkBase}
      />
    </PhonePreviewShell>
  );
}
