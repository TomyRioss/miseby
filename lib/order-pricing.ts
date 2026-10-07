import type { RestaurantProduct } from "./restaurant-theme";

export type PricedItem = { id: string; name: string; price: number; qty: number };
const MAX_ORDER_TOTAL = 2_147_483_647;

/** Resolve every selection and price against the current server catalog. */
export function priceItems(products: RestaurantProduct[], items: { id: string; qty: number }[]): PricedItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((it) => {
    if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > 99) {
      throw new Error("Cantidad inválida.");
    }
    const parts = it.id.split("|");
    if (parts.length !== 1 && (parts.length !== 3 || !parts[1])) {
      throw new Error("Selección de producto inválida.");
    }
    const [productId, variantPart, modsPart] = parts;
    const p = byId.get(productId);
    if (!p) throw new Error("Hay productos que ya no existen en la carta. Rearmá el pedido.");
    if (!p.available) throw new Error(`"${p.name}" no está disponible ahora.`);
    const variants = p.variants ?? [];
    let unit = p.price;
    const detail: string[] = [];
    if (variants.length > 0 && (!variantPart || variantPart === "base")) {
      throw new Error(`Elegí una variante de "${p.name}".`);
    }
    if (variantPart && variantPart !== "base") {
      const v = variants.find((x) => x.id === variantPart);
      if (!v) throw new Error(`Variante no válida en "${p.name}". Rearmá el pedido.`);
      unit = v.price;
      detail.push(v.name);
    }
    if (!Number.isSafeInteger(unit) || unit < 0) throw new Error(`Precio inválido en "${p.name}".`);
    const modIds = modsPart ? modsPart.split(",") : [];
    if (modIds.some((id) => !id) || new Set(modIds).size !== modIds.length) {
      throw new Error(`Agregados inválidos en "${p.name}".`);
    }
    const groups = p.modifierGroups ?? [];
    for (const g of groups) {
      const selected = g.modifiers.filter((m) => modIds.includes(m.id));
      if (g.required && selected.length === 0) {
        throw new Error(`Elegí una opción de "${g.name}" en "${p.name}".`);
      }
      if (!g.multiple && selected.length > 1) {
        throw new Error(`Elegí una sola opción de "${g.name}" en "${p.name}".`);
      }
    }
    const allMods = groups.flatMap((g) => g.modifiers);
    for (const id of modIds) {
      const matches = allMods.filter((m) => m.id === id);
      if (matches.length !== 1) throw new Error(`Agregado no válido en "${p.name}". Rearmá el pedido.`);
      const m = matches[0];
      if (!Number.isSafeInteger(m.price) || m.price < 0) throw new Error(`Precio inválido en "${p.name}".`);
      unit += m.price;
      detail.push(m.name);
    }
    if (!Number.isSafeInteger(unit) || unit < 0 || unit > MAX_ORDER_TOTAL) {
      throw new Error(`Precio inválido en "${p.name}".`);
    }
    return { id: it.id, name: detail.length ? `${p.name} (${detail.join(" · ")})` : p.name, price: unit, qty: it.qty };
  });
}

export function orderTotal(items: PricedItem[]): number {
  const total = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  if (!Number.isSafeInteger(total) || total < 0 || total > MAX_ORDER_TOTAL) {
    throw new Error("El total del pedido supera el máximo permitido.");
  }
  return total;
}
