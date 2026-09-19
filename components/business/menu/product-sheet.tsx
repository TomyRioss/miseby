"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadProductImageAction } from "@/lib/actions/restaurant";
import { newId, type RestaurantCategory, type RestaurantProduct } from "@/lib/restaurant-theme";
import type { MenuCopy } from "./menu-copy";
import { MENU_COPY_RESTAURANT } from "./menu-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";

export type SheetState =
  | { mode: "create"; categoryId: string }
  | { mode: "edit"; product: RestaurantProduct; categoryId: string }
  | null;

type VariantRow = { key: string; id?: string; name: string; price: string; costPrice: string; packagingPrice: string; sku: string; isDefault: boolean };
type ModifierRow = { key: string; id?: string; name: string; price: string };
type GroupRow = { key: string; id?: string; name: string; required: boolean; multiple: boolean; modifiers: ModifierRow[] };

function toVariantRows(p?: RestaurantProduct): VariantRow[] {
  if (!p?.variants || p.variants.length === 0) return [];
  return p.variants.map((v, i) => ({
    key: v.id, id: v.id, name: v.name,
    price: String(v.price), costPrice: v.costPrice != null ? String(v.costPrice) : "",
    packagingPrice: v.packagingPrice != null ? String(v.packagingPrice) : "",
    sku: v.sku ?? "", isDefault: i === 0 ? true : v.isDefault,
  }));
}

function toGroupRows(p?: RestaurantProduct): GroupRow[] {
  return (p?.modifierGroups ?? []).map((g) => ({
    key: g.id, id: g.id, name: g.name, required: g.required, multiple: g.multiple,
    modifiers: g.modifiers.map((m) => ({ key: m.id, id: m.id, name: m.name, price: String(m.price) })),
  }));
}

