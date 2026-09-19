/**
 * Seed inicial de carta para cuentas del plan MISE RESTAURANT.
 * Espejo del modelo de Platorest (`lib/default-categories.ts` +
 * `lib/default-products.ts` + `ensureFeaturedCategory`):
 * - "Destacados" es categoría destacada (`featured`, orden 0).
 * - Cada categoría trae un producto semilla con variante "Único" default.
 * - Los grupos de modificadores (adiciones / datos del producto) van
 *   embebidos en cada producto, igual que `modifierGroups` de Platorest.
 */
import {
  newId,
  type RestaurantCategory,
  type RestaurantProduct,
} from "./restaurant-theme";

export const RESTAURANT_SEED_CATEGORY_NAMES = [
  "Destacados",
  "Recomendados",
  "Bebidas",
] as const;

type SeedModifier = { name: string; price?: number };
type SeedGroup = {
  name: string;
  required: boolean;
  multiple: boolean;
  options: SeedModifier[];
};
type SeedProduct = {
  categoryName: string;
  name: string;
  description: string;
  price: number;
  modifierGroups?: SeedGroup[];
};

const SEED_PRODUCTS: SeedProduct[] = [
  {
    categoryName: "Destacados",
    name: "Plato de la casa",
    description: "El favorito de nuestros clientes. Preguntá por la opción del día.",
    price: 25000,
    modifierGroups: [
      {
        name: "Adiciones",
        required: false,
        multiple: true,
        options: [
          { name: "Porción extra", price: 5000 },
          { name: "Queso gratinado", price: 4000 },
          { name: "Salsa de la casa", price: 2000 },
        ],
      },
    ],
  },
  {
    categoryName: "Recomendados",
    name: "Recomendado del chef",
    description: "Selección del chef con ingredientes frescos de temporada.",
    price: 28000,
  },
  {
    categoryName: "Bebidas",
    name: "Gaseosa 500ml",
    description: "Fría. Elegí el sabor.",
    price: 6000,
    modifierGroups: [
      {
        name: "Sabor",
        required: true,
        multiple: false,
        options: [{ name: "Cola" }, { name: "Naranja" }, { name: "Limón" }],
      },
    ],
  },
];

export function buildRestaurantSeed(): {
  categories: RestaurantCategory[];
  products: RestaurantProduct[];
} {
  const categories: RestaurantCategory[] = RESTAURANT_SEED_CATEGORY_NAMES.map(
    (name, order) => ({
      id: newId("cat"),
      name,
      order,
      ...(order === 0 ? { featured: true as const } : {}),
    }),
  );
  const catIdByName = new Map(categories.map((c) => [c.name, c.id]));
  const products: RestaurantProduct[] = SEED_PRODUCTS.map((s) => ({
    id: newId("prd"),
    categoryId: catIdByName.get(s.categoryName) ?? categories[0]!.id,
    name: s.name,
    description: s.description,
    price: s.price,
    available: true,
    imageUrl: null,
    takeAway: true,
    variants: [
      {
        id: newId("var"),
        name: "Único",
        price: s.price,
        costPrice: null,
        packagingPrice: null,
        sku: null,
        isDefault: true,
      },
    ],
    ...(s.modifierGroups
      ? {
          modifierGroups: s.modifierGroups.map((g) => ({
            id: newId("grp"),
            name: g.name,
            required: g.required,
            multiple: g.multiple,
            modifiers: g.options.map((o) => ({
              id: newId("mod"),
              name: o.name,
              price: o.price ?? 0,
            })),
          })),
        }
      : {}),
  }));
  return { categories, products };
}
