"use client";

import { useMemo, useState } from "react";
import { CirclePause, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveProductsAction } from "@/lib/actions/restaurant";
import { formatPrice, newId, type RestaurantAppearance, type RestaurantCategory, type RestaurantProduct, type WeekSchedule } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MenuEditorLayout } from "./menu-editor-layout";
import { CartaPhonePreview } from "./carta-phone-preview";

const EMPTY: RestaurantProduct = { id: "", categoryId: "", name: "", description: "", price: 0, available: true };

export function ProductsManager({
  initialProducts,
  categories,
  currency,
  appearance,
  slug,
  hours,
  schedule,
}: {
  initialProducts: RestaurantProduct[];
  categories: RestaurantCategory[];
  currency?: string | null;
  appearance: RestaurantAppearance;
  slug?: string;
  hours?: string;
  schedule?: WeekSchedule;
}) {
  const [items, setItems] = useState<RestaurantProduct[]>(initialProducts);
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState<RestaurantProduct>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const visible = useMemo(() => (filter === "all" ? items : items.filter((p) => p.categoryId === filter)), [items, filter]);
  const countFor = (id: string) => items.filter((p) => p.categoryId === id).length;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Sin sección";
  const availableCount = items.filter((p) => p.available).length;

  function touch(next: RestaurantProduct[]) {
    setItems(next);
    setDirty(true);
  }

  function toggleAvailable(id: string) {
    touch(items.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  }

  function startEdit(p: RestaurantProduct) {
    setEditingId(p.id);
    setDraft({ ...p });
  }

  function cancel() {
    setEditingId(null);
    setDraft(EMPTY);
  }

  function submit() {
    const name = draft.name.trim();
    if (!name) return toast.error("Poné nombre al plato: ej. Bandeja paisa.");
    if (!draft.categoryId) return toast.error("Elegí la sección del plato.");
    if (categories.length === 0) return toast.error("Creá una categoría primero.");
    if (!Number.isFinite(draft.price) || draft.price < 0) return toast.error("Precio inválido.");
    if (editingId) {
      touch(items.map((x) => (x.id === editingId ? { ...draft, name, description: draft.description?.trim() } : x)));
      toast.success("Plato actualizado. Guardá para publicar.");
    } else {
      if (items.length >= 500) return toast.error("Máximo 500 platos.");
      touch([...items, { ...draft, id: newId("prd"), name, description: draft.description?.trim() }]);
    }
    cancel();
  }

  async function save() {
    setSaving(true);
    try {
      const res = await saveProductsAction(items);
      if (!res.ok) throw new Error(res.error);
      setDirty(false);
      toast.success(`Carta al día: ${availableCount} platos visibles.`);
    } catch (e) {
      console.error("[productos]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MenuEditorLayout
      left={
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-sm"><strong className="tabular-nums">{items.length}</strong> <span className="text-muted-foreground">platos</span></p>
            <p className="text-sm"><strong className="tabular-nums text-emerald-600">{availableCount}</strong> <span className="text-muted-foreground">visibles</span></p>
            <p className="text-sm"><strong className="tabular-nums">{items.length - availableCount}</strong> <span className="text-muted-foreground">pausados</span></p>
            {dirty && <Badge className="ml-auto bg-[#6D28D9]">Cambios sin guardar</Badge>}
          </div>

          <div className="flex flex-col gap-4">
            <section aria-labelledby="prod-list" className="rounded-2xl border border-border bg-card p-6">
          <h2 id="prod-list" className="mt-1 text-base font-semibold tracking-tight">Tu carta</h2>
          <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar por sección">
            <button role="tab" aria-selected={filter === "all"} onClick={() => setFilter("all")} className={`min-h-8 rounded-full border px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] ${filter === "all" ? "border-[#0A2540] bg-[#0A2540] text-white" : "border-border text-muted-foreground hover:bg-muted"}`}>Todos · {items.length}</button>
            {categories.map((c) => (
              <button key={c.id} role="tab" aria-selected={filter === c.id} onClick={() => setFilter(c.id)} className={`min-h-8 rounded-full border px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] ${filter === c.id ? "border-[#0A2540] bg-[#0A2540] text-white" : "border-border text-muted-foreground hover:bg-muted"}`}>{c.name} · {countFor(c.id)}</button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {visible.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm font-semibold">{categories.length === 0 ? "Primero las secciones" : "Nada por acá todavía"}</p>
                <p className="mx-auto mt-1 max-w-65 text-[13px] text-muted-foreground">{categories.length === 0 ? "Andá a Categorías y creá Entradas, Fuertes..." : "Agregá el primer plato con el formulario."}</p>
              </div>
            )}
            {visible.map((p) => (
              <article key={p.id} className={`flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/40 ${p.available ? "" : "bg-muted/50"}`}>
                <button onClick={() => toggleAvailable(p.id)} aria-label={p.available ? `Pausar ${p.name}` : `Activar ${p.name}`} title={p.available ? "Visible · tocá para pausar" : "Pausado · tocá para activar"} className={`flex h-2.5 w-2.5 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] ${p.available ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs tabular-nums text-muted-foreground">{catName(p.categoryId)} · {formatPrice(p.price, currency ?? "COP")}{p.available ? "" : " · pausado"}</p>
                </div>
                {!p.available && <CirclePause className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
                <button onClick={() => startEdit(p)} aria-label={`Editar ${p.name}`} className="min-h-9 min-w-9 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => touch(items.filter((x) => x.id !== p.id))} aria-label={`Eliminar ${p.name}`} className="min-h-9 min-w-9 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </article>
            ))}
          </div>
          <Button onClick={save} disabled={saving} className="mt-4 min-h-10 w-full bg-[#0A2540] hover:bg-[#0A2540]/90 sm:w-auto sm:px-8">{saving ? "Publicando..." : dirty ? "Guardar y publicar" : "Carta al día"}</Button>
        </section>

        <section aria-labelledby="prod-form" className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 id="prod-form" className="mt-1 text-base font-semibold tracking-tight">{editingId ? "Editar plato" : "Nuevo plato"}</h2>
          <p className="mb-4 mt-1 text-[13px] text-muted-foreground">Nombre corto, sección correcta y precio final.</p>
          {categories.length === 0 ? (
            <p className="rounded-xl bg-muted p-3 text-[13px] text-muted-foreground">Creá una sección primero en Categorías.</p>
          ) : (
            <div className="space-y-4">
              <div><Label htmlFor="prd-name">Nombre *</Label><Input id="prd-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} maxLength={80} placeholder="Bandeja paisa" className="mt-1.5 min-h-10" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="prd-cat">Sección *</Label>
                  <select id="prd-cat" value={draft.categoryId} onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))} className="mt-1.5 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]">
                    <option value="">Elegir...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><Label htmlFor="prd-price">Precio *</Label><Input id="prd-price" type="number" min={0} max={100000000} value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))} className="mt-1.5 min-h-10 tabular-nums" /></div>
              </div>
              <div>
                <div className="flex items-baseline justify-between"><Label htmlFor="prd-desc">Descripción</Label><span className="text-[11px] tabular-nums text-muted-foreground">{(draft.description ?? "").length}/240</span></div>
                <Textarea id="prd-desc" value={draft.description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={2} maxLength={240} placeholder="Qué trae, en una línea que antoje" className="mt-1.5 resize-none" />
              </div>
              <label htmlFor="prd-av" className="flex cursor-pointer items-center justify-between rounded-xl border border-border px-3 py-2.5">
                <span><span className="block text-sm font-medium">Visible en carta</span><span className="block text-xs text-muted-foreground">Apagalo si se agotó, sin borrarlo</span></span>
                <Switch id="prd-av" checked={draft.available} onCheckedChange={(v) => setDraft((d) => ({ ...d, available: v }))} />
              </label>
              <div className="flex gap-2">
                <Button onClick={submit} className="min-h-10 flex-1 bg-[#0A2540] hover:bg-[#0A2540]/90"><Plus className="h-4 w-4" /> {editingId ? "Aplicar" : "Agregar a la lista"}</Button>
                {editingId && <Button variant="outline" onClick={cancel} className="min-h-10">Cancelar</Button>}
              </div>
            </div>
          )}
          </section>
          </div>
        </>
      }
      preview={
        <CartaPhonePreview
          slug={slug}
          appearance={appearance}
          categories={categories}
          products={items}
          currency={currency}
          hours={hours}
          restaurantName={appearance.restaurantName}
          schedule={schedule}
        />
      }
    />
  );
}