export function ProductSheet({
  state,
  categories,
  onClose,
  onSave,
  copy = MENU_COPY_RESTAURANT,
}: {
  state: SheetState;
  categories: RestaurantCategory[];
  onClose: () => void;
  onSave: (product: RestaurantProduct) => void;
  copy?: MenuCopy;
}) {
  const open = state !== null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [takeAway, setTakeAway] = useState(true);
  const [useVariants, setUseVariants] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.mode === "edit") {
      const p = state.product;
      setName(p.name); setDescription(p.description ?? ""); setCategoryId(state.categoryId);
      setPrice(String(p.price)); setImageUrl(p.imageUrl ?? null);
      setAvailable(p.available); setTakeAway(p.takeAway !== false);
      const vr = toVariantRows(p);
      setVariants(vr); setUseVariants(vr.length > 0);
      setGroups(toGroupRows(p));
    } else {
      setName(""); setDescription(""); setCategoryId(state.categoryId);
      setPrice(""); setImageUrl(null); setAvailable(true); setTakeAway(true);
      setVariants([]); setUseVariants(false); setGroups([]);
    }
  }, [state]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadProductImageAction(fd);
      if (!res.ok) { toast.error(res.error); return; }
      setImageUrl(res.url);
      toast.success("Foto lista.");
    } catch (e) {
      console.error("[product sheet upload]", e);
      toast.error("No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  function confirm() {
    const n = name.trim();
    if (!n) return toast.error(`Poné nombre al ${copy.itemSingular}: ej. ${copy.itemExample}.`);
    if (!categoryId) return toast.error(`Elegí la sección del ${copy.itemSingular}.`);
    const base = Number(price);
    if (!Number.isFinite(base) || base < 0) return toast.error("Precio inválido.");
    let builtVariants: RestaurantProduct["variants"];
    if (useVariants) {
      if (variants.length === 0) return toast.error("Agregá al menos una variante.");
      for (const v of variants) {
        if (!v.name.trim()) return toast.error("Toda variante necesita nombre.");
        const vp = Number(v.price);
        if (!Number.isFinite(vp) || vp < 0) return toast.error(`Precio inválido en "${v.name.trim()}".`);
      }
      builtVariants = variants.map((v, i) => ({
        id: v.id ?? newId("var"), name: v.name.trim(), price: Number(v.price),
        costPrice: v.costPrice === "" ? null : Number(v.costPrice),
        packagingPrice: v.packagingPrice === "" ? null : Number(v.packagingPrice),
        sku: v.sku.trim() ? v.sku.trim() : null,
        isDefault: i === 0 ? true : v.isDefault,
      }));
    }
    for (const g of groups) {
      if (!g.name.trim()) return toast.error("Todo grupo necesita nombre: ej. Color, Adicionales.");
      if (g.modifiers.length === 0) return toast.error(`"${g.name.trim()}" no tiene opciones.`);
      for (const m of g.modifiers) {
        if (!m.name.trim()) return toast.error("Toda opción necesita nombre.");
        if (!Number.isFinite(Number(m.price)) || Number(m.price) < 0) return toast.error(`Precio inválido en "${m.name.trim()}".`);
      }
    }
    const product: RestaurantProduct = {
      id: state?.mode === "edit" ? state.product.id : newId("prd"),
      categoryId, name: n, description: description.trim(), price: base,
      available, imageUrl, takeAway,
      ...(builtVariants ? { variants: builtVariants } : {}),
      ...(groups.length > 0 ? {
        modifierGroups: groups.map((g) => ({
          id: g.id ?? newId("grp"), name: g.name.trim(), required: g.required, multiple: g.multiple,
          modifiers: g.modifiers.map((m) => ({ id: m.id ?? newId("mod"), name: m.name.trim(), price: Number(m.price) })),
        })),
      } : {}),
    };
    onSave(product);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{state?.mode === "edit" ? `Editar ${copy.itemSingular}` : `Nuevo ${copy.itemSingular}`}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-1 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              aria-label={`Subir foto del ${copy.itemSingular}`}
              className="cursor-pointer disabled:cursor-not-allowed flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={name || copy.itemSingular} className="h-full w-full object-cover" />
              ) : uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Foto del {copy.itemSingular}</p>
              <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx 5 MB.</p>
              <div className="mt-1.5 flex gap-2">
                <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? "Subiendo..." : imageUrl ? "Cambiar" : "Subir"}
                </Button>
                {imageUrl && <Button size="sm" variant="ghost" onClick={() => setImageUrl(null)}>Quitar</Button>}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </div>

          <div className="space-y-4">
            <div><Label htmlFor="ps-name">Nombre *</Label>
              <Input id="ps-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder={copy.itemExample} className="mt-1.5 min-h-10" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="ps-cat">Sección *</Label>
                <select id="ps-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1.5 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Elegir...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><Label htmlFor="ps-price">Precio base *</Label>
                <Input id="ps-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="32000" className="mt-1.5 min-h-10 tabular-nums" /></div>
            </div>
            <div>
              <div className="flex items-baseline justify-between"><Label htmlFor="ps-desc">Descripción</Label>
                <span className="text-[11px] tabular-nums text-muted-foreground">{description.length}/240</span></div>
              <Textarea id="ps-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={240} placeholder={copy.descPlaceholder} className="mt-1.5 resize-none" />
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <span className="text-sm font-medium">Visible en {copy.menuNoun}</span>
              <Switch checked={available} onCheckedChange={setAvailable} />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <span className="text-sm font-medium">{copy.takeAwayLabel}</span>
              <Switch checked={takeAway} onCheckedChange={setTakeAway} />
            </label>
          </div>

          <Separator />

          <div>
            <label className="flex cursor-pointer items-center justify-between">
              <span><span className="block text-sm font-semibold">Variantes</span>
                <span className="block text-xs text-muted-foreground">{copy.variantsHint}</span></span>
              <Switch checked={useVariants} onCheckedChange={(v) => {
                setUseVariants(v);
                if (v && variants.length === 0) setVariants([{ key: newId("row"), name: price ? "" : "Único", price, costPrice: "", packagingPrice: "", sku: "", isDefault: true }]);
              }} />
            </label>
            {useVariants && (
              <div className="mt-3 space-y-2">
                {variants.map((v, i) => (
                  <div key={v.key} className="rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2">
                      <input type="radio" name="default-variant" checked={i === 0 || v.isDefault} onChange={() => setVariants((p) => p.map((x, j) => ({ ...x, isDefault: j === i })))} aria-label="Variante por defecto" title="Precio principal" />
                      <Input value={v.name} onChange={(e) => setVariants((p) => p.map((x) => x.key === v.key ? { ...x, name: e.target.value } : x))} placeholder="Ej: Personal / Familiar" maxLength={60} className="min-h-9" />
                      <Input value={v.price} onChange={(e) => setVariants((p) => p.map((x) => x.key === v.key ? { ...x, price: e.target.value } : x))} placeholder="$" type="number" min={0} aria-label="Precio variante" className="w-28 min-h-9 tabular-nums" />
                      <button type="button" onClick={() => setVariants((p) => p.filter((x) => x.key !== v.key))} aria-label="Quitar variante" className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Input value={v.costPrice} onChange={(e) => setVariants((p) => p.map((x) => x.key === v.key ? { ...x, costPrice: e.target.value } : x))} placeholder="Costo" type="number" min={0} aria-label="Costo" className="min-h-9 tabular-nums" />
                      <Input value={v.packagingPrice} onChange={(e) => setVariants((p) => p.map((x) => x.key === v.key ? { ...x, packagingPrice: e.target.value } : x))} placeholder="Empaque" type="number" min={0} aria-label="Empaque" className="min-h-9 tabular-nums" />
                      <Input value={v.sku} onChange={(e) => setVariants((p) => p.map((x) => x.key === v.key ? { ...x, sku: e.target.value } : x))} placeholder="SKU" maxLength={64} aria-label="SKU" className="min-h-9" />
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setVariants((p) => [...p, { key: newId("row"), name: "", price: "", costPrice: "", packagingPrice: "", sku: "", isDefault: p.length === 0 }])}><Plus className="h-4 w-4" /> Variante</Button>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-semibold">Grupos de agregados</p>
            <p className="text-xs text-muted-foreground">{copy.groupsHint}</p>
            <div className="mt-3 space-y-3">
              {groups.map((g) => (
                <div key={g.key} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Input value={g.name} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, name: e.target.value } : x))} placeholder="Ej: Adiciones" maxLength={60} className="min-h-9" />
                    <button type="button" onClick={() => setGroups((p) => p.filter((x) => x.key !== g.key))} aria-label="Quitar grupo" className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={g.required} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, required: e.target.checked } : x))} /> Obligatorio</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={g.multiple} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, multiple: e.target.checked } : x))} /> Varias opciones</label>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {g.modifiers.map((m) => (
                      <div key={m.key} className="flex items-center gap-2">
                        <Input value={m.name} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, modifiers: x.modifiers.map((mm) => mm.key === m.key ? { ...mm, name: e.target.value } : mm) } : x))} placeholder="Ej: Queso extra" maxLength={60} className="min-h-9" />
                        <Input value={m.price} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, modifiers: x.modifiers.map((mm) => mm.key === m.key ? { ...mm, price: e.target.value } : mm) } : x))} placeholder="$" type="number" min={0} aria-label="Precio opción" className="w-28 min-h-9 tabular-nums" />
                        <button type="button" onClick={() => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, modifiers: x.modifiers.filter((mm) => mm.key !== m.key) } : x))} aria-label="Quitar opción" className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, modifiers: [...x.modifiers, { key: newId("row"), name: "", price: "0" }] } : x))}><Plus className="h-3.5 w-3.5" /> Opción</Button>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setGroups((p) => [...p, { key: newId("row"), name: "", required: false, multiple: true, modifiers: [{ key: newId("row"), name: "", price: "0" }] }])}><Plus className="h-4 w-4" /> Grupo</Button>
            </div>
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirm} className="bg-[#0A2540] hover:bg-[#0A2540]/90">{state?.mode === "edit" ? "Aplicar" : `Agregar ${copy.itemSingular}`}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
