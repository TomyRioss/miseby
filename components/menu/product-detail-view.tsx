"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  formatPrice,
  productPrice,
  type RestaurantAppearance,
  type RestaurantProduct,
} from "@/lib/restaurant-theme";
import { usePedido } from "./use-pedido";

export function ProductDetailView({
  product: p,
  currency = "COP",
  slug,
  appearance: ap,
}: {
  product: RestaurantProduct;
  currency?: string | null;
  slug: string;
  appearance: RestaurantAppearance;
}) {
  const router = useRouter();
  const { add } = usePedido(slug);
  const cur = currency ?? "COP";
  const primary = ap.primary || "#0A2540";
  const text = ap.text || "#171717";
  const border = /^#[0-9a-fA-F]{6}$/.test(text) ? `${text}1F` : text;

  const variants = useMemo(() => p.variants ?? [], [p.variants]);
  const groups = useMemo(() => p.modifierGroups ?? [], [p.modifierGroups]);
  const [variantId, setVariantId] = useState<string | null>(
    variants.find((v) => v.isDefault)?.id ?? variants[0]?.id ?? null,
  );
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const base = variant ? variant.price : p.price;

  const modsSum = useMemo(
    () =>
      groups.reduce((acc, g) => {
        const ids = sel[g.id] ?? [];
        return acc + g.modifiers.filter((m) => ids.includes(m.id)).reduce((a, m) => a + m.price, 0);
      }, 0),
    [groups, sel],
  );

  const unit = base + modsSum;
  const total = unit * qty;

  function toggle(groupId: string, modId: string, multiple: boolean) {
    setSel((prev) => {
      const curSel = prev[groupId] ?? [];
      if (multiple) {
        return { ...prev, [groupId]: curSel.includes(modId) ? curSel.filter((id) => id !== modId) : [...curSel, modId] };
      }
      return { ...prev, [groupId]: curSel.includes(modId) ? [] : [modId] };
    });
  }

  function handleAdd() {
    try {
      const missing = groups.filter((g) => g.required && (sel[g.id] ?? []).length === 0);
      if (missing.length > 0) {
        toast.error(`Elegí: ${missing.map((g) => g.name).join(", ")}.`);
        return;
      }
      const modNames = groups.flatMap((g) =>
        g.modifiers.filter((m) => (sel[g.id] ?? []).includes(m.id)).map((m) => m.name),
      );
      const modIds = groups.flatMap((g) => (sel[g.id] ?? []).slice().sort());
      const id = modIds.length > 0 || variant ? `${p.id}|${variant?.id ?? "base"}|${modIds.join(",")}` : p.id;
      const detail = [variant && variants.length > 1 ? variant.name : null, ...modNames].filter(Boolean).join(" · ");
      add({ id, name: detail ? `${p.name} (${detail})` : p.name, price: unit }, qty);
      toast.success(`${p.name} agregado.`);
      router.push(`/menu/${slug}`);
    } catch (e) {
      console.error("[product add]", e);
      toast.error("No se pudo agregar.");
    }
  }

  return (
    <main className="min-h-screen pb-28" style={{ background: ap.background || "#fff", color: text }}>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href={`/menu/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium opacity-70">
          <ArrowLeft className="h-4 w-4" /> Volver al menú
        </Link>
      </div>
      {p.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imageUrl} alt={p.name} className="mx-auto mt-3 max-h-72 w-full max-w-2xl rounded-xl object-cover px-4" />
      ) : null}
      <div className="mx-auto max-w-2xl px-4 pt-4">
        {!p.available ? (
          <p className="mb-2 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
            No disponible por el momento
          </p>
        ) : null}
        <h1 className="text-2xl font-bold">{p.name}</h1>
        {p.description ? <p className="mt-1 text-sm opacity-70">{p.description}</p> : null}
        <p className="mt-2 text-lg font-bold" style={{ color: primary }}>
          {formatPrice(productPrice(p), cur)}
        </p>

        {variants.length > 1 ? (
          <section className="mt-5">
            <p className="font-bold">Elegí una opción</p>
            <div className="mt-2 flex flex-col gap-2">
              {variants.map((v) => (
                <label
                  key={v.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-3"
                  style={{ borderColor: variantId === v.id ? primary : border }}
                >
                  <input
                    type="radio"
                    name="variant"
                    checked={variantId === v.id}
                    onChange={() => setVariantId(v.id)}
                    className="h-4 w-4 accent-current"
                    style={{ accentColor: primary }}
                  />
                  <span className="flex-1 font-medium">{v.name}</span>
                  <span className="font-bold">{formatPrice(v.price, cur)}</span>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {groups.map((g) => (
          <section key={g.id} className="mt-5">
            <p className="font-bold">
              {g.name}{" "}
              {g.required ? (
                <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">Requerido</span>
              ) : null}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {g.modifiers.map((m) => {
                const checked = (sel[g.id] ?? []).includes(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-3"
                    style={{ borderColor: checked ? primary : border }}
                  >
                    <input
                      type={g.multiple ? "checkbox" : "radio"}
                      name={g.multiple ? undefined : `grp-${g.id}`}
                      checked={checked}
                      onChange={() => toggle(g.id, m.id, g.multiple)}
                      className="h-4 w-4"
                      style={{ accentColor: primary }}
                    />
                    <span className="flex-1">{m.name}</span>
                    <span className="font-semibold">{m.price > 0 ? `+${formatPrice(m.price, cur)}` : "Sin costo"}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <section className="mt-5 flex items-center gap-3">
          <p className="font-bold">Unidades</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Quitar uno"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-40"
              style={{ borderColor: border }}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-bold">{qty}</span>
            <button
              type="button"
              aria-label="Agregar uno"
              onClick={() => setQty((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border"
              style={{ borderColor: border }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-2xl border-t bg-white p-4" style={{ borderColor: border }}>
        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: primary }}
        >
          Agregar a mi pedido · {formatPrice(total, cur)}
        </button>
      </div>
    </main>
  );
}
