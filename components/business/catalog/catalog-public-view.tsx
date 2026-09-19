"use client";

import { RestaurantPublicView } from "../restaurant/restaurant-public-view";
import type {
  RestaurantAppearance,
  RestaurantCategory,
  RestaurantProduct,
  WeekSchedule,
} from "@/lib/restaurant-theme";

/**
 * Vista pública del catálogo multirubro (plan MISE).
 * Mismo layout que la carta restaurant, textos neutros
 * (secciones/productos, sin plato/carta) y enlaces /catalogo.
 */
export function CatalogPublicView({
  appearance,
  categories = [],
  products = [],
  currency = "COP",
  hours,
  preview = false,
  businessName,
  slug,
  schedule,
}: {
  appearance: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  currency?: string | null;
  hours?: string;
  preview?: boolean;
  businessName?: string;
  slug?: string;
  schedule?: WeekSchedule;
}) {
  return (
    <RestaurantPublicView
      appearance={appearance}
      categories={categories}
      products={products}
      currency={currency}
      hours={hours}
      preview={preview}
      restaurantName={businessName}
      slug={slug}
      schedule={schedule}
      variant="catalog"
      linkBase="catalogo"
    />
  );
}
