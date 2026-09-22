"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadProductImageAction } from "@/lib/actions/restaurant";
import { ImageCropDialog } from "@/components/miselink/editor/image-crop-dialog";
import { newId, type RestaurantCategory, type RestaurantProduct } from "@/lib/restaurant-theme";
import type { MenuCopy } from "./menu-copy";
import { MENU_COPY_RESTAURANT } from "./menu-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  const anyDefault = p.variants.some((v) => v.isDefault);
  return p.variants.map((v, i) => ({
    key: v.id, id: v.id, name: v.name,
    price: String(v.price), costPrice: v.costPrice != null ? String(v.costPrice) : "",
    packagingPrice: v.packagingPrice != null ? String(v.packagingPrice) : "",
    sku: v.sku ?? "", isDefault: anyDefault ? v.isDefault === true : i === 0,
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
  const [generating, setGenerating] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
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

  async function handleGenerateDescription() {
    const n = name.trim();
    if (!n) return toast.error("Poné el nombre primero.");
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/mise-ia/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, itemWord: copy.itemSingular }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || typeof data.text !== "string") {
        toast.error(data?.error ?? "La IA no está disponible ahora.");
        return;
      }
      setDescription(data.text.slice(0, 240));
      toast.success("Descripción generada. Editala a gusto.");
    } catch (e) {
      console.error("[describe]", e);
      toast.error("No se pudo generar. Probá de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Solo JPG, PNG o WebP.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Máximo 20 MB.");
      return;
    }
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function closeCrop() {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function uploadCropped(file: File) {
    closeCrop();
    setUploading(true);
    try {
      // El recorte ya sale en WebP comprimido (ImageCropDialog).
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadProductImageAction(fd);
      if (!res.ok) { toast.error(res.error); return; }
      setImageUrl(res.url);
      toast.success("Foto subida.");
    } catch (e) {
      console.error("[product sheet upload]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  function confirm() {
    if (uploading) return toast.error("Esperá a que termine de subir la foto.");
    const n = name.trim();
    if (!n) return toast.error(`Poné nombre al ${copy.itemSingular}: ej. ${copy.itemExample}.`);
    if (!categoryId) return toast.error(`Elegí la sección del ${copy.itemSingular}.`);
    if (price.trim() === "") return toast.error("Poné el precio base: es obligatorio.");
    const base = Number(price);
    if (!Number.isFinite(base) || base <= 0) return toast.error("El precio base tiene que ser mayor a $0.");
    let builtVariants: RestaurantProduct["variants"];
    if (useVariants) {
      if (variants.length === 0) return toast.error("Agregá al menos una variante.");
      if (!variants.some((v) => v.isDefault)) return toast.error("Elegí la variante por defecto.");
      const seenSku = new Set<string>();
      for (const v of variants) {
        if (!v.name.trim()) return toast.error("Toda variante necesita nombre.");
        if (v.price.trim() === "") return toast.error(`Poné el precio de "${v.name.trim() || "la variante"}".`);
        const vp = Number(v.price);
        if (!Number.isFinite(vp) || vp <= 0) return toast.error(`El precio de "${v.name.trim()}" tiene que ser mayor a $0.`);
        const sku = v.sku.trim().toLowerCase();
        if (sku) {
          if (seenSku.has(sku)) return toast.error(`El SKU "${v.sku.trim()}" está duplicado.`);
          seenSku.add(sku);
        }
      }
      builtVariants = variants.map((v) => ({
        id: v.id ?? newId("var"), name: v.name.trim(), price: Number(v.price),
        costPrice: v.costPrice === "" ? null : Number(v.costPrice),
        packagingPrice: v.packagingPrice === "" ? null : Number(v.packagingPrice),
        sku: v.sku.trim() ? v.sku.trim() : null,
        isDefault: v.isDefault,
      }));
    }
    for (const g of groups) {
      if (!g.name.trim()) return toast.error(`Todo grupo necesita nombre: ${copy.groupsHint}`);
      if (g.modifiers.length === 0) return toast.error(`"${g.name.trim()}" no tiene opciones.`);
      for (const m of g.modifiers) {
        if (!m.name.trim()) return toast.error("Toda opción necesita nombre.");
        if (!Number.isFinite(Number(m.price)) || Number(m.price) < 0) return toast.error(`El precio de "${m.name.trim() || "la opción"}" no puede ser negativo.`);
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
    <>
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-full flex-col overflow-x-hidden sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{state?.mode === "edit" ? `Editar ${copy.itemSingular}` : `Nuevo ${copy.itemSingular}`}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
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
              <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx 20 MB.</p>
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
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generating}
                    className="cursor-pointer inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-[#6D28D9] transition-colors hover:bg-[#6D28D9]/10 disabled:cursor-wait disabled:opacity-60"
                  >
                    {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {generating ? "Generando…" : description ? "Regenerar con IA" : "Generar con IA"}
                  </button>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{description.length}/240</span>
                </span></div>
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

          <div>
            <label className="flex cursor-pointer items-center justify-between">
              <span><span className="block text-sm font-semibold">Variantes</span>
                <span className="block text-xs text-muted-foreground">{copy.variantsHint}</span></span>
              <Switch checked={useVariants} onCheckedChange={(v) => {
                setUseVariants(v);
                if (v && variants.length === 0) setVariants([{ key: newId("row"), name: "", price, costPrice: "", packagingPrice: "", sku: "", isDefault: true }]);
              }} />
            </label>
            {useVariants && (
              <div className="mt-3 space-y-2">
                {variants.map((v, i) => (
                  <div key={v.key} className="rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2">
                      <input type="radio" name="default-variant" checked={v.isDefault} onChange={() => setVariants((p) => p.map((x, j) => ({ ...x, isDefault: j === i })))} aria-label="Variante por defecto" title="Precio principal" />
                      <Input value={v.name} onChange={(e) => setVariants((p) => p.map((x) => x.key === v.key ? { ...x, name: e.target.value } : x))} placeholder={copy.variantExample} maxLength={60} className="min-h-9 min-w-0" />
                      <Input value={v.price} onChange={(e) => setVariants((p) => p.map((x) => x.key === v.key ? { ...x, price: e.target.value } : x))} placeholder="$" type="number" min={0} aria-label="Precio variante" className="w-24 shrink-0 min-h-9 tabular-nums" />
                      <button type="button" onClick={() => setVariants((p) => p.filter((x) => x.key !== v.key))} aria-label="Quitar variante" className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setVariants((p) => [...p, { key: newId("row"), name: "", price: "", costPrice: "", packagingPrice: "", sku: "", isDefault: p.length === 0 }])}><Plus className="h-4 w-4" /> Variante</Button>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold">Grupos de agregados</p>
            <p className="text-xs text-muted-foreground">{copy.groupsHint} El precio de cada opción es lo que se suma al {copy.itemSingular}. Poné 0 si es sin cargo.</p>
            <div className="mt-3 space-y-3">
              {groups.map((g) => {
                const summary = g.required
                  ? g.multiple ? "El cliente debe elegir al menos 1 (puede elegir varias)."
                  : "El cliente debe elegir 1 opción."
                  : g.multiple ? "El cliente puede no elegir o elegir varias."
                  : "El cliente puede elegir hasta 1 (opcional).";
                return (
                <div key={g.key} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs text-muted-foreground">Nombre del grupo *</Label>
                      <Input value={g.name} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, name: e.target.value } : x))} placeholder={copy.groupExample} maxLength={60} className="mt-1 min-h-9" />
                    </div>
                    <button type="button" onClick={() => setGroups((p) => p.filter((x) => x.key !== g.key))} aria-label="Quitar grupo" title="Quitar grupo" className="mt-5 cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2.5 grid gap-2 rounded-lg bg-muted/50 p-2.5 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input type="checkbox" className="mt-0.5" checked={g.required} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, required: e.target.checked } : x))} />
                      <span><span className="block text-xs font-semibold">Obligatorio</span>
                      <span className="block text-[11px] text-muted-foreground">Tiene que elegir al menos 1.</span></span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-2">
                      <input type="checkbox" className="mt-0.5" checked={g.multiple} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, multiple: e.target.checked } : x))} />
                      <span><span className="block text-xs font-semibold">Varias opciones</span>
                      <span className="block text-[11px] text-muted-foreground">Puede combinar varias.</span></span>
                    </label>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground" aria-live="polite">{summary}</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-2 px-0 text-[11px] font-medium text-muted-foreground">
                      <span className="min-w-0 flex-1">Opción</span>
                      <span className="w-28 shrink-0">Precio extra ($)</span>
                      <span className="w-9 shrink-0" />
                    </div>
                    {g.modifiers.map((m) => {
                      const pv = Number(m.price);
                      const isFree = m.price.trim() === "" || (Number.isFinite(pv) && pv === 0);
                      return (
                      <div key={m.key}>
                        <div className="flex items-center gap-2">
                          <Input value={m.name} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, modifiers: x.modifiers.map((mm) => mm.key === m.key ? { ...mm, name: e.target.value } : mm) } : x))} placeholder={copy.optionExample} maxLength={60} aria-label="Nombre de la opción" className="min-h-9 min-w-0" />
                          <div className="relative w-28 shrink-0">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                            <Input value={m.price} onChange={(e) => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, modifiers: x.modifiers.map((mm) => mm.key === m.key ? { ...mm, price: e.target.value } : mm) } : x))} placeholder="0" type="number" min={0} aria-label="Precio extra en pesos. 0 = sin cargo" title="Precio extra en pesos. 0 = sin cargo" className="min-h-9 pl-6 tabular-nums" />
                          </div>
                          <button type="button" onClick={() => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, modifiers: x.modifiers.filter((mm) => mm.key !== m.key) } : x))} aria-label="Quitar opción" className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <p className="mt-0.5 pl-0.5 text-[11px] text-muted-foreground">{isFree ? "Sin cargo para el cliente." : `Suma $${m.price} al precio del ${copy.itemSingular}.`}</p>
                      </div>
                      );
                    })}
                    <Button size="sm" variant="ghost" onClick={() => setGroups((p) => p.map((x) => x.key === g.key ? { ...x, modifiers: [...x.modifiers, { key: newId("row"), name: "", price: "0" }] } : x))}><Plus className="h-3.5 w-3.5" /> Opción</Button>
                  </div>
                </div>
                );
              })}
              <Button size="sm" variant="outline" onClick={() => setGroups((p) => [...p, { key: newId("row"), name: "", required: false, multiple: true, modifiers: [{ key: newId("row"), name: "", price: "0" }] }])}><Plus className="h-4 w-4" /> Grupo</Button>
            </div>
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirm} disabled={uploading} className="bg-[#0A2540] hover:bg-[#0A2540]/90">{uploading ? "Subiendo foto..." : state?.mode === "edit" ? "Aplicar" : `Agregar ${copy.itemSingular}`}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    {cropSrc ? (
      <ImageCropDialog
        open
        onOpenChange={(v) => { if (!v) closeCrop(); }}
        image={cropSrc}
        aspect={1}
        title={`Recortar foto del ${copy.itemSingular}`}
        hint={`Cuadrada, se ve en la tarjeta del ${copy.itemSingular}.`}
        output={{ width: 1024, height: 1024 }}
        onDone={uploadCropped}
      />
    ) : null}
    </>
  );
}
