"use client";

import { MenuManager } from "../menu/menu-manager";
import { MENU_COPY_CATALOG } from "../menu/menu-copy";
import type {
  RestaurantAppearance,
  RestaurantCategory,
  RestaurantProduct,
  WeekSchedule,
} from "@/lib/restaurant-theme";

/**
 * Editor del catálogo multirubro (plan MISE).
 * Reutiliza MenuManager con copia neutra: secciones/productos,
 * variantes genéricas + agregados opcionales por producto.
 */
export function CatalogManager({
  initialCategories,
  initialProducts,
  appearance,
  currency,
  slug,
  hours,
  menuPublished,
  schedule,
}: {
  initialCategories: RestaurantCategory[];
  initialProducts: RestaurantProduct[];
  appearance: RestaurantAppearance;
  currency?: string | null;
  slug: string;
  hours?: string;
  menuPublished: boolean;
  schedule?: WeekSchedule;
}) {
  return (
    <MenuManager
      initialCategories={initialCategories}
      initialProducts={initialProducts}
      appearance={appearance}
      currency={currency}
      slug={slug}
      hours={hours}
      menuPublished={menuPublished}
      schedule={schedule}
      copy={MENU_COPY_CATALOG}
    />
  );
}
