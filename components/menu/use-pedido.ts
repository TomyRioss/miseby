"use client";

import { useCallback, useState } from "react";

export type PedidoItem = { id: string; name: string; price: number; qty: number };

function key(slug: string) {
  return `miseby.pedido.${slug}`;
}

function load(slug: string): PedidoItem[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(key(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => x && typeof x.id === "string") : [];
  } catch (e) {
    console.error("[pedido load]", e);
    return [];
  }
}

/** Carrito del pedido por slug, persistido en localStorage. Sin DB. */
export function usePedido(slug: string) {
  // Inicialización perezosa (lee localStorage una vez, sin efecto).
  const [items, setItems] = useState<PedidoItem[]>(() => load(slug));

  const persist = useCallback(
    (next: PedidoItem[]) => {
      setItems(next);
      try {
        window.localStorage.setItem(key(slug), JSON.stringify(next));
      } catch (e) {
        console.error("[pedido save]", e);
      }
    },
    [slug],
  );

  const add = useCallback(
    (item: Omit<PedidoItem, "qty">, qty = 1) => {
      const cur = load(slug);
      const found = cur.find((x) => x.id === item.id);
      persist(
        found
          ? cur.map((x) => (x.id === item.id ? { ...x, qty: x.qty + qty } : x))
          : [...cur, { ...item, qty }],
      );
    },
    [slug, persist],
  );

  const setQty = useCallback(
    (id: string, qty: number) => {
      const cur = load(slug);
      persist(qty <= 0 ? cur.filter((x) => x.id !== id) : cur.map((x) => (x.id === id ? { ...x, qty } : x)));
    },
    [slug, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const count = items.reduce((n, x) => n + x.qty, 0);
  const total = items.reduce((n, x) => n + x.qty * x.price, 0);

  return { items, add, setQty, clear, count, total };
}
