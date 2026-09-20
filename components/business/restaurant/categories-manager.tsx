"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveCategoriesAction } from "@/lib/actions/restaurant";
import { newId, type RestaurantAppearance, type RestaurantCategory, type RestaurantProduct, type WeekSchedule } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MenuEditorLayout } from "./menu-editor-layout";
import { CartaPhonePreview } from "./carta-phone-preview";

export function CategoriesManager({
  initial,
  appearance,
  products = [],
  currency = "COP",
  slug,
  hours,
  schedule,
  commercialName,
}: {
  initial: RestaurantCategory[];
  appearance: RestaurantAppearance;
  products?: RestaurantProduct[];
  currency?: string | null;
  slug?: string;
  hours?: string;
  schedule?: WeekSchedule;
  commercialName?: string | null;
}) {
  const [items, setItems] = useState<RestaurantCategory[]>([...initial].sort((a, b) => a.order - b.order));
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function touch(next: RestaurantCategory[]) {
    setItems(next);
    setDirty(true);
  }

  function add() {
    const n = name.trim();
    if (!n) return toast.error("Escribí un nombre: ej. Postres.");
    if (items.some((c) => c.name.toLowerCase() === n.toLowerCase())) return toast.error("Esa categoría ya existe.");
    if (items.length >= 100) return toast.error("Máximo 100 categorías.");
    touch([...items, { id: newId("cat"), name: n, order: items.length }]);
    setName("");
  }

  function move(id: string, dir: -1 | 1) {
    const i = items.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    touch(next.map((c, idx) => ({ ...c, order: idx })));
  }

  function remove(id: string) {
    const target = items.find((c) => c.id === id);
    touch(items.filter((c) => c.id !== id).map((c, idx) => ({ ...c, order: idx })));
    toast(`“${target?.name}” eliminada. Guardá para confirmar.`);
  }

  async function save() {
    const clean = items.map((c) => ({ ...c, name: c.name.trim() })).filter((c) => c.name.length > 0);
    if (clean.length === 0) return toast.error("Dejá al menos una categoría con nombre.");
    setSaving(true);
    try {
      const res = await saveCategoriesAction(clean);
      if (!res.ok) throw new Error(res.error);
      setDirty(false);
      toast.success(`${clean.length} categorías en tu carta.`);
    } catch (e) {
      console.error("[categorias]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MenuEditorLayout
      left={
        <div className="flex flex-col gap-4">
          <section aria-labelledby="cat-new" className="rounded-2xl border border-border bg-card p-6">
        <h2 id="cat-new" className="mt-1 text-base font-semibold tracking-tight">Nueva sección</h2>
        <p className="mb-4 mt-1 text-[13px] leading-relaxed text-muted-foreground">Entradas, Fuertes, Postres, Bebidas. El orden de acá es el orden de la carta.</p>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Postres..." maxLength={60} onKeyDown={(e) => e.key === "Enter" && add()} aria-label="Nombre de categoría" className="min-h-10" />
          <Button onClick={add} className="min-h-10 shrink-0 bg-[#0A2540] hover:bg-[#0A2540]/90"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Agregar</span></Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Entradas", "Fuertes", "Postres", "Bebidas"].map((s) => (
            <button key={s} type="button" onClick={() => setName(s)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]">+ {s}</button>
          ))}
        </div>
        <div className="mt-5 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
          Tip de carta: 4 a 7 secciones venden más que 15. Agrupá, no fragmentes.
        </div>
      </section>

      <section aria-labelledby="cat-list" className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <h2 id="cat-list" className="mt-1 text-base font-semibold tracking-tight">Tus secciones</h2>
          <Badge variant="secondary" className="tabular-nums">{items.length}</Badge>
          {dirty && <Badge className="bg-[#6D28D9]">Sin guardar</Badge>}
        </div>
        <div className="mt-4 space-y-2">
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <p className="text-sm font-semibold">Empezá con “Entradas”</p>
              <p className="mx-auto mt-1 max-w-65 text-[13px] leading-relaxed text-muted-foreground">Sin secciones no hay carta. Creá la primera a la izquierda.</p>
            </div>
          )}
          {items.map((c, idx) => (
            <div key={c.id} className="flex items-center gap-1.5 rounded-xl border border-border px-2 py-2 transition-colors focus-within:border-[#6D28D9] hover:bg-muted/40">
              <span className="w-6 shrink-0 text-center text-xs font-bold tabular-nums text-muted-foreground">{idx + 1}</span>
              <div className="flex shrink-0 flex-col">
                <button onClick={() => move(c.id, -1)} disabled={idx === 0} aria-label={`Subir ${c.name}`} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => move(c.id, 1)} disabled={idx === items.length - 1} aria-label={`Bajar ${c.name}`} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              </div>
              {editingId === c.id ? (
                <Input value={c.name} maxLength={60} onChange={(e) => touch(items.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))} onBlur={() => setEditingId(null)} onKeyDown={(e) => e.key === "Enter" && setEditingId(null)} autoFocus aria-label="Renombrar categoría" className="min-h-9" />
              ) : (
                <span className="min-w-0 flex-1 truncate px-1 text-sm font-medium">{c.name}</span>
              )}
              <button onClick={() => setEditingId(c.id)} aria-label={`Renombrar ${c.name}`} className="min-h-9 min-w-9 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(c.id)} aria-label={`Eliminar ${c.name}`} className="min-h-9 min-w-9 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <Button onClick={save} disabled={saving || !dirty && items.length > 0 && false} className="mt-4 min-h-10 w-full bg-[#0A2540] hover:bg-[#0A2540]/90 sm:w-auto sm:px-8">
          {saving ? "Guardando..." : dirty ? "Guardar cambios" : <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" />Al día</span>}
        </Button>
        </section>
        </div>
      }
      preview={
        <CartaPhonePreview
          slug={slug}
          appearance={appearance}
          categories={items}
          products={products}
          currency={currency}
          hours={hours}
          restaurantName={appearance.restaurantName || commercialName || ""}
          schedule={schedule}
        />
      }
    />
  );
}
