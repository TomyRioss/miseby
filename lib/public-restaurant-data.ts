import type { RestaurantData } from "@/lib/restaurant-theme";

/** Keep internal inventory costs out of public pages and their RSC payloads. */
export function publicRestaurantData(data: RestaurantData): RestaurantData {
  return {
    ...data,
    products: data.products?.map((product) => ({
      ...product,
      variants: product.variants?.map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        isDefault: variant.isDefault,
      })),
    })),
  };
}
